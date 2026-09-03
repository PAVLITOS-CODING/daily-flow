import { useEffect, useState } from 'react'
import type { Context, Item, ItemType, Priority, Recurring } from '../types'
import { deleteItem, updateItem } from '../lib/store'
import { addToCalendar, canAddToCalendar } from '../lib/ics'
import { LEAD_MINUTES } from '../lib/reminders'

interface Props {
  item: Item
  onClose: () => void
}

const TYPES: ItemType[] = ['task', 'event', 'meeting']
const PRIORITIES: Priority[] = ['low', 'med', 'high']
const RECURS: Recurring[] = ['none', 'daily', 'weekly']

export function EditSheet({ item, onClose }: Props) {
  const [draft, setDraft] = useState<Item>(item)
  const [calMsg, setCalMsg] = useState<string | null>(null)

  // Keep local state in sync if a different item is opened.
  useEffect(() => {
    setDraft(item)
    setCalMsg(null)
  }, [item])

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof Item>(key: K, value: Item[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    if (draft.id == null) return
    const { id: _id, createdAt: _createdAt, ...changes } = draft
    void _id
    void _createdAt
    // Normalise optional fields: empty strings become undefined.
    await updateItem(draft.id, {
      ...changes,
      time: draft.time?.trim() ? draft.time : undefined,
      location: draft.location?.trim() ? draft.location.trim() : undefined,
    })
    onClose()
  }

  async function remove() {
    if (draft.id == null) return
    await deleteItem(draft.id)
    onClose()
  }

  function onAddToCalendar() {
    const ok = addToCalendar(draft)
    setCalMsg(
      ok
        ? `Άνοιξε το Ημερολόγιο — πάτησε «Προσθήκη». Θα σε ειδοποιήσει ${LEAD_MINUTES}′ πριν.`
        : 'Δεν ήταν δυνατό το άνοιγμα του ημερολογίου σε αυτόν τον browser.',
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-lg rounded-t-3xl border-t border-ink-600 bg-ink-800 px-5 pt-3"
        style={{ paddingBottom: 'calc(1.25rem + var(--safe-bottom))' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit item"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-500" />

        <input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Title"
          aria-label="Title"
          className="w-full bg-transparent pb-3 text-lg font-medium text-mist-100 placeholder:text-mist-600 focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Type">
            <Segment
              options={TYPES}
              value={draft.type}
              onChange={(v) => set('type', v)}
            />
          </Field>
          <Field label="Context">
            <Segment
              options={['personal', 'work'] as Context[]}
              value={draft.context}
              onChange={(v) => set('context', v)}
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full rounded-lg bg-ink-700 px-3 py-2 text-mist-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-flow/50"
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={draft.time ?? ''}
              onChange={(e) => set('time', e.target.value || undefined)}
              className="w-full rounded-lg bg-ink-700 px-3 py-2 text-mist-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-flow/50"
            />
          </Field>

          <Field label="Location" full>
            <input
              value={draft.location ?? ''}
              onChange={(e) => set('location', e.target.value || undefined)}
              placeholder="Optional"
              className="w-full rounded-lg bg-ink-700 px-3 py-2 text-mist-100 placeholder:text-mist-600 focus:outline-none focus:ring-1 focus:ring-flow/50"
            />
          </Field>

          <Field label="Priority">
            <Segment
              options={PRIORITIES}
              value={draft.priority ?? 'low'}
              onChange={(v) => set('priority', v)}
            />
          </Field>
          <Field label="Repeat">
            <Segment
              options={RECURS}
              value={draft.recurring}
              onChange={(v) => set('recurring', v)}
            />
          </Field>
        </div>

        {canAddToCalendar(draft) && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onAddToCalendar}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-700 py-3 text-sm font-medium text-mist-200 active:bg-ink-600"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="4.5" width="18" height="16" rx="2" />
                <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
                <path d="M12 12.5v4M10 14.5h4" strokeLinecap="round" />
              </svg>
              Πρόσθεσε στο Ημερολόγιο · ειδοποίηση {LEAD_MINUTES}′ πριν
            </button>
            {calMsg && <p className="mt-2 px-1 text-xs leading-relaxed text-flow-dim">{calMsg}</p>}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={remove}
            className="grid size-11 place-items-center rounded-xl bg-ink-700 text-prio-high active:bg-ink-600"
            aria-label="Delete"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-ink-700 py-3 font-medium text-mist-300 active:bg-ink-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={draft.title.trim().length === 0}
            className="flex-1 rounded-xl bg-flow py-3 font-semibold text-onaccent transition-opacity disabled:opacity-30"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <span className="text-xs tracking-wide text-mist-500 uppercase">{label}</span>
      {children}
    </label>
  )
}

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-lg bg-ink-700">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex-1 px-1 py-2 text-xs capitalize transition-colors ${
            value === o ? 'bg-ink-500 text-mist-100' : 'text-mist-500'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
