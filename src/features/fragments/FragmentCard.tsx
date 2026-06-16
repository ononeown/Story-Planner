import { useEffect, useRef, useState } from 'react'
import type { Fragment, StickyColor } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { TrashIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const COLORS: StickyColor[] = ['yellow', 'pink', 'green', 'blue', 'gray']
const BG: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  green: 'bg-sticky-green',
  blue: 'bg-sticky-blue',
  gray: 'bg-sticky-gray',
}

interface Props {
  fragment: Fragment
  onChange: (patch: Partial<Fragment>) => void
  onDelete: () => void
}

export function FragmentCard({ fragment, onChange, onDelete }: Props) {
  const [title, setTitle] = useState(fragment.title ?? '')
  const [content, setContent] = useState(fragment.content ?? '')
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(fragment.title ?? '')
    setContent(fragment.content ?? '')
  }, [fragment.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 내용 양에 맞춰 높이 자동 확장 (내부 스크롤 없이)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content])

  const save = useDebouncedCallback((patch: Partial<Fragment>) => onChange(patch))

  return (
    <div className={cn('group flex break-inside-avoid flex-col rounded-2xl border border-black/10 p-3.5 shadow-sm shadow-black/5', BG[fragment.color])}>
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          save({ title: e.target.value })
        }}
        placeholder="장면 제목 (선택)"
        className="mb-1 w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink/40"
      />
      <textarea
        ref={contentRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          save({ content: e.target.value })
        }}
        rows={3}
        placeholder="보고 싶은 장면을 썰처럼 자유롭게…"
        className="w-full resize-none overflow-hidden bg-transparent text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink/40"
      />

      <div className="mt-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              className={cn(
                'h-4 w-4 rounded-full border border-black/10',
                BG[c],
                fragment.color === c && 'ring-2 ring-accent ring-offset-1',
              )}
              aria-label={`색상 ${c}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="rounded px-1.5 py-0.5 text-[11px] text-ink/60 hover:bg-black/5 hover:text-ink"
            title="사건 상세에 붙여넣기용 복사"
          >
            복사
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-ink/50 hover:bg-black/5 hover:text-danger"
            aria-label="삭제"
          >
            <TrashIcon width={14} height={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
