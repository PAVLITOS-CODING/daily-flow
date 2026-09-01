import type { Item } from '../types'
import { db } from '../db'
import { fromISODate, formatTime } from './dates'

/**
 * Local reminders via the Notification API + a service-worker timer.
 *
 * Event/meeting reminders fire LEAD_MINUTES before the item's time. A daily
 * challenge nudge can also be scheduled.
 *
 * iOS note: web notifications only fire when the app is installed to the home
 * screen and running in standalone mode (iOS 16.4+). Because there is no push
 * server (by design — the app is fully local/private), delivery is best-effort:
 * timers live in the service worker, which the OS may suspend. Opening the app
 * re-arms everything (`rearmReminders`), so keeping it on the home screen and
 * launching it daily is the most reliable setup. Permission is requested
 * lazily — only when the user turns a reminder on.
 */

export type NotifyState = 'unsupported' | 'default' | 'granted' | 'denied'

/** How long before an event/meeting the reminder fires. */
export const LEAD_MINUTES = 60

const REMINDER_KEY = 'daily-flow:reminders'
const CHALLENGE_KEY = 'daily-flow:challenge-reminder'
/** Fixed, out-of-range id so the challenge timer never collides with item ids. */
const CHALLENGE_TIMER_ID = 900_719_925
const DAY_MS = 86_400_000

export function notificationState(): NotifyState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as NotifyState
}

/** True on iOS home-screen installs and any standalone PWA context. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    iosStandalone === true
  )
}

export async function requestPermission(): Promise<NotifyState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') {
    return Notification.permission as NotifyState
  }
  const result = await Notification.requestPermission()
  return result as NotifyState
}

// --- Event / meeting reminders --------------------------------------------

export function loadReminderIds(): Set<number> {
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((n): n is number => typeof n === 'number'))
  } catch {
    return new Set()
  }
}

function saveReminderIds(ids: Set<number>): void {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify([...ids]))
  } catch {
    /* storage full or blocked — best effort only */
  }
}

/** Absolute epoch of the item's date+time, or null if it has no time. */
export function reminderTime(item: Item): number | null {
  if (!item.time) return null
  const d = fromISODate(item.date)
  const [h, m] = item.time.split(':').map(Number)
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d.getTime()
}

/** When the reminder should fire: LEAD_MINUTES before the event. */
export function reminderFireTime(item: Item): number | null {
  const at = reminderTime(item)
  return at === null ? null : at - LEAD_MINUTES * 60_000
}

async function postToSW(message: Record<string, unknown>): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    if (!reg.active) return false
    reg.active.postMessage(message)
    return true
  } catch {
    return false
  }
}

function reminderBody(item: Item): string {
  const parts = [`Σε ${LEAD_MINUTES}′`]
  if (item.time) parts.push(formatTime(item.time))
  if (item.location) parts.push(item.location)
  return parts.join(' · ')
}

function scheduleItem(item: Item): void {
  const fire = reminderFireTime(item)
  const eventAt = reminderTime(item)
  if (fire === null || eventAt === null) return
  if (eventAt <= Date.now()) return // event already passed
  // If we're already inside the lead window, fire shortly instead of never.
  const at = Math.max(fire, Date.now() + 3_000)
  void postToSW({
    kind: 'schedule-reminder',
    id: item.id,
    at,
    title: item.title,
    body: reminderBody(item),
  })
}

/**
 * Turn a reminder on for an item. Returns the resulting permission state so the
 * caller can surface a hint (denied, or "install to home screen" on iOS).
 */
export async function enableReminder(item: Item): Promise<NotifyState> {
  if (item.id == null) return notificationState()
  const state = await requestPermission()
  if (state !== 'granted') return state

  scheduleItem(item)
  const ids = loadReminderIds()
  ids.add(item.id)
  saveReminderIds(ids)
  return state
}

export function disableReminder(id: number): void {
  const ids = loadReminderIds()
  ids.delete(id)
  saveReminderIds(ids)
  void postToSW({ kind: 'cancel-reminder', id })
}

export function hasReminder(id: number | undefined): boolean {
  if (id == null) return false
  return loadReminderIds().has(id)
}

/**
 * Re-arm all persisted reminders against current data. Called on launch so the
 * service worker's timers survive suspension. Prunes reminders whose item is
 * gone, done, or already past.
 */
export async function rearmReminders(): Promise<void> {
  if (notificationState() !== 'granted') return
  const ids = loadReminderIds()
  if (ids.size === 0) return
  const next = new Set<number>()
  for (const id of ids) {
    const item = await db.items.get(id)
    const eventAt = item ? reminderTime(item) : null
    if (item && !item.done && eventAt !== null && eventAt > Date.now()) {
      scheduleItem(item)
      next.add(id)
    } else {
      void postToSW({ kind: 'cancel-reminder', id })
    }
  }
  saveReminderIds(next)
}

// --- Daily challenge reminder ---------------------------------------------

export interface ChallengeReminder {
  enabled: boolean
  /** HH:mm of day to nudge. */
  time: string
}

const DEFAULT_CHALLENGE_REMINDER: ChallengeReminder = { enabled: false, time: '20:00' }

export function loadChallengeReminder(): ChallengeReminder {
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY)
    if (!raw) return { ...DEFAULT_CHALLENGE_REMINDER }
    const parsed = JSON.parse(raw) as Partial<ChallengeReminder>
    return {
      enabled: parsed.enabled === true,
      time: typeof parsed.time === 'string' ? parsed.time : DEFAULT_CHALLENGE_REMINDER.time,
    }
  } catch {
    return { ...DEFAULT_CHALLENGE_REMINDER }
  }
}

function saveChallengeReminder(cfg: ChallengeReminder): void {
  try {
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(cfg))
  } catch {
    /* best effort */
  }
}

/** Next epoch at HH:mm today (if still future) or tomorrow. */
function nextDailyAt(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h ?? 20, m ?? 0, 0, 0)
  if (d.getTime() <= Date.now()) d.setTime(d.getTime() + DAY_MS)
  return d.getTime()
}

function scheduleChallengeDaily(time: string, title: string): void {
  void postToSW({
    kind: 'schedule-reminder',
    id: CHALLENGE_TIMER_ID,
    at: nextDailyAt(time),
    repeatMs: DAY_MS,
    title,
    body: 'Μη σπάσεις το σερί σου — τσέκαρε τους σημερινούς κανόνες.',
  })
}

/** Enable/refresh the daily challenge nudge; returns permission state. */
export async function enableChallengeReminder(time: string, title: string): Promise<NotifyState> {
  const state = await requestPermission()
  if (state !== 'granted') return state
  saveChallengeReminder({ enabled: true, time })
  scheduleChallengeDaily(time, title)
  return state
}

export function disableChallengeReminder(): void {
  saveChallengeReminder({ ...loadChallengeReminder(), enabled: false })
  void postToSW({ kind: 'cancel-reminder', id: CHALLENGE_TIMER_ID })
}

/** Re-arm the daily challenge nudge on launch, if enabled and a challenge is active. */
export async function rearmChallengeReminder(): Promise<void> {
  if (notificationState() !== 'granted') return
  const cfg = loadChallengeReminder()
  if (!cfg.enabled) return
  const active = await db.challenges.filter((c) => c.active).first()
  if (active) scheduleChallengeDaily(cfg.time, active.title)
  else void postToSW({ kind: 'cancel-reminder', id: CHALLENGE_TIMER_ID })
}
