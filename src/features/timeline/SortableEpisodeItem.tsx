import type { KeyboardEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Episode } from '@/types/database'
import { cn } from '@/lib/cn'

interface Props {
  episode: Episode
  selected: boolean
  bulkSelected: boolean
  onSelect: () => void
  onToggleBulk: () => void
}

export function SortableEpisodeItem({
  episode,
  selected,
  bulkSelected,
  onSelect,
  onToggleBulk,
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
      onSelect()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'group flex cursor-pointer touch-none items-center gap-2 rounded-lg px-2 py-2 transition-colors',
        bulkSelected
          ? 'bg-accent/10 text-ink ring-1 ring-accent/30'
          : selected
            ? 'bg-surface-2 text-ink'
            : 'text-ink-muted hover:bg-surface-2/60 hover:text-ink',
      )}
    >
      {/* 다중 선택 체크박스 (호버/선택 시 표시, 폭 고정으로 흔들림 방지) */}
      <span
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onToggleBulk()
        }}
        className="flex w-4 shrink-0 items-center justify-center"
      >
        <input
          type="checkbox"
          checked={bulkSelected}
          readOnly
          className={cn(
            'h-3.5 w-3.5 cursor-pointer accent-accent transition-opacity',
            bulkSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          aria-label="선택"
        />
      </span>

      <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
        {episode.episode_no}
      </span>
      <span className="flex-1 truncate text-[13px]">{episode.title || '제목 없음'}</span>
    </div>
  )
}
