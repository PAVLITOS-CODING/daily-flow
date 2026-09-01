import { useEffect, useState } from 'react'
import { PinPad } from './PinPad'
import {
  isLockEnabled,
  setPin,
  disableLock,
  biometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
} from '../lib/lock'

const PIN_LEN = 4

type Step = 'menu' | 'set' | 'confirm'

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [lockOn, setLockOn] = useState(isLockEnabled())
  const [bioOn, setBioOn] = useState(isBiometricEnabled())
  const [bioSupported, setBioSupported] = useState(false)
  const [step, setStep] = useState<Step>('menu')
  const [entry, setEntry] = useState('')
  const [first, setFirst] = useState('')
  const [error, setError] = useState(false)
  const [bioError, setBioError] = useState<string | null>(null)

  useEffect(() => {
    void biometricAvailable().then(setBioSupported)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function beginSetPin() {
    setEntry('')
    setFirst('')
    setError(false)
    setStep('set')
  }

  async function onDigit(d: string) {
    if (entry.length >= PIN_LEN) return
    setError(false)
    const next = entry + d
    setEntry(next)
    if (next.length < PIN_LEN) return

    if (step === 'set') {
      setFirst(next)
      setEntry('')
      setStep('confirm')
    } else if (step === 'confirm') {
      if (next === first) {
        await setPin(next)
        setLockOn(true)
        setStep('menu')
      } else {
        if (navigator.vibrate) navigator.vibrate([20, 40, 20])
        setError(true)
        setTimeout(() => {
          setEntry('')
          setFirst('')
          setStep('set')
        }, 350)
      }
    }
  }

  function turnLockOff() {
    disableLock()
    setLockOn(false)
    setBioOn(false)
  }

  async function toggleBiometric() {
    setBioError(null)
    if (bioOn) {
      disableBiometric()
      setBioOn(false)
      return
    }
    const ok = await enableBiometric()
    if (ok) setBioOn(true)
    else setBioError('Δεν ήταν δυνατή η ενεργοποίηση. Δοκίμασε ξανά.')
  }

  const inSetup = step !== 'menu'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-rise w-full max-w-lg rounded-t-3xl border-t border-ink-600 bg-ink-800 px-5 pt-3"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ρυθμίσεις"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-500" />

        {inSetup ? (
          <div className="flex flex-col items-center py-2">
            <p className="mb-8 text-sm text-mist-300">
              {step === 'set' ? 'Διάλεξε ένα PIN 4 ψηφίων' : error ? 'Δεν ταιριάζουν — δοκίμασε ξανά' : 'Επιβεβαίωσε το PIN'}
            </p>
            <PinPad
              length={PIN_LEN}
              filled={entry.length}
              onDigit={(d) => void onDigit(d)}
              onDelete={() => {
                setError(false)
                setEntry((p) => p.slice(0, -1))
              }}
              error={error}
            />
            <button
              type="button"
              onClick={() => setStep('menu')}
              className="mt-8 text-sm text-mist-500 active:text-mist-300"
            >
              Άκυρο
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold text-mist-100">
              Ασφάλεια
            </h2>

            <Row
              title="Κλείδωμα με PIN"
              subtitle="Ζητάει PIN κάθε φορά που ανοίγει η εφαρμογή"
              on={lockOn}
              onToggle={() => (lockOn ? turnLockOff() : beginSetPin())}
            />

            {lockOn && (
              <>
                <button
                  type="button"
                  onClick={beginSetPin}
                  className="mt-1 w-full rounded-xl bg-ink-700 py-2.5 text-sm font-medium text-mist-200 active:bg-ink-600"
                >
                  Αλλαγή PIN
                </button>

                {bioSupported && (
                  <div className="mt-3">
                    <Row
                      title="Face ID / Touch ID"
                      subtitle="Ξεκλείδωμα με βιομετρικά"
                      on={bioOn}
                      onToggle={() => void toggleBiometric()}
                    />
                    {bioError && <p className="mt-1 text-xs text-prio-med">{bioError}</p>}
                  </div>
                )}
              </>
            )}

            <p className="mt-5 px-1 text-xs leading-relaxed text-mist-600">
              Το κλείδωμα προστατεύει την πρόσβαση στην εφαρμογή στη συσκευή σου. Τα δεδομένα
              παραμένουν πάντα τοπικά — δεν φεύγουν ποτέ από το κινητό σου.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-ink-700 py-3 font-medium text-mist-300 active:bg-ink-600"
            >
              Κλείσιμο
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Row({
  title,
  subtitle,
  on,
  onToggle,
}: {
  title: string
  subtitle: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-700/50 px-3.5 py-3">
      <div>
        <p className="text-sm text-mist-100">{title}</p>
        <p className="text-xs text-mist-600">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-flow' : 'bg-ink-500'}`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
