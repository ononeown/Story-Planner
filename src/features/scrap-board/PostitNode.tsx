import { useEffect, useRef, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { ScrapCard, StickyColor } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { useModifierHeld } from '@/lib/useModifierHeld'
import { PinIcon, TrashIcon, ChevronIcon } from '@/components/ui/icons'
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
  const [collapsed, setCollapsedState] = useState(card.collapsed ?? false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(card.title ?? '')
    setBody(card.body ?? '')
    setCollapsedState(card.collapsed ?? false)
  }, [card.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 로컬 즉시 반영 + DB 저장(컬럼 없으면 무시됨)
  function setCollapsed(updater: (v: boolean) => boolean) {
    setCollapsedState((prev) => {
      const next = updater(prev)
      onChange({ collapsed: next })
      return next
    })
  }

  // 내용 양에 맞춰 textarea 높이 자동 확장 (내부 스크롤 없이)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body])

  const save = useDebouncedCallback((patch: Partial<ScrapCard>) => onChange(patch))
  // Ctrl/Shift 누르면 카드 내용은 클릭을 무시 → 선택/이동으로 인식
  const moveMode = useModifierHeld()

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
      <div className={cn('p-3', moveMode && 'pointer-events-none')}>
        {/* 제목 줄 + 접기 토글 */}
        <div className="flex items-start gap-1">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="nodrag mt-0.5 shrink-0 rounded p-0.5 text-ink/50 hover:bg-black/5 hover:text-ink"
            aria-label={collapsed ? '펼치기' : '접기'}
          >
            <ChevronIcon
              width={14}
              height={14}
              className={cn('transition-transform', !collapsed && 'rotate-90')}
            />
          </button>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              save({ title: e.target.value })
            }}
            className="nodrag w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink/40"
            placeholder="제목"
          />
        </div>

        {!collapsed &&
          (card.kind === 'link' ? (
            <div className="mt-2 space-y-2">
              {card.image_url && (
                <img
                  src={card.image_url}
                  alt=""
                  className="h-28 w-full rounded-md object-cover"
                  draggable={false}
                />
              )}
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
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                save({ body: e.target.value })
              }}
              rows={2}
              className="nodrag mt-1.5 w-full resize-none overflow-hidden bg-transparent text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink/40"
              placeholder="메모를 입력하세요"
            />
          ))}
      </div>
    </div>
  )
}
