import { useEffect, useState } from 'react'
import type { PlanTask, PlanTaskKind } from '../../types'
import { ListShell } from '../Shared'
import { usePlan } from '../../hooks/usePlan'
import { seedPlan, togglePlanTask, dayLabel } from '../../lib/plan'

const KIND_META: Record<PlanTaskKind, { label: string; badge: string }> = {
  theory: { label: 'Θεωρία', badge: 'bg-ctx-work/15 text-ctx-work' },
  practice: { label: 'Πράξη', badge: 'bg-prio-low/15 text-prio-low' },
  ship: { label: 'Ship', badge: 'bg-prio-med/15 text-prio-med' },
}

export function PlanView() {
  const data = usePlan()

  // Idempotent — creates the plan the first time the tab is opened.
  useEffect(() => {
    void seedPlan()
  }, [])

  if (!data) return null // loading, or seeding in progress (re-renders when ready)
  const { stats } = data
  const pct = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0

  return (
    <ListShell>
      <div className="animate-rise">
        {/* Day + streak */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <p className="text-xs tracking-widest text-mist-500 uppercase">
              Ημέρα {stats.currentDay}/{stats.totalDays}
            </p>
            <h2 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold text-mist-100">
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

        {/* Overall progress */}
        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between text-xs text-mist-500">
            <span>Πρόοδος</span>
            <span className="tabular-nums">
              {stats.doneTasks}/{stats.totalTasks} · {pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full bg-flow transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Theory / practice ratio */}
        <RatioPills
          theory={stats.theoryMinutes}
          practice={stats.practiceMinutes}
          ratio={stats.theoryRatio}
          heavy={stats.theoryHeavy}
        />

        {/* Today's tasks */}
        <div className="mt-6 mb-2 flex items-baseline justify-between">
          <h3 className="text-xs tracking-widest text-mist-500 uppercase">Σήμερα</h3>
          <span className="text-xs text-mist-500 tabular-nums">
            {stats.doneToday}/{stats.totalToday}
          </span>
        </div>
        {stats.todayTasks.length === 0 ? (
          <p className="rounded-2xl bg-ink-800/50 px-4 py-6 text-center text-sm text-mist-500">
            Δεν υπάρχουν εργασίες για σήμερα.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700/60 overflow-hidden rounded-2xl bg-ink-800/50">
            {stats.todayTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        )}

        {/* Full 14-day view */}
        <FullPlan perDay={stats.perDay} currentDay={stats.currentDay} />
      </div>
    </ListShell>
  )
}

function TaskRow({ task }: { task: PlanTask }) {
  const done = task.done === 1
  const meta = KIND_META[task.kind]
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(8)
          void togglePlanTask(task)
        }}
        aria-pressed={done}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left active:bg-ink-700/40"
      >
        <span
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
            done ? 'border-flow bg-flow text-onaccent' : 'border-ink-500 text-transparent'
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug ${done ? 'text-mist-500 line-through' : 'text-mist-200'}`}>
            {task.title}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>{meta.label}</span>
            <span className="text-xs text-mist-500 tabular-nums">{task.minutes}′</span>
          </span>
        </span>
      </button>
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
          <span className="text-[10px] tracking-wide text-mist-500 uppercase">Θεωρία {theoryPct}%</span>
        </span>
        <span className="flex-1 rounded-xl bg-prio-low/15 px-3 py-2 text-center">
          <span className="block text-sm font-semibold text-prio-low tabular-nums">{practice}′</span>
          <span className="text-[10px] tracking-wide text-mist-500 uppercase">Πράξη {100 - theoryPct}%</span>
        </span>
      </div>
      {heavy && (
        <p className="mt-2 rounded-lg bg-prio-med/15 px-3 py-2 text-xs text-prio-med">
          ⚠︎ Πολλή θεωρία σήμερα ({theoryPct}%). Κράτα τη θεωρία κάτω από 55% — πέρνα στον κώδικα.
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
