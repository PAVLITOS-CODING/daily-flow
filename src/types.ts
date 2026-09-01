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

export type ViewKind = 'today' | 'upcoming' | 'meetings'
