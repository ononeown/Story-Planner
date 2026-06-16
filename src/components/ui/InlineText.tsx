import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * 인라인 편집 텍스트: 평소엔 텍스트, 클릭하면 입력칸.
 * Enter 또는 포커스 해제 시 확정하고 다시 텍스트로. Esc 는 취소.
 */
export function InlineText({ value, onCommit, placeholder, className }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }
  function commit() {
    setEditing(false)
    if (draft !== value) onCommit(draft)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            setEditing(false)
          }
        }}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink',
          'placeholder:text-ink-faint focus:border-accent/70 focus:ring-2 focus:ring-accent/30 focus:outline-none',
          className,
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        'flex h-10 w-full cursor-text items-center rounded-lg px-3 text-left text-sm transition-colors hover:bg-surface-2/50',
        value ? 'text-ink' : 'text-ink-faint',
        className,
      )}
    >
      {value || placeholder}
    </button>
  )
}
