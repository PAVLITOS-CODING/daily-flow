import { useState } from 'react'
import type { Context, ItemDraft, ItemType, ViewKind } from '../types'
import { createItem } from '../lib/store'
import { todayISO } from '../lib/dates'

interface Props {
  view: ViewKind
  /** Default date for new items (Today → today; others → today too). */
  defaultDate?: string
}

export function QuickAdd({ view, defaultDate }: Props) {
  const isMeeting = view === 'meetings'
  const type: ItemType = isMeeting ? 'meeting' : view === 'upcoming' ? 'event' : 'task'

  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(defaultDate ?? todayISO())
  const [context, setContext] = useState<Context>('personal')

  const canSubmit = title.trim().length > 0

  async function submit() {
    if (!canSubmit) return
    const draft: ItemDraft = {
      title: title.trim(),
      type,
      context,
      date,
      recurring: 'none',
      done: false,
      ...(time ? { time } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
    }
    await createItem(draft)
    setTitle('')
    setTime('')
    setLocation('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="border-t border-ink-700 bg-ink-800/80 px-4 pt-3 backdrop-blur"
      style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
    >
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isMeeting ? 'New meeting…' : view === 'upcoming' ? 'New event or task…' : 'New task…'}
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-mist-100 placeholder:text-mist-600 focus:outline-none"
          enterKeyHint="done"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Add"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-flow text-ink-900 transition-opacity disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Meetings need time + location up front. */}
      {isMeeting && (
        <div className="mt-1 flex gap-2 pb-0.5">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Time"
            className="rounded-lg bg-ink-700 px-2.5 py-1.5 text-sm text-mist-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-flow/50"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            aria-label="Location"
            className="min-w-0 flex-1 rounded-lg bg-ink-700 px-2.5 py-1.5 text-sm text-mist-100 placeholder:text-mist-600 focus:outline-none focus:ring-1 focus:ring-flow/50"
          />
        </div>
      )}

      {/* Upcoming: pick a date + context. */}
      {view === 'upcoming' && (
        <div className="mt-1 flex gap-2 pb-0.5">
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="rounded-lg bg-ink-700 px-2.5 py-1.5 text-sm text-mist-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-flow/50"
          />
          <ContextToggle value={context} onChange={setContext} />
        </div>
      )}

      {view === 'today' && (
        <div className="mt-1 flex justify-end pb-0.5">
          <ContextToggle value={context} onChange={setContext} />
        </div>
      )}
    </form>
  )
}

function ContextToggle({ value, onChange }: { value: Context; onChange: (c: Context) => void }) {
  return (
    <div className="ml-auto flex overflow-hidden rounded-lg bg-ink-700 text-xs">
      {(['personal', 'work'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`px-3 py-1.5 capitalize transition-colors ${
            value === c ? 'bg-ink-500 text-mist-100' : 'text-mist-500'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
