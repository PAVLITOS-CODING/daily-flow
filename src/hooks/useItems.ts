import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Item } from '../types'
import { todayISO, fromISODate } from '../lib/dates'
import { PRIORITY_WEIGHT } from '../lib/store'

/** Tasks/events dated today (both open and done, done sinks to the bottom). */
export function useToday(): Item[] | undefined {
  return useLiveQuery(async () => {
    const today = todayISO()
    const rows = await db.items.where('date').equals(today).toArray()
    return rows
      .filter((i) => i.type !== 'meeting')
      .sort(byDoneThenPriorityThenTime)
  }, [])
}

/** Open tasks/events from today onward, ranked by priority then date/time. */
export function useUpcoming(): Item[] | undefined {
  return useLiveQuery(async () => {
    const today = todayISO()
    const rows = await db.items
      .where('date')
      .aboveOrEqual(today)
      .and((i) => !i.done && i.type !== 'meeting')
      .toArray()
    return rows.sort(byPriorityThenDate)
  }, [])
}

/** Every item, for the calendar view (includes done + all dates). */
export function useAllItems(): Item[] | undefined {
  return useLiveQuery(() => db.items.toArray(), [])
}

/** Open meetings from today onward, soonest first. */
export function useMeetings(): Item[] | undefined {
  return useLiveQuery(async () => {
    const today = todayISO()
    const rows = await db.items
      .where('type')
      .equals('meeting')
      .and((i) => !i.done && i.date >= today)
      .toArray()
    return rows.sort(byDateThenTime)
  }, [])
}

function timeRank(t?: string): number {
  if (!t) return 24 * 60 + 1 // untimed items sort after timed ones
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function byDoneThenPriorityThenTime(a: Item, b: Item): number {
  if (a.done !== b.done) return a.done ? 1 : -1
  const p = (PRIORITY_WEIGHT[b.priority ?? 'low'] ?? 0) - (PRIORITY_WEIGHT[a.priority ?? 'low'] ?? 0)
  if (p !== 0) return p
  return timeRank(a.time) - timeRank(b.time)
}

/**
 * Blend imminence and urgency: an item's rank is its distance in days from
 * today, pulled earlier by priority (a high-priority task surfaces ~2 days
 * ahead of a low-priority one on the same day). Lower score ranks first.
 */
function urgencyScore(item: Item): number {
  const today = fromISODate(todayISO()).getTime()
  const dayOffset = Math.round((fromISODate(item.date).getTime() - today) / 86_400_000)
  const lift = (PRIORITY_WEIGHT[item.priority ?? 'low'] ?? 1) - 1 // 0 | 1 | 2
  return dayOffset - lift
}

function byPriorityThenDate(a: Item, b: Item): number {
  const s = urgencyScore(a) - urgencyScore(b)
  if (s !== 0) return s
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return timeRank(a.time) - timeRank(b.time)
}

function byDateThenTime(a: Item, b: Item): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return timeRank(a.time) - timeRank(b.time)
}
