import { db } from '../db'
import type { Challenge, ChallengeLog, ChallengeRule } from '../types'
import { addDays, todayISO } from './dates'

/** The 75 HARD Gang Way rules (from the shared challenge). */
export const SEVENTY_FIVE_HARD_RULES: ChallengeRule[] = [
  { id: 'r1', text: 'Καθόλου αλκοόλ & τσιγάρο' },
  { id: 'r2', text: 'Υγιεινή διατροφή, κανένα cheat meal — όχι γεύμα μετά τις 22:00' },
  { id: 'r3', text: 'Minimum 3 λίτρα νερό' },
  { id: 'r4', text: '2 προπονήσεις (μία ιδανικά εκτός σπιτιού, ≥45′ η καθεμία)' },
  { id: 'r5', text: '45′ σε business ή νέο skill χωρίς περισπασμούς' },
  { id: 'r6', text: 'Διάβασμα ≥15 σελίδες από βιβλίο' },
  { id: 'r7', text: '1 ώρα μετά το ξύπνημα χωρίς κινητό & 3 ώρες χωρίς content/social' },
  { id: 'r8', text: 'Καμία συσκευή στο κρεβάτι το βράδυ' },
  { id: 'r11', text: '15′ ουσιαστική επαφή & συζήτηση με αγαπημένο πρόσωπο' },
]

/**
 * Rule ids dropped from the template after the initial version (the old #9
 * weigh-in/photo and #10 spirituality rules). Kept here so pruneDroppedRules
 * can retrofit any challenge/log created before this change.
 */
const DROPPED_RULE_IDS = new Set(['r9', 'r10'])

export const SEVENTY_FIVE_HARD = {
  title: '75 HARD Gang Way',
  targetDays: 75,
  rules: SEVENTY_FIVE_HARD_RULES,
}

let ruleCounter = 0
export function newRuleId(): string {
  ruleCounter += 1
  return `c${Date.now().toString(36)}${ruleCounter}`
}

/**
 * Start a challenge (deactivating any other active one). If the user was
 * already partway through it before using the app, `alreadyCompletedDays`
 * backdates the start and logs each of those days as fully done, so the
 * streak/day-count reflect real progress instead of resetting to zero.
 */
export async function startChallenge(
  title: string,
  rules: ChallengeRule[],
  targetDays: number,
  alreadyCompletedDays = 0,
): Promise<number> {
  const completed = Math.max(0, Math.min(Math.floor(alreadyCompletedDays), targetDays - 1))
  const startDate = addDays(todayISO(), -completed)

  return db.transaction('rw', db.challenges, db.challengeLog, async () => {
    // Only one active challenge at a time. `active` is boolean, so filter in JS.
    const actives = await db.challenges.filter((c) => c.active).toArray()
    for (const c of actives) if (c.id != null) await db.challenges.update(c.id, { active: false })

    const id = (await db.challenges.add({
      title: title.trim() || 'Challenge',
      rules,
      targetDays,
      startDate,
      active: true,
      createdAt: Date.now(),
    })) as number

    if (completed > 0) {
      const ruleIds = rules.map((r) => r.id)
      const logs: ChallengeLog[] = Array.from({ length: completed }, (_, i) => ({
        challengeId: id,
        date: addDays(startDate, i),
        doneRuleIds: ruleIds,
      }))
      await db.challengeLog.bulkAdd(logs)
    }

    return id
  })
}

/**
 * Retroactively mark `days` days immediately before the challenge's current
 * start date as fully complete, and push the start date back to cover them.
 * For when the user already started the challenge for real (in-app or off)
 * before recording those earlier days.
 */
export async function backfillPastDays(challengeId: number, days: number): Promise<void> {
  const n = Math.max(0, Math.floor(days))
  if (n === 0) return

  await db.transaction('rw', db.challenges, db.challengeLog, async () => {
    const challenge = await db.challenges.get(challengeId)
    if (!challenge) return

    const ruleIds = challenge.rules.map((r) => r.id)
    const newStart = addDays(challenge.startDate, -n)

    for (let i = 0; i < n; i++) {
      const date = addDays(newStart, i)
      const existing = await db.challengeLog.where({ challengeId, date }).first()
      if (existing) await db.challengeLog.update(existing.id!, { doneRuleIds: ruleIds })
      else await db.challengeLog.add({ challengeId, date, doneRuleIds: ruleIds })
    }

    await db.challenges.update(challengeId, { startDate: newStart })
  })
}

/**
 * One-time cleanup for installs that already had the old #9/#10 rules: strip
 * them from any stored challenge and from every day's log, leaving all other
 * progress untouched. Safe no-op once nothing references those ids anymore.
 */
export async function pruneDroppedRules(): Promise<void> {
  const challenges = await db.challenges.toArray()
  for (const c of challenges) {
    if (c.id == null || !c.rules.some((r) => DROPPED_RULE_IDS.has(r.id))) continue

    await db.challenges.update(c.id, { rules: c.rules.filter((r) => !DROPPED_RULE_IDS.has(r.id)) })

    const logs = await db.challengeLog.where('challengeId').equals(c.id).toArray()
    for (const log of logs) {
      if (!log.doneRuleIds.some((id) => DROPPED_RULE_IDS.has(id))) continue
      await db.challengeLog.update(log.id!, {
        doneRuleIds: log.doneRuleIds.filter((id) => !DROPPED_RULE_IDS.has(id)),
      })
    }
  }
}

/** Toggle a single rule for a given day, creating the day's log if needed. */
export async function toggleRule(
  challengeId: number,
  date: string,
  ruleId: string,
): Promise<void> {
  await db.transaction('rw', db.challengeLog, async () => {
    const existing = await db.challengeLog.where({ challengeId, date }).first()
    if (!existing) {
      await db.challengeLog.add({ challengeId, date, doneRuleIds: [ruleId] })
      return
    }
    const has = existing.doneRuleIds.includes(ruleId)
    const doneRuleIds = has
      ? existing.doneRuleIds.filter((r) => r !== ruleId)
      : [...existing.doneRuleIds, ruleId]
    await db.challengeLog.update(existing.id!, { doneRuleIds })
  })
}

/** Wipe progress and restart the current attempt from today (day 1). */
export async function restartChallenge(challengeId: number): Promise<void> {
  await db.transaction('rw', db.challenges, db.challengeLog, async () => {
    await db.challengeLog.where('challengeId').equals(challengeId).delete()
    await db.challenges.update(challengeId, { startDate: todayISO() })
  })
}

/** Abandon: deactivate and remove its logs, returning to the chooser. */
export async function abandonChallenge(challengeId: number): Promise<void> {
  await db.transaction('rw', db.challenges, db.challengeLog, async () => {
    await db.challengeLog.where('challengeId').equals(challengeId).delete()
    await db.challenges.update(challengeId, { active: false })
  })
}

// --- Derived stats ---------------------------------------------------------

export interface ChallengeStats {
  /** Consecutive fully-complete days ending today (or yesterday if today is
   *  still in progress). Resets to 0 the moment a day is missed. */
  streak: number
  /** The day number of the current attempt (1-based). */
  currentDay: number
  todayComplete: boolean
  todayDoneCount: number
  totalRules: number
  /** completed days / elapsed days since start, as a 0–100 percentage. */
  consistency: number
  completedDays: number
  elapsedDays: number
  finished: boolean
}

function isComplete(log: ChallengeLog | undefined, totalRules: number): boolean {
  return !!log && log.doneRuleIds.length >= totalRules
}

export function computeStats(challenge: Challenge, logs: ChallengeLog[]): ChallengeStats {
  const totalRules = challenge.rules.length
  const today = todayISO()

  const byDate = new Map<string, ChallengeLog>()
  for (const l of logs) byDate.set(l.date, l)

  const ruleIds = new Set(challenge.rules.map((r) => r.id))
  const completeOn = (date: string): boolean => {
    const l = byDate.get(date)
    if (!l) return false
    // Count only rules that still exist on the challenge.
    const done = l.doneRuleIds.filter((r) => ruleIds.has(r))
    return done.length >= totalRules
  }

  const todayComplete = completeOn(today)
  const todayLog = byDate.get(today)
  const todayDoneCount = todayLog
    ? todayLog.doneRuleIds.filter((r) => ruleIds.has(r)).length
    : 0

  // Streak: walk backwards from today (or yesterday if today isn't done yet).
  let streak = 0
  let cursor = todayComplete ? today : addDays(today, -1)
  while (completeOn(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  const currentDay = Math.min(todayComplete ? streak : streak + 1, challenge.targetDays)

  // Consistency across the whole attempt window.
  let elapsedDays = 1
  {
    const start = new Date(challenge.startDate).getTime()
    const now = new Date(today).getTime()
    elapsedDays = Math.max(1, Math.round((now - start) / 86_400_000) + 1)
  }
  let completedDays = 0
  for (const l of logs) if (isComplete(l, totalRules) && l.date >= challenge.startDate) completedDays += 1
  const consistency = Math.min(100, Math.round((completedDays / elapsedDays) * 100))

  return {
    streak,
    currentDay,
    todayComplete,
    todayDoneCount,
    totalRules,
    consistency,
    completedDays,
    elapsedDays,
    finished: streak >= challenge.targetDays,
  }
}
