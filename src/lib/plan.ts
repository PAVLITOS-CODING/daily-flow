import { db } from '../db'
import type { PlanChallenge, PlanTask } from '../types'
import { fromISODate, todayISO } from './dates'
import { PLAN_CONTENT_VERSION, PLAN_SLUG, PLAN_TITLE, REACT_14_DAYS } from './planData'

const DAY_MS = 86_400_000

/** Build the full task list for a plan from the current static content. */
function buildTasks(challengeId: number): PlanTask[] {
  const rows: PlanTask[] = []
  for (const d of REACT_14_DAYS) {
    for (const t of d.tasks) {
      rows.push({
        challengeId,
        key: t.key,
        day: d.day,
        kind: t.kind,
        title: t.title,
        detail: t.detail,
        resources: t.resources,
        minutes: t.minutes,
        done: 0,
      })
    }
  }
  return rows
}

/**
 * Ensure the plan exists and its tasks match the current content. Idempotent
 * and transactional, so it's safe to call on every mount:
 *  - first run: creates the plan + tasks;
 *  - after a content update (PLAN_CONTENT_VERSION bumped): re-seeds the tasks,
 *    carrying over which steps were already done (matched by their stable key);
 *  - otherwise: no-ops.
 * Returns the plan's id.
 */
export async function seedPlan(): Promise<number> {
  return db.transaction('rw', db.planChallenges, db.planTasks, async () => {
    const existing = await db.planChallenges.where('slug').equals(PLAN_SLUG).first()

    if (!existing || existing.id == null) {
      const id = (await db.planChallenges.add({
        slug: PLAN_SLUG,
        title: PLAN_TITLE,
        days: REACT_14_DAYS.length,
        startDate: todayISO(),
        contentVersion: PLAN_CONTENT_VERSION,
      })) as number
      await db.planTasks.bulkAdd(buildTasks(id))
      return id
    }

    if (existing.contentVersion !== PLAN_CONTENT_VERSION) {
      const old = await db.planTasks.where('challengeId').equals(existing.id).toArray()
      const doneKeys = new Set(old.filter((t) => t.done && t.key).map((t) => t.key))
      await db.planTasks.where('challengeId').equals(existing.id).delete()
      const rows = buildTasks(existing.id).map((t) =>
        doneKeys.has(t.key) ? { ...t, done: 1 as const, doneAt: Date.now() } : t,
      )
      await db.planTasks.bulkAdd(rows)
      await db.planChallenges.update(existing.id, {
        contentVersion: PLAN_CONTENT_VERSION,
        title: PLAN_TITLE,
        days: REACT_14_DAYS.length,
      })
    }

    return existing.id
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

/** Static per-day focus line (not stored in the schema — see planData.ts). */
export function dayFocus(day: number): string {
  return REACT_14_DAYS.find((d) => d.day === day)?.focus ?? ''
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
