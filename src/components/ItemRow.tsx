import { useState } from 'react'
import type { Item, Priority } from '../types'
import { formatTime, relativeLabel } from '../lib/dates'
import { toggleDone, deleteItem } from '../lib/store'
import {
  enableReminder,
  disableReminder,
  hasReminder,
  reminderTime,
  isStandalone,
} from '../lib/reminders'

const PRIO_RULE: Record<Priority, string> = {
  high: 'bg-prio-high',
  med: 'bg-prio-med',
  low: 'bg-prio-low',
}

interface Props {
  item: Item
  onEdit: (item: Item) => void
  /** Show date label (Upcoming / Meetings across days); Today omits it. */
  showDate?: boolean
  /** Meetings view surfaces time + location prominently. */
  emphasizeMeta?: boolean
}

export function ItemRow({ item, onEdit, showDate = false, emphasizeMeta = false }: Props) {
  const [reminderOn, setReminderOn] = useState(() => hasReminder(item.id))
  const [hint, setHint] = useState<string | null>(null)

  const canRemind = Boolean(item.time) && (reminderTime(item) ?? 0) > Date.now()

  async function onToggle() {
    if (navigator.vibrate) navigator.vibrate(8)
    await toggleDone(item)
  }

  async function onDelete() {
    if (item.id == null) return
    if (navigator.vibrate) navigator.vibrate(12)
    await deleteItem(item.id)
  }

  async function onToggleReminder(e: React.MouseEvent) {
    e.stopPropagation()
    if (item.id == null) return
    if (reminderOn) {
      disableReminder(item.id)
      setReminderOn(false)
      setHint(null)
      return
    }
    const state = await enableReminder(item)
    if (state === 'granted') {
      setReminderOn(true)
      setHint(null)
    } else if (state === 'denied') {
      setHint('Notifications are blocked in Settings')
    } else if (state === 'unsupported') {
      setHint(isStandalone() ? 'Not supported on this device' : 'Add to Home Screen first')
    } else {
      setHint('Add to Home Screen to allow reminders')
    }
  }

  return (
    <li className="relative">
      <div
        className="flex items-start gap-3 bg-ink-850 py-3.5 pr-4 pl-1"
      >
        {/* priority rule */}
        <span
          aria-hidden
          className={`mt-0.5 h-9 w-[3px] shrink-0 rounded-full ${
            item.priority ? PRIO_RULE[item.priority] : 'bg-ink-600'
          }`}
        />

        {/* checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          aria-label={item.done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
          onClick={onToggle}
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
            item.done
              ? 'border-flow bg-flow text-onaccent'
              : 'border-ink-500 text-transparent active:border-mist-500'
          }`}
        >
          <CheckIcon />
        </button>

        {/* body — tap to edit */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="min-w-0 flex-1 text-left"
        >
          <p
            className={`truncate text-[15px] leading-snug ${
              item.done ? 'text-mist-600 line-through' : 'text-mist-100'
            }`}
          >
            {item.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-mist-500">
            <span
              aria-hidden
              className={`inline-block size-1.5 rounded-full ${
                item.context === 'work' ? 'bg-ctx-work' : 'bg-ctx-personal'
              }`}
            />
            <span className="capitalize">{item.context}</span>

            {item.time && (
              <span className={emphasizeMeta ? 'font-medium text-mist-300 tabular-nums' : 'tabular-nums'}>
                · {formatTime(item.time)}
              </span>
            )}
            {item.location && (
              <span className={emphasizeMeta ? 'text-mist-300' : ''}>· {item.location}</span>
            )}
            {showDate && <span>· {relativeLabel(item.date)}</span>}
            {item.recurring !== 'none' && <span className="text-flow-dim">· {item.recurring}</span>}
          </div>
          {hint && <p className="mt-1 text-xs text-prio-med">{hint}</p>}
        </button>

        {/* reminder toggle (only for timed, future items) */}
        {canRemind && (
          <button
            type="button"
            onClick={onToggleReminder}
            aria-label={reminderOn ? 'Turn reminder off' : 'Turn reminder on'}
            aria-pressed={reminderOn}
            className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition-colors ${
              reminderOn ? 'text-accentink' : 'text-mist-600 active:text-mist-300'
            }`}
          >
            <BellIcon filled={reminderOn} />
          </button>
        )}

        {/* discreet delete */}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${item.title}`}
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-mist-600 transition-colors active:bg-ink-700 active:text-prio-high"
        >
          <CloseIcon />
        </button>
      </div>
    </li>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 004 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
