import { useEffect, useRef, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { ScrapCard, StickyColor } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PinIcon, TrashIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export interface PostitData {
  card: ScrapCard
  dimmed: boolean
  onChange: (patch: Partial<ScrapCard>) => void
  onDelete: () => void
  [key: string]: unknown
}

const COLORS: { key: StickyColor; cls: string }[] = [
  { key: 'yellow', cls: 'bg-sticky-yellow' },
  { key: 'pink', cls: 'bg-sticky-pink' },
  { key: 'green', cls: 'bg-sticky-green' },
  { key: 'blue', cls: 'bg-sticky-blue' },
  { key: 'gray', cls: 'bg-sticky-gray' },
]
const BG: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  green: 'bg-sticky-green',
  blue: 'bg-sticky-blue',
  gray: 'bg-sticky-gray',
}

export function PostitNode({ data }: NodeProps) {
  const { card, dimmed, onChange, onDelete } = data as PostitData
  const [title, setTitle] = useState(card.title ?? '')
  const [body, setBody] = useState(card.body ?? '')
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(card.title ?? '')
    setBody(card.body ?? '')
  }, [card.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 내용 양에 맞춰 textarea 높이 자동 확장 (내부 스크롤 없이)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body])

  const save = useDebouncedCallback((patch: Partial<ScrapCard>) => onChange(patch))

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-black/10 text-ink shadow-md shadow-black/10 transition-opacity',
        BG[card.color],
        dimmed ? 'opacity-20' : 'opacity-100',
      )}
      style={{ width: card.width || 240 }}
    >
      {/* 핀 표시 */}
      {card.pinned && (
        <PinIcon className="absolute -right-1.5 -top-1.5 rotate-12 text-danger" width={18} height={18} />
      )}

      {/* 호버 툴바 */}
      <div className="nodrag absolute -top-9 left-0 flex items-center gap-1 rounded-lg border border-line bg-canvas px-1.5 py-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => onChange({ color: c.key })}
            className={cn(
              'h-4 w-4 rounded-full border border-black/10',
              c.cls,
              card.color === c.key && 'ring-2 ring-accent ring-offset-1',
            )}
            aria-label={`색상 ${c.key}`}
          />
        ))}
        <span className="mx-0.5 h-4 w-px bg-line" />
        <button
          onClick={() => onChange({ pinned: !card.pinned })}
          className={cn(
            'rounded p-0.5 hover:bg-surface-2',
            card.pinned ? 'text-danger' : 'text-ink-muted',
          )}
          aria-label="핀 고정"
        >
          <PinIcon width={14} height={14} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-0.5 text-ink-muted hover:bg-surface-2 hover:text-danger"
          aria-label="삭제"
        >
          <TrashIcon width={14} height={14} />
        </button>
      </div>

      {/* 본문 */}
      <div className="p-3">
        {card.kind === 'link' ? (
          <div className="space-y-2">
            {card.image_url && (
              <img
                src={card.image_url}
                alt=""
                className="h-28 w-full rounded-md object-cover"
                draggable={false}
              />
            )}
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                save({ title: e.target.value })
              }}
              className="nodrag w-full bg-transparent text-sm font-semibold text-ink outline-none"
              placeholder="제목"
            />
            {card.description && (
              <p className="line-clamp-3 text-xs text-ink-muted">{card.description}</p>
            )}
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noreferrer"
                className="nodrag block truncate text-[11px] text-accent hover:underline"
              >
                {card.url}
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                save({ title: e.target.value })
              }}
              className="nodrag w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink/40"
              placeholder="제목"
            />
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                save({ body: e.target.value })
              }}
              rows={2}
              className="nodrag w-full resize-none overflow-hidden bg-transparent text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink/40"
              placeholder="메모를 입력하세요"
            />
          </div>
        )}
      </div>
    </div>
  )
}
