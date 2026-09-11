import { useEffect, useState } from 'react'
import type { PlanResource, PlanResourceType, PlanTask } from '../../types'
import { ListShell } from '../Shared'
import { usePlan } from '../../hooks/usePlan'
import { seedPlan, togglePlanTask, dayLabel, dayFocus } from '../../lib/plan'

const KIND_META: Record<PlanTask['kind'], { label: string; badge: string }> = {
  theory: { label: 'Διάβασμα', badge: 'bg-ctx-work/15 text-ctx-work' },
  practice: { label: 'Εξάσκηση', badge: 'bg-prio-low/15 text-prio-low' },
  ship: { label: 'Ανέβασμα', badge: 'bg-prio-med/15 text-prio-med' },
}

const RES_META: Record<PlanResourceType, { icon: string; label: string }> = {
  docs: { icon: '📄', label: 'Τεκμηρίωση' },
  video: { icon: '🎬', label: 'Βίντεο' },
  article: { icon: '📝', label: 'Άρθρο' },
  practice: { icon: '💻', label: 'Άσκηση' },
}

export function PlanView() {
  const data = usePlan()
  const [openTask, setOpenTask] = useState<PlanTask | null>(null)

  // Idempotent — creates the plan (and re-syncs content) on open.
  useEffect(() => {
    void seedPlan()
  }, [])

  if (!data) return null // loading, or first sync in progress (re-renders when ready)
  const { stats } = data
  const pct = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0

  return (
    <>
      <ListShell>
        <div className="animate-rise">
          {/* Day header */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest text-flow-dim uppercase">
                Ημέρα {stats.currentDay} από {stats.totalDays}
              </p>
              <h2 className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-bold text-mist-100">
                {dayLabel(stats.currentDay)}
              </h2>
            </div>
            <div className="shrink-0 rounded-xl bg-ink-800/60 px-3 py-1.5 text-center">
              <div className="font-[family-name:var(--font-display)] text-lg font-bold text-mist-100 tabular-nums">
                {stats.streak}
                <span className="ml-0.5 text-xs">🔥</span>
              </div>
              <div className="text-[10px] tracking-wide text-mist-500 uppercase">Σερί</div>
            </div>
          </div>

          {/* Focus of the day */}
          {dayFocus(stats.currentDay) && (
            <p className="mt-2 rounded-xl bg-ink-800/50 px-3.5 py-2.5 text-sm leading-relaxed text-mist-300">
              🎯 {dayFocus(stats.currentDay)}
            </p>
          )}

          {/* Overall progress */}
          <div className="mt-4">
            <div className="mb-1 flex items-baseline justify-between text-xs text-mist-500">
              <span>Συνολική πρόοδος</span>
              <span className="tabular-nums">
                {stats.doneTasks}/{stats.totalTasks} βήματα · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-flow transition-[width]" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Theory / practice balance */}
          <RatioPills
            theory={stats.theoryMinutes}
            practice={stats.practiceMinutes}
            ratio={stats.theoryRatio}
            heavy={stats.theoryHeavy}
          />

          {/* Steps for today */}
          <div className="mt-6 mb-2 flex items-baseline justify-between">
            <h3 className="text-xs font-semibold tracking-widest text-mist-500 uppercase">Τα βήματα σήμερα</h3>
            <span className="text-xs text-mist-500 tabular-nums">
              {stats.doneToday}/{stats.totalToday}
            </span>
          </div>

          {stats.todayTasks.length === 0 ? (
            <p className="rounded-2xl bg-ink-800/50 px-4 py-6 text-center text-sm text-mist-500">
              Δεν υπάρχουν βήματα για σήμερα.
            </p>
          ) : (
            <ol className="space-y-2">
              {stats.todayTasks.map((task, i) => (
                <StepRow key={task.id ?? task.key} task={task} index={i + 1} onOpen={() => setOpenTask(task)} />
              ))}
            </ol>
          )}

          <p className="mt-3 px-1 text-xs leading-relaxed text-mist-600">
            Κάνε τα βήματα με τη σειρά και πάτα το ✓ όταν τελειώσεις. Το «Τι να διαβάσω;» ανοίγει
            υλικό, βίντεο και sites για κάθε βήμα.
          </p>

          {/* Full plan */}
          <FullPlan perDay={stats.perDay} currentDay={stats.currentDay} />
        </div>
      </ListShell>

      {openTask && <ResourceSheet task={openTask} onClose={() => setOpenTask(null)} />}
    </>
  )
}

function StepRow({ task, index, onOpen }: { task: PlanTask; index: number; onOpen: () => void }) {
  const done = task.done === 1
  const meta = KIND_META[task.kind]
  const hasInfo = Boolean(task.detail) || (task.resources?.length ?? 0) > 0

  return (
    <li className="overflow-hidden rounded-2xl bg-ink-800/50">
      <div className="flex items-start gap-3 px-3.5 py-3">
        {/* number + checkbox */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8)
            void togglePlanTask(task)
          }}
          role="checkbox"
          aria-checked={done}
          aria-label={done ? 'Αναίρεση' : 'Ολοκληρώθηκε'}
          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors ${
            done ? 'border-flow bg-flow text-onaccent' : 'border-ink-500 text-mist-500 active:border-mist-400'
          }`}
        >
          {done ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="tabular-nums">{index}</span>
          )}
        </button>

        {/* body */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm leading-snug ${done ? 'text-mist-500 line-through' : 'text-mist-100'}`}>
            {task.title}
          </p>
          {task.detail && <p className="mt-1 text-xs leading-relaxed text-mist-500">{task.detail}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>{meta.label}</span>
            <span className="text-xs text-mist-500 tabular-nums">{task.minutes}′</span>
            {hasInfo && (
              <button
                type="button"
                onClick={onOpen}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-ink-700 px-2.5 py-1 text-[11px] font-medium text-accentink active:bg-ink-600"
              >
                📖 Τι να διαβάσω;
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function RatioPills({
  theory,
  practice,
  ratio,
  heavy,
}: {
  theory: number
  practice: number
  ratio: number
  heavy: boolean
}) {
  const theoryPct = Math.round(ratio * 100)
  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <span className="flex-1 rounded-xl bg-ctx-work/15 px-3 py-2 text-center">
          <span className="block text-sm font-semibold text-ctx-work tabular-nums">{theory}′</span>
          <span className="text-[10px] tracking-wide text-mist-500 uppercase">Διάβασμα {theoryPct}%</span>
        </span>
        <span className="flex-1 rounded-xl bg-prio-low/15 px-3 py-2 text-center">
          <span className="block text-sm font-semibold text-prio-low tabular-nums">{practice}′</span>
          <span className="text-[10px] tracking-wide text-mist-500 uppercase">Εξάσκηση {100 - theoryPct}%</span>
        </span>
      </div>
      {heavy && (
        <p className="mt-2 rounded-lg bg-prio-med/15 px-3 py-2 text-xs leading-relaxed text-prio-med">
          ⚠︎ Σήμερα έχει πολύ διάβασμα ({theoryPct}%). Μην κολλήσεις στη θεωρία — πέρνα γρήγορα στην εξάσκηση.
        </p>
      )}
    </div>
  )
}

function FullPlan({
  perDay,
  currentDay,
}: {
  perDay: { day: number; done: number; total: number; complete: boolean }[]
  currentDay: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl bg-ink-800/60 px-4 py-3 text-sm font-medium text-mist-200 active:bg-ink-700"
      >
        <span>Όλο το πλάνο ({perDay.length} μέρες)</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="mt-2 space-y-1">
          {perDay.map((d) => {
            const isCurrent = d.day === currentDay
            return (
              <li
                key={d.day}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${
                  isCurrent ? 'bg-flow/15 ring-1 ring-flow/40' : 'bg-ink-800/40'
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${
                    d.complete
                      ? 'bg-flow text-onaccent'
                      : isCurrent
                        ? 'text-accentink ring-1 ring-accentink'
                        : 'bg-ink-700 text-mist-500'
                  }`}
                >
                  {d.day}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${isCurrent ? 'text-mist-100' : 'text-mist-300'}`}>
                  {dayLabel(d.day)}
                </span>
                {isCurrent && <span className="shrink-0 text-[10px] font-medium text-accentink uppercase">Σήμερα</span>}
                <span className="shrink-0 text-xs text-mist-500 tabular-nums">
                  {d.done}/{d.total}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ResourceSheet({ task, onClose }: { task: PlanTask; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const resources: PlanResource[] = task.resources ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-rise max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-ink-600 bg-ink-800 px-5 pt-3"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Τι να διαβάσω"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-500" />

        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-mist-100">{task.title}</h2>
        {task.detail && <p className="mt-2 text-sm leading-relaxed text-mist-300">{task.detail}</p>}

        <h3 className="mt-5 mb-2 text-xs font-semibold tracking-widest text-mist-500 uppercase">Υλικό μελέτης</h3>
        {resources.length === 0 ? (
          <p className="rounded-xl bg-ink-700/50 px-4 py-4 text-sm text-mist-500">
            Δεν χρειάζεται υλικό για αυτό το βήμα — απλώς κάν' το.
          </p>
        ) : (
          <ul className="space-y-2">
            {resources.map((r) => {
              const meta = RES_META[r.type]
              return (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-ink-700/60 px-3.5 py-3 active:bg-ink-600"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-800 text-base">
                      {meta.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-mist-100">{r.label}</span>
                      <span className="text-[11px] tracking-wide text-mist-500 uppercase">{meta.label}</span>
                    </span>
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-mist-500" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-ink-700 py-3 font-medium text-mist-300 active:bg-ink-600"
        >
          Κλείσιμο
        </button>
      </div>
    </div>
  )
}
