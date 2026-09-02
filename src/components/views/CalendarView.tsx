import { useMemo, useState } from 'react'
import type { Item } from '../../types'
import { useAllItems } from '../../hooks/useItems'
import { toISODate, todayISO, fromISODate, relativeLabel } from '../../lib/dates'
import { createItem } from '../../lib/store'
import { ItemRow } from '../ItemRow'
import { TimeField } from '../Fields'
import { EmptyState } from '../Shared'

const WEEKDAYS = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ']

export function CalendarView({ onEdit }: { onEdit: (i: Item) => void }) {
  const items = useAllItems()
  const today = todayISO()
  const now = fromISODate(today)

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0–11
  const [selected, setSelected] = useState(today)

  // Group items by date, and remember the "heaviest" priority per day for dots.
  const byDate = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const it of items ?? []) {
      const arr = map.get(it.date)
      if (arr) arr.push(it)
      else map.set(it.date, [it])
    }
    return map
  }, [items])

  if (items === undefined) return null

  const first = new Date(year, month, 1)
  const leading = (first.getDay() + 6) % 7 // Monday-start offset
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(first)

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const cells: (string | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)))

  const selectedItems = (byDate.get(selected) ?? [])
    .slice()
    .sort((a, b) => (a.done !== b.done ? (a.done ? 1 : -1) : (a.time ?? '99') < (b.time ?? '99') ? -1 : 1))

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto">
      <div className="mx-auto max-w-lg px-4 pb-4">
        {/* Month header */}
        <div className="flex items-center justify-between py-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Προηγούμενος μήνας"
            className="grid size-9 place-items-center rounded-full text-mist-400 active:bg-ink-700"
          >
            <Chevron dir="left" />
          </button>
          <span className="font-[family-name:var(--font-display)] text-base font-semibold text-mist-100 capitalize">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Επόμενος μήνας"
            className="grid size-9 place-items-center rounded-full text-mist-400 active:bg-ink-700"
          >
            <Chevron dir="right" />
          </button>
        </div>

        {/* Weekday row */}
        <div className="mt-1 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-[11px] font-medium text-mist-500">
              {w}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <span key={`b${i}`} />
            const dayItems = byDate.get(iso)
            const isToday = iso === today
            const isSelected = iso === selected
            const dot = dayItems?.length ? dotColor(dayItems) : null
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                aria-label={iso}
                aria-current={isSelected ? 'date' : undefined}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  isSelected
                    ? 'bg-flow font-semibold text-onaccent'
                    : isToday
                      ? 'bg-ink-700 font-semibold text-accentink'
                      : 'text-mist-200 active:bg-ink-700'
                }`}
              >
                {Number(iso.slice(-2))}
                {dot && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1.5 rounded-full ${isSelected ? 'bg-onaccent/70' : dot}`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day items */}
        <div className="mt-4 mb-1 flex items-baseline justify-between px-1">
          <h2 className="text-xs tracking-widest text-mist-500 uppercase">{relativeLabel(selected)}</h2>
          {selectedItems.length > 0 && (
            <span className="text-xs text-mist-500 tabular-nums">{selectedItems.length}</span>
          )}
        </div>

        {/* Quick-add a task on the selected day */}
        <AddOnDay date={selected} />

        {selectedItems.length === 0 ? (
          <EmptyState title="Καμία εγγραφή" hint="Δεν υπάρχει τίποτα για αυτή τη μέρα." />
        ) : (
          <ul className="divide-y divide-ink-700/60">
            {selectedItems.map((i) => (
              <ItemRow key={i.id} item={i} onEdit={onEdit} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AddOnDay({ date }: { date: string }) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  async function submit() {
    if (!title.trim()) return
    await createItem({
      title: title.trim(),
      type: 'task',
      context: 'personal',
      date,
      recurring: 'none',
      done: false,
      ...(time ? { time } : {}),
    })
    setTitle('')
    setTime('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="mb-3 rounded-2xl bg-ink-800/60 p-2.5"
    >
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Νέο task αυτή τη μέρα…"
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-mist-100 placeholder:text-mist-600 focus:outline-none"
          enterKeyHint="done"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          aria-label="Add"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-flow text-onaccent transition-opacity disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="mt-1">
        <TimeField value={time} onChange={setTime} />
      </div>
    </form>
  )
}

function dotColor(items: Item[]): string {
  if (items.some((i) => !i.done && i.priority === 'high')) return 'bg-prio-high'
  if (items.some((i) => !i.done && i.priority === 'med')) return 'bg-prio-med'
  if (items.some((i) => i.type === 'meeting')) return 'bg-ctx-work'
  return 'bg-accentink'
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
