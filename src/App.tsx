import { useEffect, useRef, useState } from 'react'
import type { Item, ViewKind } from './types'
import { todayISO, relativeLabel } from './lib/dates'
import { rearmReminders, rearmChallengeReminder } from './lib/reminders'
import { isLockEnabled, RELOCK_GRACE_MS } from './lib/lock'
import { pruneDroppedRules } from './lib/challenge'
import { TabBar } from './components/TabBar'
import { QuickAdd } from './components/QuickAdd'
import { EditSheet } from './components/EditSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { LockScreen } from './components/LockScreen'
import { TodayView } from './components/views/TodayView'
import { UpcomingView } from './components/views/UpcomingView'
import { MeetingsView } from './components/views/MeetingsView'
import { CalendarView } from './components/views/CalendarView'
import { ChallengeView } from './components/views/ChallengeView'

const TITLES: Record<ViewKind, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  meetings: 'Meetings',
  calendar: 'Calendar',
  challenge: 'Challenge',
}

export default function App() {
  const [view, setView] = useState<ViewKind>('today')
  const [editing, setEditing] = useState<Item | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [locked, setLocked] = useState(() => isLockEnabled())
  const hiddenAt = useRef<number | null>(null)

  // One-time cleanup for the dropped 75 HARD rules #9/#10 (retrofits any
  // challenge/logs created before they were removed from the template).
  useEffect(() => {
    void pruneDroppedRules()
  }, [])

  // Re-arm best-effort reminder timers, and re-lock after time in the
  // background, whenever the app is opened/foregrounded.
  useEffect(() => {
    function rearm() {
      void rearmReminders()
      void rearmChallengeReminder()
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
        return
      }
      rearm()
      const away = hiddenAt.current === null ? Infinity : Date.now() - hiddenAt.current
      if (isLockEnabled() && away > RELOCK_GRACE_MS) setLocked(true)
    }
    rearm()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />

  const longDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="flex h-full flex-col bg-ink-850">
      <header
        className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-widest text-flow-dim uppercase">
            {view === 'today'
              ? longDate
              : view === 'challenge'
                ? 'Μείνε συνεπής'
                : view === 'calendar'
                  ? 'Όλα τα task σου'
                  : relativeLabel(todayISO())}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-mist-100">
            {TITLES[view]}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Ρυθμίσεις"
          className="mt-1 grid size-10 shrink-0 place-items-center rounded-full text-mist-500 active:bg-ink-700"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {view === 'today' && <TodayView onEdit={setEditing} />}
        {view === 'upcoming' && <UpcomingView onEdit={setEditing} />}
        {view === 'meetings' && <MeetingsView onEdit={setEditing} />}
        {view === 'calendar' && <CalendarView onEdit={setEditing} />}
        {view === 'challenge' && <ChallengeView />}
      </main>

      {view !== 'challenge' && view !== 'calendar' && <QuickAdd view={view} />}
      <TabBar active={view} onChange={setView} />

      {editing && <EditSheet item={editing} onClose={() => setEditing(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
