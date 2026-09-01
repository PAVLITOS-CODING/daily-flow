import { db } from '../db'
import type { Item, Challenge, ChallengeLog } from '../types'
import { todayISO } from './dates'

/**
 * Backup / restore. The whole local database serialised to a single JSON file
 * the user can save anywhere and reload on another device or host. This is the
 * safety net for a local-first app: data lives per-origin, so moving hosts or
 * phones starts empty unless the user carries a backup across.
 */

interface Backup {
  app: 'daily-flow'
  schema: number
  exportedAt: number
  items: Item[]
  challenges: Challenge[]
  challengeLog: ChallengeLog[]
}

async function buildBackup(): Promise<Backup> {
  const [items, challenges, challengeLog] = await Promise.all([
    db.items.toArray(),
    db.challenges.toArray(),
    db.challengeLog.toArray(),
  ])
  return { app: 'daily-flow', schema: 2, exportedAt: Date.now(), items, challenges, challengeLog }
}

export type ExportResult = 'shared' | 'downloaded' | 'copied' | 'failed'

/** Try the nicest available way to hand the backup file to the user. */
export async function exportBackup(): Promise<ExportResult> {
  const json = JSON.stringify(await buildBackup(), null, 2)
  const filename = `daily-flow-backup-${todayISO()}.json`
  const blob = new Blob([json], { type: 'application/json' })

  // 1) Native share sheet (best on iOS installed PWAs).
  try {
    const file = new File([blob], filename, { type: 'application/json' })
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], title: 'Daily Flow backup' })
      return 'shared'
    }
  } catch {
    /* user cancelled or unsupported — fall through */
  }

  // 2) Classic download.
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'downloaded'
  } catch {
    /* fall through */
  }

  // 3) Clipboard as a last resort.
  try {
    await navigator.clipboard.writeText(json)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export interface ImportCounts {
  items: number
  challenges: number
  logs: number
}

/** Replace the local database with the contents of a backup file. */
export async function importBackup(json: string): Promise<ImportCounts> {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Το αρχείο δεν είναι έγκυρο JSON.')
  }
  if (
    !data ||
    typeof data !== 'object' ||
    (data as Backup).app !== 'daily-flow' ||
    !Array.isArray((data as Backup).items)
  ) {
    throw new Error('Δεν φαίνεται για backup του Daily Flow.')
  }
  const b = data as Backup
  const challenges = Array.isArray(b.challenges) ? b.challenges : []
  const challengeLog = Array.isArray(b.challengeLog) ? b.challengeLog : []

  await db.transaction('rw', db.items, db.challenges, db.challengeLog, async () => {
    await Promise.all([db.items.clear(), db.challenges.clear(), db.challengeLog.clear()])
    await db.items.bulkPut(b.items)
    await db.challenges.bulkPut(challenges)
    await db.challengeLog.bulkPut(challengeLog)
  })

  return { items: b.items.length, challenges: challenges.length, logs: challengeLog.length }
}
