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

export type ViewKind = 'today' | 'upcoming' | 'meetings' | 'challenge'

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
