import { useEffect, useState } from 'react'
import type { Episode, Foreshadowing } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Input } from '@/components/ui/Input'
import { TrashIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

interface Props {
  foreshadow: Foreshadowing
  episodes: Episode[]
  onChange: (patch: Partial<Foreshadowing>) => void
  onDelete: () => void
}

export function ForeshadowRow({ foreshadow, episodes, onChange, onDelete }: Props) {
  const [content, setContent] = useState(foreshadow.content)

  useEffect(() => {
    setContent(foreshadow.content)
  }, [foreshadow.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((patch: Partial<Foreshadowing>) => onChange(patch))

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
      {/* 회수 체크 */}
      <input
        type="checkbox"
        checked={foreshadow.resolved}
        onChange={(e) =>
          onChange({
            resolved: e.target.checked,
            resolved_episode_id: e.target.checked ? foreshadow.resolved_episode_id : null,
          })
        }
        className="h-4 w-4 shrink-0 accent-accent"
        title="회수 여부"
      />

      <Input
        value={content}
        placeholder="복선 내용"
        onChange={(e) => {
          setContent(e.target.value)
          save({ content: e.target.value })
        }}
        className={cn(
          'h-8 flex-1 border-0 bg-transparent px-0 text-[13px] focus:ring-0',
          foreshadow.resolved && 'text-ink-muted line-through',
        )}
      />

      {/* 회수 회차 선택 (회수 시) */}
      {foreshadow.resolved && (
        <select
          value={foreshadow.resolved_episode_id ?? ''}
          onChange={(e) => onChange({ resolved_episode_id: e.target.value || null })}
          className="h-8 shrink-0 rounded-md border border-line bg-canvas px-1.5 text-xs text-ink focus:outline-none"
          title="회수된 회차"
        >
          <option value="">회수 회차</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.episode_no}화
            </option>
          ))}
        </select>
      )}

      <button
        onClick={onDelete}
        className="shrink-0 rounded p-1 text-ink-faint transition-colors hover:text-danger"
        aria-label="복선 삭제"
      >
        <TrashIcon width={14} height={14} />
      </button>
    </div>
  )
}
