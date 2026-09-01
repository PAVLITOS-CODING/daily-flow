/** Date helpers that operate on local-time YYYY-MM-DD strings. */

/** Local calendar date as YYYY-MM-DD (avoids UTC off-by-one from toISOString). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** A short, human label for a date relative to today. */
export function relativeLabel(iso: string): string {
  const today = todayISO()
  if (iso === today) return 'Today'
  if (iso === addDays(today, 1)) return 'Tomorrow'
  if (iso === addDays(today, -1)) return 'Yesterday'

  const d = fromISODate(iso)
  const now = fromISODate(today)
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86_400_000)

  const opts: Intl.DateTimeFormatOptions =
    Math.abs(diffDays) < 7
      ? { weekday: 'long' }
      : d.getFullYear() === now.getFullYear()
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' }

  return new Intl.DateTimeFormat(undefined, opts).format(d)
}

/** Format HH:mm using the user's locale (e.g. 9:30 AM / 09:30). */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

export function isPast(iso: string): boolean {
  return iso < todayISO()
}
