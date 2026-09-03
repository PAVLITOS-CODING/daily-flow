import type { Item } from '../types'
import { fromISODate } from './dates'
import { LEAD_MINUTES } from './reminders'

/**
 * iCalendar (.ics) export — the reliable, server-free way to get a timed
 * reminder on iOS. The user taps "Add to Calendar" on a timed item; iOS imports
 * a VEVENT with a VALARM set to LEAD_MINUTES before the start, and the native
 * Calendar app fires the alert — even with this app fully closed.
 *
 * Times are emitted as "floating" local time (no timezone), i.e. they mean the
 * same wall-clock time wherever the device is — which is what a personal
 * schedule wants. Nothing here leaves the device except into the user's own
 * Calendar.
 */

const EVENT_MINUTES = 30 // default block length for the calendar entry

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Floating local timestamp: YYYYMMDDTHHMMSS (no timezone suffix). */
function floatingLocal(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

/** UTC timestamp with trailing Z, for DTSTAMP. */
function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** Escape a TEXT value per RFC 5545. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** True only for timed items — an alarm needs a start time to anchor to. */
export function canAddToCalendar(item: Item): boolean {
  return Boolean(item.time)
}

/** Build the .ics text for one item (VEVENT + a LEAD_MINUTES VALARM). */
export function itemToICS(item: Item): string {
  const start = fromISODate(item.date)
  const [h, m] = (item.time ?? '00:00').split(':').map(Number)
  start.setHours(h ?? 0, m ?? 0, 0, 0)
  const end = new Date(start.getTime() + EVENT_MINUTES * 60_000)
  const uid = `daily-flow-${item.id ?? 'x'}-${item.date}-${item.time ?? 'na'}@daily-flow`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daily Flow//Reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${floatingLocal(start)}`,
    `DTEND:${floatingLocal(end)}`,
    `SUMMARY:${escapeText(item.title)}`,
  ]
  if (item.location) lines.push(`LOCATION:${escapeText(item.location)}`)
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(item.title)}`,
    `TRIGGER:-PT${LEAD_MINUTES}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  )
  return lines.join('\r\n')
}

function fileSlug(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return s || 'event'
}

/**
 * Hand the .ics to the OS. On iOS/desktop this opens the Calendar "add event"
 * sheet; the native Calendar then owns the reminder. Returns false if the
 * browser gave us no way to do it.
 */
export function addToCalendar(item: Item): boolean {
  if (!canAddToCalendar(item)) return false
  try {
    const ics = itemToICS(item)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileSlug(item.title)}.ics`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return true
  } catch {
    return false
  }
}
