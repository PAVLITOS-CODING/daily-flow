import type { ViewKind } from '../types'

interface Props {
  active: ViewKind
  onChange: (v: ViewKind) => void
}

const TABS: { key: ViewKind; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { key: 'today', label: 'Today', icon: (a) => <SunIcon active={a} /> },
  { key: 'upcoming', label: 'Upcoming', icon: (a) => <StackIcon active={a} /> },
  { key: 'meetings', label: 'Meetings', icon: (a) => <PeopleIcon active={a} /> },
  { key: 'calendar', label: 'Calendar', icon: (a) => <CalendarIcon active={a} /> },
  { key: 'challenge', label: 'Challenge', icon: (a) => <FlameIcon active={a} /> },
]

export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      className="border-t border-ink-700 bg-ink-900"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 transition-colors ${
                isActive ? 'text-accentink' : 'text-mist-600'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accentink" aria-hidden />
              )}
              {t.icon(isActive)}
              <span className="text-[10px] font-medium tracking-tight">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" strokeLinecap="round" />
    </svg>
  )
}
function StackIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 8h16M4 13h16M4 18h10" strokeLinecap="round" />
    </svg>
  )
}
function PeopleIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0111 0M16 6a3 3 0 010 6M17 19a5.5 5.5 0 00-2-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
function FlameIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.4 : 1.8}>
      <path
        d="M12 3c1 3-2 4-2 7a2 2 0 104 0c0-1 0-1.5-.5-2.5C15 10 17 12.5 17 15a5 5 0 11-10 0c0-3 2.5-4.5 3-7 .3-1.5 1.3-3.5 2-5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
