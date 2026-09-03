/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// --- Offline precache (manifest injected by vite-plugin-pwa) ---------------
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// autoUpdate: take control as soon as the new SW activates.
self.skipWaiting()
clientsClaim()

// --- Local reminders -------------------------------------------------------
interface ScheduleMessage {
  kind: 'schedule-reminder'
  id: number
  at: number
  title: string
  body: string
  /** If set, re-arm the same reminder this many ms after it fires (daily nudge). */
  repeatMs?: number
}
interface CancelMessage {
  kind: 'cancel-reminder'
  id: number
}
type ReminderMessage = ScheduleMessage | CancelMessage

// --- Notification Triggers API (Chromium) — ambient types ------------------
// Lets us hand a timestamp to the OS so the notification fires even when the
// app and this service worker are closed. Not in the standard DOM lib yet.
declare class TimestampTrigger {
  constructor(timestamp: number)
}
interface TriggerNotificationOptions extends NotificationOptions {
  showTrigger?: TimestampTrigger
}
interface TriggeredGetOptions {
  tag?: string
  includeTriggered?: boolean
}

const triggersSupported = 'showTrigger' in Notification.prototype

// In-memory timers for the fallback path. A killed SW loses these, so we also
// re-arm on launch from the page; timers are a best-effort while-alive path.
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function reminderTag(id: number): string {
  return `reminder-${id}`
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as ReminderMessage | undefined
  if (!data || typeof data !== 'object') return

  if (data.kind === 'schedule-reminder') {
    event.waitUntil(scheduleReminder(data))
  } else if (data.kind === 'cancel-reminder') {
    event.waitUntil(cancelReminder(data.id))
  }
})

async function cancelReminder(id: number): Promise<void> {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
  // Drop any notification the OS is holding for a future trigger.
  const pending = await self.registration.getNotifications({
    tag: reminderTag(id),
    includeTriggered: true,
  } as TriggeredGetOptions)
  for (const n of pending) n.close()
}

function fireOptions(msg: ScheduleMessage): NotificationOptions {
  // Resolve icons against the SW scope so they work under any base path.
  const iconUrl = new URL('icon-192.png', self.registration.scope).href
  return {
    body: msg.body,
    tag: reminderTag(msg.id),
    icon: iconUrl,
    badge: iconUrl,
    // Keep it on screen until dismissed; timed reminders are easy to miss.
    requireInteraction: true,
  }
}

async function scheduleReminder(msg: ScheduleMessage): Promise<void> {
  // Clear whatever is already armed for this id (either path).
  await cancelReminder(msg.id)

  if (triggersSupported) {
    // OS-scheduled: fires even if the app / SW is not running.
    const options: TriggerNotificationOptions = {
      ...fireOptions(msg),
      showTrigger: new TimestampTrigger(msg.at),
    }
    await self.registration.showNotification(msg.title, options)
    // A repeating nudge (daily challenge) can't self-perpetuate in the
    // background with a one-shot trigger; opening the app re-arms the next one.
    return
  }

  // Fallback: only fires while this service worker stays alive.
  const delay = msg.at - Date.now()
  // setTimeout maxes out around 24.8 days; clamp so it fires correctly.
  const safeDelay = Math.min(Math.max(delay, 0), 2_147_483_647)

  const timer = setTimeout(() => {
    timers.delete(msg.id)
    void self.registration.showNotification(msg.title, fireOptions(msg))
    // Recurring reminder (e.g. daily challenge nudge): re-arm for next time.
    if (msg.repeatMs && msg.repeatMs > 0) {
      void scheduleReminder({ ...msg, at: Date.now() + msg.repeatMs })
    }
  }, safeDelay)

  timers.set(msg.id, timer)
}

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(self.registration.scope)
    }),
  )
})
