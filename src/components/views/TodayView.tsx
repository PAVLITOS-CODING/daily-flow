import type { Item } from '../../types'
import { useToday } from '../../hooks/useItems'
import { ItemRow } from '../ItemRow'
import { EmptyState, ListShell } from '../Shared'

export function TodayView({ onEdit }: { onEdit: (i: Item) => void }) {
  const items = useToday()
  if (items === undefined) return null

  const open = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  return (
    <ListShell>
      {items.length === 0 ? (
        <EmptyState title="Nothing today" hint="Add your first task below." />
      ) : (
        <ul className="divide-y divide-ink-700/60">
          {open.map((i) => (
            <ItemRow key={i.id} item={i} onEdit={onEdit} />
          ))}
          {done.length > 0 && (
            <li className="px-1 pt-6 pb-1 text-xs tracking-widest text-mist-600 uppercase">
              Done · {done.length}
            </li>
          )}
          {done.map((i) => (
            <ItemRow key={i.id} item={i} onEdit={onEdit} />
          ))}
        </ul>
      )}
    </ListShell>
  )
}
