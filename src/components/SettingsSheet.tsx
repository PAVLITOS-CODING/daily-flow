import { useEffect, useRef, useState } from 'react'
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
import { APP_VERSION_LABEL } from '../version'
import { Switch } from './Switch'
import { loadTheme, setTheme, type ThemePref } from '../lib/theme'
import { exportBackup, importBackup } from '../lib/backup'

const PIN_LEN = 4

type Step = 'menu' | 'set' | 'confirm'

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [theme, setThemeState] = useState<ThemePref>(loadTheme())
  const [lockOn, setLockOn] = useState(isLockEnabled())
  const [bioOn, setBioOn] = useState(isBiometricEnabled())
  const [bioSupported, setBioSupported] = useState(false)
  const [step, setStep] = useState<Step>('menu')
  const [entry, setEntry] = useState('')
  const [first, setFirst] = useState('')
  const [error, setError] = useState(false)
  const [bioError, setBioError] = useState<string | null>(null)
  const [dataMsg, setDataMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onExport() {
    setDataMsg(null)
    const r = await exportBackup()
    if (r === 'shared' || r === 'downloaded') setDataMsg('Το backup δημιουργήθηκε — αποθήκευσέ το κάπου ασφαλές.')
    else if (r === 'copied') setDataMsg('Αντιγράφηκε στο πρόχειρο — επικόλλησέ το σε ένα αρχείο/σημείωση.')
    else setDataMsg('Δεν ήταν δυνατή η εξαγωγή σε αυτόν τον browser.')
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    if (!window.confirm('Η εισαγωγή θα ΑΝΤΙΚΑΤΑΣΤΗΣΕΙ τα τρέχοντα δεδομένα με αυτά του backup. Συνέχεια;')) return
    try {
      const text = await file.text()
      const c = await importBackup(text)
      setDataMsg(`Εισήχθησαν ${c.items} εγγραφές, ${c.challenges} challenge(s).`)
    } catch (err) {
      setDataMsg(err instanceof Error ? err.message : 'Αποτυχία εισαγωγής.')
    }
  }

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
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
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold text-mist-100">
              Εμφάνιση
            </h2>
            <div className="mb-6 flex overflow-hidden rounded-xl bg-ink-700 p-1">
              {([
                ['system', 'Auto'],
                ['light', 'Φωτεινό'],
                ['dark', 'Σκούρο'],
              ] as [ThemePref, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTheme(value)
                    setThemeState(value)
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    theme === value ? 'bg-flow text-onaccent' : 'text-mist-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

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

            <h2 className="mt-7 mb-1 font-[family-name:var(--font-display)] text-lg font-bold text-mist-100">
              Backup
            </h2>
            <p className="mb-3 px-1 text-xs leading-relaxed text-mist-600">
              Τα δεδομένα ζουν μόνο σε αυτή τη συσκευή. Κράτα ένα backup για να τα μεταφέρεις σε
              άλλο κινητό ή αν αλλάξεις διεύθυνση/host.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void onExport()}
                className="flex-1 rounded-xl bg-ink-700 py-3 text-sm font-medium text-mist-200 active:bg-ink-600"
              >
                Εξαγωγή
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 rounded-xl bg-ink-700 py-3 text-sm font-medium text-mist-200 active:bg-ink-600"
              >
                Εισαγωγή
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => void onImportFile(e)}
                className="hidden"
              />
            </div>
            {dataMsg && <p className="mt-2 px-1 text-xs text-flow-dim">{dataMsg}</p>}

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-ink-700 py-3 font-medium text-mist-300 active:bg-ink-600"
            >
              Κλείσιμο
            </button>

            <p className="mt-4 text-center text-xs text-mist-600">Daily Flow · {APP_VERSION_LABEL}</p>
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
      <Switch on={on} onChange={onToggle} label={title} />
    </div>
  )
}
