import type { ReactNode } from 'react'

/** Scrollable list region with row dividers. */
export function ListShell({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4">
      <div className="mx-auto max-w-lg pb-4">{children}</div>
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-24 text-center">
      <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-ink-700/60">
        <span className="size-3 rounded-full bg-flow/70" />
      </div>
      <p className="text-[15px] font-medium text-mist-300">{title}</p>
      <p className="text-sm text-mist-600">{hint}</p>
    </div>
  )
}
