import type { KeyboardEvent, MouseEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Episode } from '@/types/database'
import { cn } from '@/lib/cn'

interface Props {
  episode: Episode
  selected: boolean
  multiSelected: boolean
  onClick: (e: MouseEvent) => void
  onActivate: () => void
}

export function SortableEpisodeItem({
  episode,
  selected,
  multiSelected,
  onClick,
  onActivate,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: episode.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-select-id={episode.id}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        'group flex cursor-pointer touch-none items-center gap-2 rounded-lg px-2 py-2 transition-colors',
        multiSelected
          ? 'bg-accent/10 text-ink ring-1 ring-accent/30'
          : selected
            ? 'bg-surface-2 text-ink'
            : 'text-ink-muted hover:bg-surface-2/60 hover:text-ink',
      )}
    >
      <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
        {episode.episode_no}
      </span>
      <span className="flex-1 truncate text-[13px]">{episode.title || '제목 없음'}</span>
    </div>
  )
}
