import { useState } from 'react'
import { useEditor, EditorContent, type JSONContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import type { Episode } from '@/types/database'

interface Props {
  episode: Episode
  onSave: (content: JSONContent) => void
}

interface Counts {
  chars: number
  charsNoSpace: number
  words: number
}

function countOf(editor: Editor | null): Counts {
  const text = editor?.getText() ?? ''
  return {
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
  }
}

/** TipTap 본문 에디터 — 회차별 content(jsonb) 자동 저장 + 글자/단어 수. */
export function WorkspaceEditor({ episode, onSave }: Props) {
  const save = useDebouncedCallback((json: JSONContent) => onSave(json), 800)
  const [counts, setCounts] = useState<Counts>({ chars: 0, charsNoSpace: 0, words: 0 })

  const editor = useEditor({
    extensions: [StarterKit],
    content: (episode.content as JSONContent) ?? '',
    editorProps: { attributes: { class: 'ProseMirror focus:outline-none' } },
    onCreate: ({ editor }) => setCounts(countOf(editor)),
    onUpdate: ({ editor }) => {
      setCounts(countOf(editor))
      save(editor.getJSON())
    },
  })

  return (
    <div>
      <EditorContent editor={editor} />
      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-line bg-canvas/90 py-2 text-[12px] text-ink-faint backdrop-blur">
        <span>공백 포함 {counts.chars.toLocaleString()}자</span>
        <span>공백 제외 {counts.charsNoSpace.toLocaleString()}자</span>
        <span>{counts.words.toLocaleString()}단어</span>
      </div>
    </div>
  )
}
