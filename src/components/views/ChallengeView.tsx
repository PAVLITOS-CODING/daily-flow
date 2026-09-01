import { useState } from 'react'
import type { Challenge, ChallengeLog, ChallengeRule } from '../../types'
import { todayISO } from '../../lib/dates'
import {
  SEVENTY_FIVE_HARD,
  computeStats,
  startChallenge,
  toggleRule,
  restartChallenge,
  abandonChallenge,
  newRuleId,
} from '../../lib/challenge'
import { useActiveChallenge } from '../../hooks/useChallenge'
import { Switch } from '../Switch'
import {
  loadChallengeReminder,
  enableChallengeReminder,
  disableChallengeReminder,
  isStandalone,
} from '../../lib/reminders'

export function ChallengeView() {
  const data = useActiveChallenge()
  if (data === undefined) return null

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4">
      <div className="mx-auto max-w-lg pb-6">
        {data.challenge ? (
          <Dashboard challenge={data.challenge} logs={data.logs} />
        ) : (
          <Chooser />
        )}
      </div>
    </div>
  )
}

// --- Active challenge dashboard -------------------------------------------

function Dashboard({ challenge, logs }: { challenge: Challenge; logs: ChallengeLog[] }) {
  const stats = computeStats(challenge, logs)
  const today = todayISO()
  const todayLog = logs.find((l) => l.date === today)
  const doneSet = new Set(todayLog?.doneRuleIds ?? [])

  async function onToggle(ruleId: string) {
    if (challenge.id == null) return
    if (navigator.vibrate) navigator.vibrate(8)
    await toggleRule(challenge.id, today, ruleId)
  }

  async function onRestart() {
    if (challenge.id == null) return
    if (window.confirm('Μηδενισμός προόδου και ξεκίνημα από την Ημέρα 1;')) {
      await restartChallenge(challenge.id)
    }
  }
  async function onAbandon() {
    if (challenge.id == null) return
    if (window.confirm('Εγκατάλειψη challenge; Θα χαθεί η πρόοδος.')) {
      await abandonChallenge(challenge.id)
    }
  }

  return (
    <div className="animate-rise">
      <div className="flex items-start justify-between gap-3 pt-1">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-mist-100">
          {challenge.title}
        </h2>
        <ChallengeMenu onRestart={onRestart} onAbandon={onAbandon} />
      </div>

      {/* Headline stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat value={`${stats.currentDay}`} unit={`/ ${challenge.targetDays}`} label="Ημέρα" big />
        <Stat value={`${stats.streak}`} unit="🔥" label="Σερί" />
        <Stat value={`${stats.consistency}%`} label="Συνέπεια" />
      </div>

      {stats.finished && (
        <p className="mt-3 rounded-xl bg-flow/15 px-3 py-2 text-center text-sm font-medium text-flow">
          🎉 Ολοκληρώθηκε! {challenge.targetDays} μέρες σερί.
        </p>
      )}

      {/* Progress grid */}
      <DayGrid target={challenge.targetDays} streak={stats.streak} todayComplete={stats.todayComplete} />

      {/* Daily reminder */}
      <DailyReminderControl title={challenge.title} />

      {/* Today checklist */}
      <div className="mt-6 mb-2 flex items-baseline justify-between">
        <h3 className="text-xs tracking-widest text-mist-500 uppercase">Σήμερα</h3>
        <span className="text-xs text-mist-500 tabular-nums">
          {stats.todayDoneCount}/{stats.totalRules}
        </span>
      </div>
      <ul className="divide-y divide-ink-700/60 overflow-hidden rounded-2xl bg-ink-800/50">
        {challenge.rules.map((rule) => {
          const done = doneSet.has(rule.id)
          return (
            <li key={rule.id}>
              <button
                type="button"
                onClick={() => onToggle(rule.id)}
                aria-pressed={done}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-ink-700/40"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                    done ? 'border-flow bg-flow text-ink-900' : 'border-ink-500 text-transparent'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className={`text-sm leading-snug ${done ? 'text-mist-500 line-through' : 'text-mist-200'}`}>
                  {rule.text}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 px-1 text-xs leading-relaxed text-mist-600">
        Το πρόγραμμα πρέπει να τηρηθεί για {challenge.targetDays} συνεχόμενες μέρες. Αν χάσεις μία
        μέρα, το σερί μηδενίζει και ξεκινάς από την Ημέρα 1.
      </p>
    </div>
  )
}

function DailyReminderControl({ title }: { title: string }) {
  const initial = loadChallengeReminder()
  const [on, setOn] = useState(initial.enabled)
  const [time, setTime] = useState(initial.time)
  const [hint, setHint] = useState<string | null>(null)

  async function toggle() {
    if (on) {
      disableChallengeReminder()
      setOn(false)
      setHint(null)
      return
    }
    const state = await enableChallengeReminder(time, title)
    if (state === 'granted') {
      setOn(true)
      setHint(null)
    } else if (state === 'denied') {
      setHint('Οι ειδοποιήσεις είναι μπλοκαρισμένες στις Ρυθμίσεις')
    } else {
      setHint(isStandalone() ? 'Δεν υποστηρίζεται σε αυτή τη συσκευή' : 'Πρόσθεσε πρώτα στην αρχική οθόνη')
    }
  }

  async function changeTime(next: string) {
    setTime(next)
    if (on) await enableChallengeReminder(next, title) // re-arm at the new time
  }

  return (
    <div className="mt-4 rounded-2xl bg-ink-800/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-mist-200">Ημερήσια υπενθύμιση</p>
          <p className="text-xs text-mist-600">Ένα nudge για να μη σπάσεις το σερί</p>
        </div>
        <div className="flex items-center gap-2">
          {on && (
            <input
              type="time"
              value={time}
              onChange={(e) => void changeTime(e.target.value)}
              aria-label="Ώρα υπενθύμισης"
              className="rounded-lg bg-ink-700 px-2 py-1 text-sm text-mist-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-flow/50"
            />
          )}
          <Switch on={on} onChange={() => void toggle()} label="Ημερήσια υπενθύμιση" />
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-prio-med">{hint}</p>}
    </div>
  )
}

function Stat({ value, unit, label, big }: { value: string; unit?: string; label: string; big?: boolean }) {
  return (
    <div className="rounded-2xl bg-ink-800/60 px-3 py-3 text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className={`font-[family-name:var(--font-display)] font-bold text-mist-100 tabular-nums ${big ? 'text-3xl' : 'text-2xl'}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-mist-500">{unit}</span>}
      </div>
      <div className="mt-1 text-[11px] tracking-wide text-mist-500 uppercase">{label}</div>
    </div>
  )
}

function DayGrid({ target, streak, todayComplete }: { target: number; streak: number; todayComplete: boolean }) {
  const activeIdx = todayComplete ? -1 : streak // the in-progress day
  return (
    <div className="mt-4 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1">
      {Array.from({ length: target }, (_, i) => {
        const done = i < streak
        const current = i === activeIdx
        return (
          <div
            key={i}
            className={`aspect-square rounded-[3px] ${
              done ? 'bg-flow' : current ? 'bg-transparent ring-1 ring-flow' : 'bg-ink-600'
            }`}
          />
        )
      })}
    </div>
  )
}

function ChallengeMenu({ onRestart, onAbandon }: { onRestart: () => void; onAbandon: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ενέργειες"
        className="grid size-9 place-items-center rounded-full text-mist-400 active:bg-ink-700"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-ink-600 bg-ink-800 py-1 shadow-xl">
            <button
              type="button"
              onClick={() => { setOpen(false); onRestart() }}
              className="block w-full px-4 py-2.5 text-left text-sm text-mist-200 active:bg-ink-700"
            >
              Restart (Ημέρα 1)
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onAbandon() }}
              className="block w-full px-4 py-2.5 text-left text-sm text-prio-high active:bg-ink-700"
            >
              Εγκατάλειψη
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// --- Chooser (no active challenge) ----------------------------------------

function Chooser() {
  const [custom, setCustom] = useState(false)

  return (
    <div className="animate-rise pt-2">
      <p className="mb-4 text-sm text-mist-500">
        Διάλεξε ένα challenge και κράτα σκορ πόσο συνεπής είσαι κάθε μέρα.
      </p>

      {/* Featured template */}
      <button
        type="button"
        onClick={() => startChallenge(SEVENTY_FIVE_HARD.title, SEVENTY_FIVE_HARD.rules, SEVENTY_FIVE_HARD.targetDays)}
        className="block w-full rounded-2xl border border-flow/30 bg-gradient-to-br from-ink-800 to-ink-850 p-4 text-left active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-mist-100">
            {SEVENTY_FIVE_HARD.title}
          </span>
          <span className="rounded-full bg-flow px-3 py-1 text-xs font-semibold text-ink-900">Ξεκίνα</span>
        </div>
        <p className="mt-1 text-xs text-mist-500">
          {SEVENTY_FIVE_HARD.rules.length} κανόνες · {SEVENTY_FIVE_HARD.targetDays} συνεχόμενες μέρες
        </p>
      </button>

      <div className="mt-6">
        {custom ? (
          <CustomBuilder onCancel={() => setCustom(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setCustom(true)}
            className="w-full rounded-2xl border border-dashed border-ink-500 py-3 text-sm text-mist-400 active:bg-ink-800"
          >
            + Φτιάξε δικό σου challenge
          </button>
        )}
      </div>
    </div>
  )
}

function CustomBuilder({ onCancel }: { onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(30)
  const [rules, setRules] = useState<ChallengeRule[]>([{ id: newRuleId(), text: '' }])

  const validRules = rules.map((r) => r.text.trim()).filter(Boolean)
  const canStart = title.trim().length > 0 && validRules.length > 0 && days >= 1

  function setRuleText(id: string, text: string) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, text } : r)))
  }
  function addRule() {
    setRules((rs) => [...rs, { id: newRuleId(), text: '' }])
  }
  function removeRule(id: string) {
    setRules((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs))
  }
  async function start() {
    if (!canStart) return
    const clean = rules.filter((r) => r.text.trim()).map((r) => ({ id: r.id, text: r.text.trim() }))
    await startChallenge(title.trim(), clean, days)
  }

  return (
    <div className="rounded-2xl bg-ink-800/60 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Όνομα challenge"
        className="w-full bg-transparent pb-2 text-base font-medium text-mist-100 placeholder:text-mist-600 focus:outline-none"
      />
      <div className="mb-3 flex items-center gap-2 text-sm text-mist-400">
        <span>Διάρκεια</span>
        <input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
          className="w-16 rounded-lg bg-ink-700 px-2 py-1 text-center text-mist-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-flow/50"
        />
        <span>μέρες</span>
      </div>

      <div className="space-y-2">
        {rules.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right text-xs text-mist-600 tabular-nums">{i + 1}.</span>
            <input
              value={r.text}
              onChange={(e) => setRuleText(r.id, e.target.value)}
              placeholder="Κανόνας…"
              className="min-w-0 flex-1 rounded-lg bg-ink-700 px-3 py-2 text-sm text-mist-100 placeholder:text-mist-600 focus:outline-none focus:ring-1 focus:ring-flow/50"
            />
            <button
              type="button"
              onClick={() => removeRule(r.id)}
              aria-label="Αφαίρεση"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-mist-500 active:bg-ink-700"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 12h12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRule}
        className="mt-2 text-sm text-flow-dim active:text-flow"
      >
        + Κανόνας
      </button>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-ink-700 py-2.5 text-sm font-medium text-mist-300 active:bg-ink-600"
        >
          Άκυρο
        </button>
        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className="flex-1 rounded-xl bg-flow py-2.5 text-sm font-semibold text-ink-900 transition-opacity disabled:opacity-30"
        >
          Ξεκίνα
        </button>
      </div>
    </div>
  )
}
