import Dexie, { type EntityTable } from 'dexie'
import type { Item, Challenge, ChallengeLog } from './types'

/**
 * Local-first store. `items` is indexed on the fields the views filter and
 * sort by; `challenges` + `challengeLog` back the challenge tracker.
 * `++id` is an auto-incrementing primary key.
 */
export const db = new Dexie('daily-flow') as Dexie & {
  items: EntityTable<Item, 'id'>
  challenges: EntityTable<Challenge, 'id'>
  challengeLog: EntityTable<ChallengeLog, 'id'>
}

db.version(1).stores({
  items: '++id, type, context, date, done',
})

// v2 adds the challenge tables. Existing `items` data is preserved untouched.
db.version(2).stores({
  challenges: '++id, active',
  challengeLog: '++id, challengeId, date, [challengeId+date]',
})

export type { Item }
