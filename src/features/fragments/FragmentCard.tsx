import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { Fragment } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { TrashIcon, SparkleIcon } from '@/components/ui/icons'

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

  // 내용 양에 맞춰 높이 자동 확장
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content])

  const save = useDebouncedCallback((patch: Partial<Fragment>) => onChange(patch))

  // 카드 우클릭 → 제목+본문 통째로 AI 메뉴 호출
  function onContextMenu(e: MouseEvent) {
    e.preventDefault()
    const text = [title, content].map((t) => t.trim()).filter(Boolean).join('\n\n')
    if (!text) return
    window.dispatchEvent(
      new CustomEvent('storyplanner:ai-context', {
        detail: { text, x: e.clientX, y: e.clientY },
      }),
    )
  }

  return (
    <div
      onContextMenu={onContextMenu}
      className="group break-inside-avoid rounded-xl border border-line bg-surface p-4 shadow-sm shadow-black/5 transition-colors hover:border-ink-faint/40"
    >
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          save({ title: e.target.value })
        }}
        placeholder=""
        className="mb-1.5 w-full bg-transparent text-sm font-semibold text-ink outline-none"
      />
      <textarea
        ref={contentRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          save({ content: e.target.value })
        }}
        rows={3}
        placeholder=""
        className="w-full resize-none overflow-hidden bg-transparent text-[13px] leading-relaxed text-ink outline-none"
      />

      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="mr-auto flex items-center gap-1 text-[11px] text-ink-faint">
          <SparkleIcon width={12} height={12} /> 우클릭 → AI
        </span>
        <button
          onClick={() => navigator.clipboard.writeText([title, content].filter(Boolean).join('\n\n'))}
          className="rounded px-1.5 py-0.5 text-[11px] text-ink-muted hover:bg-surface-2 hover:text-ink"
        >
          복사
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-ink-faint hover:bg-surface-2 hover:text-danger"
          aria-label="삭제"
        >
          <TrashIcon width={14} height={14} />
        </button>
      </div>
    </div>
  )
}
