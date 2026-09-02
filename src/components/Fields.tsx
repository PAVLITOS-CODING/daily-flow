import { todayISO } from '../lib/dates'

export function DateField({
  value,
  onChange,
  min = todayISO(),
}: {
  value: string
  onChange: (v: string) => void
  min?: string
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-lg bg-ink-700 px-2.5 py-1.5 text-sm text-mist-100 focus-within:ring-1 focus-within:ring-flow/50">
      <CalendarGlyph />
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Date"
        className="bg-transparent tabular-nums focus:outline-none"
      />
    </label>
  )
}

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative flex items-center gap-1.5 rounded-lg bg-ink-700 px-2.5 py-1.5 text-sm text-mist-100 focus-within:ring-1 focus-within:ring-flow/50">
      <ClockGlyph />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Time"
        className="min-w-[3rem] bg-transparent tabular-nums focus:outline-none"
      />
      {!value && <span className="pointer-events-none absolute left-8 text-mist-500">Ώρα</span>}
    </label>
  )
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-mist-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-mist-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
