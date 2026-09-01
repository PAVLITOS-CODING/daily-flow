import Dexie, { type EntityTable } from 'dexie'
import type { Item } from './types'

/**
 * Local-first store. A single `items` table, indexed on the fields the
 * three views filter and sort by. `++id` is an auto-incrementing primary key.
 */
export const db = new Dexie('daily-flow') as Dexie & {
  items: EntityTable<Item, 'id'>
}

db.version(1).stores({
  items: '++id, type, context, date, done',
})

export type { Item }
