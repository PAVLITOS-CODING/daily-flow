import { db } from '../db'
import type { Item, ItemDraft, Priority } from '../types'
import { addDays } from './dates'

/** Higher number = more urgent, used for Upcoming sorting. */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  med: 2,
  low: 1,
}

export async function createItem(draft: ItemDraft): Promise<number> {
  const item: Item = { ...draft, createdAt: Date.now() }
  return db.items.add(item) as Promise<number>
}

export async function updateItem(id: number, changes: Partial<Item>): Promise<void> {
  await db.items.update(id, changes)
}

export async function deleteItem(id: number): Promise<void> {
  await db.items.delete(id)
}

/**
 * Toggle an item's done state. When a recurring task is completed, spawn the
 * next instance on the following day (daily) or week (weekly) — unless one
 * already exists for that date, so double-taps don't pile up duplicates.
 */
export async function toggleDone(item: Item): Promise<void> {
  if (item.id == null) return
  const next = !item.done

  await db.transaction('rw', db.items, async () => {
    await db.items.update(item.id!, { done: next })

    if (next && item.recurring !== 'none') {
      const step = item.recurring === 'daily' ? 1 : 7
      const nextDate = addDays(item.date, step)

      const exists = await db.items
        .where('date')
        .equals(nextDate)
        .filter(
          (candidate) =>
            candidate.title === item.title &&
            candidate.type === item.type &&
            candidate.recurring === item.recurring &&
            candidate.context === item.context,
        )
        .count()

      if (exists === 0) {
        const spawn: Item = {
          title: item.title,
          type: item.type,
          context: item.context,
          date: nextDate,
          recurring: item.recurring,
          done: false,
          createdAt: Date.now(),
          ...(item.time !== undefined ? { time: item.time } : {}),
          ...(item.location !== undefined ? { location: item.location } : {}),
          ...(item.priority !== undefined ? { priority: item.priority } : {}),
        }
        await db.items.add(spawn)
      }
    }
  })
}
