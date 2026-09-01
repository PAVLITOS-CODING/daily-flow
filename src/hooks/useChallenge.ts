import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Challenge, ChallengeLog } from '../types'

export interface ActiveChallenge {
  challenge: Challenge | null
  logs: ChallengeLog[]
}

/** The current active challenge together with all its day logs. */
export function useActiveChallenge(): ActiveChallenge | undefined {
  return useLiveQuery(async () => {
    const challenge = (await db.challenges.filter((c) => c.active).first()) ?? null
    if (!challenge || challenge.id == null) return { challenge: null, logs: [] }
    const logs = await db.challengeLog.where('challengeId').equals(challenge.id).toArray()
    return { challenge, logs }
  }, [])
}
