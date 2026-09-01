import { useState } from 'react'
import type { Item, ViewKind } from './types'
import { todayISO, relativeLabel } from './lib/dates'
import { TabBar } from './components/TabBar'
import { QuickAdd } from './components/QuickAdd'
import { EditSheet } from './components/EditSheet'
import { TodayView } from './components/views/TodayView'
import { UpcomingView } from './components/views/UpcomingView'
import { MeetingsView } from './components/views/MeetingsView'
import { ChallengeView } from './components/views/ChallengeView'

const TITLES: Record<ViewKind, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  meetings: 'Meetings',
  challenge: 'Challenge',
}

export default function App() {
  const [view, setView] = useState<ViewKind>('today')
  const [editing, setEditing] = useState<Item | null>(null)

  const longDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="flex h-full flex-col bg-ink-850">
      <header
        className="shrink-0 px-5 pb-3"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <p className="text-xs font-medium tracking-widest text-flow-dim uppercase">
          {view === 'today'
            ? longDate
            : view === 'challenge'
              ? 'Μείνε συνεπής'
              : relativeLabel(todayISO())}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-mist-100">
          {TITLES[view]}
        </h1>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {view === 'today' && <TodayView onEdit={setEditing} />}
        {view === 'upcoming' && <UpcomingView onEdit={setEditing} />}
        {view === 'meetings' && <MeetingsView onEdit={setEditing} />}
        {view === 'challenge' && <ChallengeView />}
      </main>

      {view !== 'challenge' && <QuickAdd view={view} />}
      <TabBar active={view} onChange={setView} />

      {editing && <EditSheet item={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
