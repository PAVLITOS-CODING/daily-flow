import Dexie, { type EntityTable } from 'dexie'
import type { Item, Challenge, ChallengeLog, PlanChallenge, PlanTask } from './types'

/**
 * Local-first store. `items` is indexed on the fields the views filter and
 * sort by; `challenges` + `challengeLog` back the habit-challenge tracker;
 * `planChallenges` + `planTasks` back the day-by-day learning plans.
 * `++id` is an auto-incrementing primary key.
 */
export const db = new Dexie('daily-flow') as Dexie & {
  items: EntityTable<Item, 'id'>
  challenges: EntityTable<Challenge, 'id'>
  challengeLog: EntityTable<ChallengeLog, 'id'>
  planChallenges: EntityTable<PlanChallenge, 'id'>
  planTasks: EntityTable<PlanTask, 'id'>
}

db.version(1).stores({
  items: '++id, type, context, date, done',
})

// v2 adds the challenge tables. Existing `items` data is preserved untouched.
db.version(2).stores({
  challenges: '++id, active',
  challengeLog: '++id, challengeId, date, [challengeId+date]',
})

// v3 adds the learning-plan tables (additive; existing data is untouched).
db.version(3).stores({
  planChallenges: '++id, slug, startDate',
  planTasks: '++id, challengeId, day, done, [challengeId+day]',
})

export type { Item }
