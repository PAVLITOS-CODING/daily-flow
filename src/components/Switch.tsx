interface Props {
  on: boolean
  onChange: () => void
  label?: string
}

/** A polished iOS-style toggle used across settings. */
export function Switch({ on, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative flex h-[31px] w-[51px] shrink-0 items-center rounded-full px-[2px] transition-colors duration-300 ease-out ${
        on ? 'bg-flow' : 'bg-ink-500'
      }`}
    >
      <span
        className={`grid size-[27px] place-items-center rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${
          on ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      >
        {/* subtle check that fades in when on */}
        <svg
          viewBox="0 0 24 24"
          className={`size-3.5 text-flow-dim transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}
