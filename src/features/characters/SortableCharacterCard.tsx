import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Character } from '@/types/database'
import { TIER_LABEL, type Tier } from './useCharacterAppearances'
import { cn } from '@/lib/cn'

interface Props {
  character: Character
  selected: boolean
  tier: Tier
  count: number
  onSelect: () => void
}

const avatarByTier: Record<Tier, string> = {
  lead: 'h-12 w-12 text-lg bg-accent text-white',
  supporting: 'h-11 w-11 text-base bg-accent/15 text-accent',
  minor: 'h-10 w-10 text-sm bg-surface-2 text-ink',
  none: 'h-10 w-10 text-sm bg-surface-2 text-ink-faint',
}

const badgeByTier: Record<Tier, string> = {
  lead: 'text-accent',
  supporting: 'text-ink-muted',
  minor: 'text-ink-faint',
  none: 'text-ink-faint',
}

export function SortableCharacterCard({ character: c, selected, tier, count, onSelect }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: c.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      {...attributes}
      {...listeners}
      className={cn(
        'flex touch-none flex-col items-start gap-3 rounded-xl border bg-surface p-4 text-left transition-colors',
        selected
          ? 'border-accent/60 ring-1 ring-accent/40'
          : tier === 'lead'
            ? 'border-accent/30 hover:border-accent/50'
            : 'border-line hover:border-ink-faint/50 hover:bg-surface-2/50',
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full font-semibold',
          avatarByTier[tier],
        )}
      >
        {(c.name || '?').trim().charAt(0) || '?'}
      </span>
      <div className="min-w-0 self-stretch">
        <p
          className={cn(
            'truncate text-sm text-ink',
            tier === 'lead' ? 'font-semibold' : 'font-medium',
          )}
        >
          {c.name || '이름 없는 인물'}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {[c.age, c.gender].filter(Boolean).join(' · ') || '설정 미입력'}
        </p>
        <p className={cn('mt-1 text-[11px]', badgeByTier[tier])}>
          {TIER_LABEL[tier]}
          {count > 0 && ` · ${count}회 등장`}
        </p>
      </div>
    </button>
  )
}
