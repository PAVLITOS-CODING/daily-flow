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
  { id: 'r9', text: 'Καθημερινό ζύγισμα & φωτογραφία προόδου' },
  { id: 'r10', text: '≥15′ πνευματικότητα — meditation / προσευχή / journaling' },
  { id: 'r11', text: '15′ ουσιαστική επαφή & συζήτηση με αγαπημένο πρόσωπο' },
]

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

/** Start a challenge (deactivating any other active one). */
export async function startChallenge(
  title: string,
  rules: ChallengeRule[],
  targetDays: number,
): Promise<number> {
  return db.transaction('rw', db.challenges, async () => {
    // Only one active challenge at a time. `active` is boolean, so filter in JS.
    const actives = await db.challenges.filter((c) => c.active).toArray()
    for (const c of actives) if (c.id != null) await db.challenges.update(c.id, { active: false })

    return db.challenges.add({
      title: title.trim() || 'Challenge',
      rules,
      targetDays,
      startDate: todayISO(),
      active: true,
      createdAt: Date.now(),
    }) as Promise<number>
  })
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

/**
 * Backfill an already-running streak: mark the `days` days ending yesterday as
 * fully complete, and move `startDate` back so the day count and consistency
 * line up. For when you started the challenge before installing the app.
 * Returns the number of days actually filled.
 */
export async function backfillCompletedDays(
  challenge: Challenge,
  days: number,
): Promise<number> {
  if (challenge.id == null) return 0
  const id = challenge.id
  // Never fill more than the whole target, and always keep today for "in progress".
  const count = Math.max(0, Math.min(Math.floor(days), challenge.targetDays))
  if (count === 0) return 0
  const allRuleIds = challenge.rules.map((r) => r.id)
  const today = todayISO()

  await db.transaction('rw', db.challenges, db.challengeLog, async () => {
    for (let i = 1; i <= count; i++) {
      const date = addDays(today, -i)
      const existing = await db.challengeLog.where({ challengeId: id, date }).first()
      if (existing?.id != null) {
        await db.challengeLog.update(existing.id, { doneRuleIds: [...allRuleIds] })
      } else {
        await db.challengeLog.add({ challengeId: id, date, doneRuleIds: [...allRuleIds] })
      }
    }
    // Anchor the attempt so elapsed days match the backfilled streak.
    await db.challenges.update(id, { startDate: addDays(today, -count) })
  })
  return count
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
