import type { Item } from '../../types'
import { useUpcoming } from '../../hooks/useItems'
import { relativeLabel } from '../../lib/dates'
import { ItemRow } from '../ItemRow'
import { EmptyState, ListShell } from '../Shared'

export function UpcomingView({ onEdit }: { onEdit: (i: Item) => void }) {
  const items = useUpcoming()
  if (items === undefined) return null

  // Group by date for legible day headers, while preserving the blended order.
  const groups: { date: string; items: Item[] }[] = []
  for (const it of items) {
    const last = groups[groups.length - 1]
    if (last && last.date === it.date) last.items.push(it)
    else groups.push({ date: it.date, items: [it] })
  }

  return (
    <ListShell>
      {items.length === 0 ? (
        <EmptyState title="All clear ahead" hint="Nothing scheduled from today on." />
      ) : (
        groups.map((g) => (
          <section key={g.date}>
            <h2 className="px-1 pt-5 pb-1 text-xs tracking-widest text-mist-600 uppercase first:pt-1">
              {relativeLabel(g.date)}
            </h2>
            <ul className="divide-y divide-ink-700/60">
              {g.items.map((i) => (
                <ItemRow key={i.id} item={i} onEdit={onEdit} />
              ))}
            </ul>
          </section>
        ))
      )}
    </ListShell>
  )
}
