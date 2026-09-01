import { useEffect, useState } from 'react'
import { PinPad } from './PinPad'
import {
  pinLength,
  verifyPin,
  isBiometricEnabled,
  unlockWithBiometric,
} from '../lib/lock'

/** Full-screen gate shown until the correct PIN (or biometric) is entered. */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const len = pinLength()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const biometric = isBiometricEnabled()

  async function tryBiometric() {
    const ok = await unlockWithBiometric()
    if (ok) onUnlock()
  }

  // Offer Face ID immediately on open.
  useEffect(() => {
    if (biometric) void tryBiometric()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onDigit(d: string) {
    if (pin.length >= len) return
    setError(false)
    const next = pin + d
    setPin(next)
    if (next.length === len) void submit(next)
  }

  async function submit(candidate: string) {
    if (await verifyPin(candidate)) {
      onUnlock()
    } else {
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
      setError(true)
      setTimeout(() => setPin(''), 350)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-900 px-6">
      <div className="mb-6 grid size-16 place-items-center rounded-2xl bg-ink-800">
        <svg viewBox="0 0 24 24" className="size-7 text-flow" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-mist-100">
        Daily Flow
      </h1>
      <p className="mb-10 text-sm text-mist-500">
        {error ? 'Λάθος PIN' : 'Βάλε το PIN σου'}
      </p>

      <PinPad
        length={len}
        filled={pin.length}
        onDigit={onDigit}
        onDelete={() => {
          setError(false)
          setPin((p) => p.slice(0, -1))
        }}
        error={error}
        {...(biometric ? { onBiometric: () => void tryBiometric() } : {})}
      />
    </div>
  )
}
