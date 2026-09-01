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

// In-memory timers. A killed SW loses these, so we also re-check on activate
// against what the page tells us; timers are a best-effort while-alive path.
const timers = new Map<number, ReturnType<typeof setTimeout>>()

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as ReminderMessage | undefined
  if (!data || typeof data !== 'object') return

  if (data.kind === 'schedule-reminder') {
    scheduleReminder(data)
  } else if (data.kind === 'cancel-reminder') {
    const t = timers.get(data.id)
    if (t) {
      clearTimeout(t)
      timers.delete(data.id)
    }
  }
})

function scheduleReminder(msg: ScheduleMessage): void {
  const existing = timers.get(msg.id)
  if (existing) clearTimeout(existing)

  const delay = msg.at - Date.now()
  // setTimeout maxes out around 24.8 days; clamp so it fires correctly.
  const safeDelay = Math.min(Math.max(delay, 0), 2_147_483_647)

  // Resolve icons against the SW scope so they work under any base path.
  const iconUrl = new URL('icon-192.png', self.registration.scope).href

  const timer = setTimeout(() => {
    timers.delete(msg.id)
    void self.registration.showNotification(msg.title, {
      body: msg.body,
      tag: `reminder-${msg.id}`,
      icon: iconUrl,
      badge: iconUrl,
    })
    // Recurring reminder (e.g. daily challenge nudge): re-arm for next time.
    if (msg.repeatMs && msg.repeatMs > 0) {
      scheduleReminder({ ...msg, at: Date.now() + msg.repeatMs })
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
