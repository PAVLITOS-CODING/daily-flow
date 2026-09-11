import { db } from '../db'
import type { PlanChallenge, PlanTask } from '../types'
import { fromISODate, todayISO } from './dates'
import { PLAN_SLUG, PLAN_TITLE, REACT_14_DAYS } from './planData'

const DAY_MS = 86_400_000

/**
 * Create the plan and its tasks once. Idempotent (keyed by slug — no-ops if it
 * already exists) and wrapped in a transaction, so it's safe to call on every
 * mount. Returns the plan's id.
 */
export async function seedPlan(): Promise<number> {
  return db.transaction('rw', db.planChallenges, db.planTasks, async () => {
    const existing = await db.planChallenges.where('slug').equals(PLAN_SLUG).first()
    if (existing?.id != null) return existing.id

    const id = (await db.planChallenges.add({
      slug: PLAN_SLUG,
      title: PLAN_TITLE,
      days: REACT_14_DAYS.length,
      startDate: todayISO(),
    })) as number

    const rows: PlanTask[] = []
    for (const d of REACT_14_DAYS) {
      for (const t of d.tasks) {
        rows.push({ challengeId: id, day: d.day, kind: t.kind, title: t.title, minutes: t.minutes, done: 0 })
      }
    }
    await db.planTasks.bulkAdd(rows)
    return id
  })
}

/** Toggle one task's done flag (0|1), stamping doneAt when it flips on. */
export async function togglePlanTask(task: PlanTask): Promise<void> {
  if (task.id == null) return
  const done: 0 | 1 = task.done ? 0 : 1
  await db.planTasks.update(task.id, { done, doneAt: done ? Date.now() : undefined })
}

/** Static per-day label (not stored in the schema — see planData.ts). */
export function dayLabel(day: number): string {
  return REACT_14_DAYS.find((d) => d.day === day)?.label ?? `Ημέρα ${day}`
}

/** 1-based day number derived from startDate, clamped to 1..days. */
export function currentDayFor(startDate: string, days: number, today = todayISO()): number {
  const elapsed = Math.floor(
    (fromISODate(today).getTime() - fromISODate(startDate).getTime()) / DAY_MS,
  )
  return Math.min(Math.max(elapsed + 1, 1), days)
}

export interface DayProgress {
  day: number
  done: number
  total: number
  complete: boolean
}

export interface PlanStats {
  currentDay: number
  totalDays: number
  todayTasks: PlanTask[]
  /** Current day's minutes by side. */
  theoryMinutes: number
  practiceMinutes: number // practice + ship
  /** Theory share of the current day, 0..1. */
  theoryRatio: number
  /** True when theory exceeds 55% of the day (surfaced as a warning). */
  theoryHeavy: boolean
  doneToday: number
  totalToday: number
  perDay: DayProgress[]
  /** Consecutive fully-complete days up to (and including) the current day. */
  streak: number
  doneTasks: number
  totalTasks: number
}

export function computePlan(
  challenge: PlanChallenge,
  tasks: PlanTask[],
  today = todayISO(),
): PlanStats {
  const totalDays = challenge.days
  const currentDay = currentDayFor(challenge.startDate, totalDays, today)

  const byDay = new Map<number, PlanTask[]>()
  for (const t of tasks) {
    const arr = byDay.get(t.day)
    if (arr) arr.push(t)
    else byDay.set(t.day, [t])
  }

  const perDay: DayProgress[] = []
  for (let d = 1; d <= totalDays; d++) {
    const list = byDay.get(d) ?? []
    const done = list.reduce((n, t) => n + (t.done ? 1 : 0), 0)
    perDay.push({ day: d, done, total: list.length, complete: list.length > 0 && done === list.length })
  }

  const todayTasks = byDay.get(currentDay) ?? []
  let theoryMinutes = 0
  let practiceMinutes = 0
  for (const t of todayTasks) {
    if (t.kind === 'theory') theoryMinutes += t.minutes
    else practiceMinutes += t.minutes
  }
  const totalMin = theoryMinutes + practiceMinutes
  const theoryRatio = totalMin > 0 ? theoryMinutes / totalMin : 0

  // Streak: walk back from the current day (or the day before, if today isn't
  // finished) while each day is fully complete.
  let streak = 0
  let cursor = perDay[currentDay - 1]?.complete ? currentDay : currentDay - 1
  while (cursor >= 1 && perDay[cursor - 1]?.complete) {
    streak += 1
    cursor -= 1
  }

  return {
    currentDay,
    totalDays,
    todayTasks,
    theoryMinutes,
    practiceMinutes,
    theoryRatio,
    theoryHeavy: theoryRatio > 0.55,
    doneToday: todayTasks.reduce((n, t) => n + (t.done ? 1 : 0), 0),
    totalToday: todayTasks.length,
    perDay,
    streak,
    doneTasks: tasks.reduce((n, t) => n + (t.done ? 1 : 0), 0),
    totalTasks: tasks.length,
  }
}
