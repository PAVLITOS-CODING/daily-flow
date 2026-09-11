export type ItemType = 'task' | 'event' | 'meeting'
export type Context = 'personal' | 'work'
export type Priority = 'low' | 'med' | 'high'
export type Recurring = 'none' | 'daily' | 'weekly'

export interface Item {
  id?: number
  title: string
  type: ItemType
  context: Context
  /** ISO calendar date, YYYY-MM-DD */
  date: string
  /** HH:mm, for events / meetings */
  time?: string
  location?: string
  priority?: Priority
  recurring: Recurring
  done: boolean
  createdAt: number
}

/** Shape used by the quick-add and edit forms (id + createdAt are managed by the db). */
export type ItemDraft = Omit<Item, 'id' | 'createdAt'>

export type ViewKind = 'today' | 'upcoming' | 'meetings' | 'calendar' | 'challenge' | 'plan'

// --- Challenges (habit streaks, e.g. 75 HARD) ------------------------------

export interface ChallengeRule {
  /** Stable id so daily logs survive rule reordering/edits. */
  id: string
  text: string
}

export interface Challenge {
  id?: number
  title: string
  rules: ChallengeRule[]
  /** Consecutive days required to complete (e.g. 75). */
  targetDays: number
  /** YYYY-MM-DD the current attempt began. */
  startDate: string
  active: boolean
  createdAt: number
}

/** One day's record for a challenge: which rule ids were checked off. */
export interface ChallengeLog {
  id?: number
  challengeId: number
  /** YYYY-MM-DD */
  date: string
  doneRuleIds: string[]
}

// --- Learning plans (day-by-day study plan, e.g. React in 14 days) ---------
// Distinct from the habit Challenge above: a fixed sequence of days, each with
// a handful of typed tasks. Backed by its own Dexie tables (planChallenges /
// planTasks) so it never touches the habit-challenge data.

export type PlanTaskKind = 'theory' | 'practice' | 'ship'
export type PlanResourceType = 'docs' | 'video' | 'article' | 'practice'

/** A study link shown in a task's "what to read" popup. */
export interface PlanResource {
  label: string
  url: string
  type: PlanResourceType
}

export interface PlanChallenge {
  id?: number
  /** Stable identifier used to seed idempotently (e.g. 'react-14-days'). */
  slug: string
  title: string
  /** Total number of days in the plan. */
  days: number
  /** YYYY-MM-DD the plan started (drives the current-day calculation). */
  startDate: string
  /** Seed-content revision (see plan.ts). Lets content upgrade without wiping progress. */
  contentVersion?: number
  /** Epoch ms when archived, if the user ever archives it. */
  archivedAt?: number
}

export interface PlanTask {
  id?: number
  challengeId: number
  /** Stable content key ("day-index", e.g. '1-2') so progress survives content edits. */
  key: string
  /** 1..days */
  day: number
  kind: PlanTaskKind
  title: string
  /** One friendly sentence: exactly what to do for this step. */
  detail?: string
  /** Study links surfaced in the "what to read" popup. */
  resources?: PlanResource[]
  notes?: string
  /** Estimated minutes for this task. */
  minutes: number
  /** 0 | 1 — IndexedDB can't index booleans, so done is a number. */
  done: 0 | 1
  /** Epoch ms when marked done. */
  doneAt?: number
}
