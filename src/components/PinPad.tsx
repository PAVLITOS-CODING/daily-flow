interface Props {
  length: number
  filled: number
  onDigit: (d: string) => void
  onDelete: () => void
  error?: boolean
  /** Optional Face ID button in the bottom-left key slot. */
  onBiometric?: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function PinPad({ length, filled, onDigit, onDelete, error, onBiometric }: Props) {
  return (
    <div className="flex flex-col items-center">
      {/* dots */}
      <div className={`mb-12 flex gap-5 ${error ? 'animate-[shake_0.35s]' : ''}`}>
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`size-5 rounded-full border-2 transition-colors ${
              i < filled ? 'border-flow bg-flow' : error ? 'border-prio-high' : 'border-ink-500'
            }`}
          />
        ))}
      </div>

      {/* keypad */}
      <div className="grid grid-cols-3 gap-5">
        {KEYS.map((k) => (
          <Key key={k} onClick={() => onDigit(k)}>
            {k}
          </Key>
        ))}
        {onBiometric ? (
          <Key onClick={onBiometric} aria-label="Face ID / Touch ID">
            <FaceIcon />
          </Key>
        ) : (
          <span />
        )}
        <Key onClick={() => onDigit('0')}>0</Key>
        <Key onClick={onDelete} aria-label="Διαγραφή">
          <BackIcon />
        </Key>
      </div>
    </div>
  )
}

function Key({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="grid size-20 place-items-center rounded-full bg-ink-800/70 font-[family-name:var(--font-display)] text-3xl text-mist-100 transition-colors active:bg-ink-600"
    >
      {children}
    </button>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 5L3 12l6 7h10a2 2 0 002-2V7a2 2 0 00-2-2H9z" strokeLinejoin="round" />
      <path d="M13 10l4 4M17 10l-4 4" strokeLinecap="round" />
    </svg>
  )
}
function FaceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8 text-flow" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" strokeLinecap="round" />
      <path d="M9 10v1M15 10v1M12 9v4l-1 1M9.5 15c1.5 1 3.5 1 5 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
