import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { PlanChallenge } from '../types'
import { PLAN_SLUG } from '../lib/planData'
import { computePlan, type PlanStats } from '../lib/plan'

export interface PlanView {
  challenge: PlanChallenge
  stats: PlanStats
}

/**
 * The seeded learning plan together with its derived stats (current day,
 * today's tasks, theory/practice ratio, completion counts, streak).
 * `undefined` while loading, `null` until the plan has been seeded.
 */
export function usePlan(): PlanView | null | undefined {
  return useLiveQuery(async () => {
    const challenge = await db.planChallenges.where('slug').equals(PLAN_SLUG).first()
    if (!challenge || challenge.id == null) return null
    const tasks = await db.planTasks.where('challengeId').equals(challenge.id).toArray()
    return { challenge, stats: computePlan(challenge, tasks) }
  }, [])
}
