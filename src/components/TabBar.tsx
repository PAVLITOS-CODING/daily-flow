import type { ViewKind } from '../types'

interface Props {
  active: ViewKind
  onChange: (v: ViewKind) => void
}

const TABS: { key: ViewKind; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { key: 'today', label: 'Today', icon: (a) => <SunIcon active={a} /> },
  { key: 'upcoming', label: 'Upcoming', icon: (a) => <StackIcon active={a} /> },
  { key: 'meetings', label: 'Meetings', icon: (a) => <PeopleIcon active={a} /> },
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
                isActive ? 'text-flow' : 'text-mist-600'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-flow" aria-hidden />
              )}
              {t.icon(isActive)}
              <span className="text-[11px] font-medium tracking-wide">{t.label}</span>
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
