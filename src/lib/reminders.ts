import type { Item } from '../types'
import { fromISODate, formatTime } from './dates'

/**
 * Local reminders via the Notification API + a service-worker timer.
 *
 * iOS note: web notifications only fire when the app is installed to the home
 * screen and running in standalone mode (iOS 16.4+). Permission is requested
 * lazily — only when the user turns a reminder on for a specific item — so we
 * never prompt on cold load.
 */

export type NotifyState = 'unsupported' | 'default' | 'granted' | 'denied'

const REMINDER_KEY = 'daily-flow:reminders'

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

/** The set of item ids with an active reminder, persisted locally. */
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

/** Combine an item's date + time into an absolute epoch, or null if no time. */
export function reminderTime(item: Item): number | null {
  if (!item.time) return null
  const d = fromISODate(item.date)
  const [h, m] = item.time.split(':').map(Number)
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d.getTime()
}

async function scheduleViaServiceWorker(item: Item, at: number): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.ready
  if (!reg.active) return false
  reg.active.postMessage({
    kind: 'schedule-reminder',
    id: item.id,
    at,
    title: item.title,
    body: reminderBody(item),
  })
  return true
}

function reminderBody(item: Item): string {
  const parts: string[] = []
  if (item.time) parts.push(formatTime(item.time))
  if (item.location) parts.push(item.location)
  return parts.join(' · ') || 'Reminder'
}

/**
 * Turn a reminder on for an item. Returns the resulting permission state so the
 * caller can surface a hint (e.g. denied, or "install to home screen" on iOS).
 */
export async function enableReminder(item: Item): Promise<NotifyState> {
  if (item.id == null) return notificationState()
  const state = await requestPermission()
  if (state !== 'granted') return state

  const at = reminderTime(item)
  if (at !== null && at > Date.now()) {
    await scheduleViaServiceWorker(item, at)
  }

  const ids = loadReminderIds()
  ids.add(item.id)
  saveReminderIds(ids)
  return state
}

export function disableReminder(id: number): void {
  const ids = loadReminderIds()
  ids.delete(id)
  saveReminderIds(ids)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ kind: 'cancel-reminder', id }))
      .catch(() => {})
  }
}

export function hasReminder(id: number | undefined): boolean {
  if (id == null) return false
  return loadReminderIds().has(id)
}
