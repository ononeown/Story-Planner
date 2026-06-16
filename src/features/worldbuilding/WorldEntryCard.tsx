import { useEffect, useState } from 'react'
import type { Worldbuilding } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { TrashIcon } from '@/components/ui/icons'

interface Props {
  entry: Worldbuilding
  onChange: (patch: Partial<Worldbuilding>) => void
  onDelete: () => void
}

export function WorldEntryCard({ entry, onChange, onDelete }: Props) {
  const [title, setTitle] = useState(entry.title)
  const [content, setContent] = useState(entry.content ?? '')

  useEffect(() => {
    setTitle(entry.title)
    setContent(entry.content ?? '')
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((patch: Partial<Worldbuilding>) => onChange(patch))

  return (
    <div className="group rounded-lg border border-line bg-canvas p-3">
      <div className="mb-2 flex items-center gap-2">
        <Input
          value={title}
          placeholder="항목 제목"
          onChange={(e) => {
            setTitle(e.target.value)
            save({ title: e.target.value })
          }}
          className="h-8 border-0 bg-transparent px-0 text-sm font-medium focus:ring-0"
        />
        <button
          onClick={onDelete}
          className="shrink-0 rounded-md p-1 text-ink-faint opacity-0 transition-opacity hover:bg-surface-2 hover:text-danger group-hover:opacity-100"
          aria-label="삭제"
        >
          <TrashIcon />
        </button>
      </div>
      <Textarea
        rows={3}
        value={content}
        placeholder="설정 내용을 입력하세요"
        onChange={(e) => {
          setContent(e.target.value)
          save({ content: e.target.value })
        }}
        className="border-0 bg-transparent px-0 py-0 focus:ring-0"
      />
    </div>
  )
}
