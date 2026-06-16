import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import type { Episode } from '@/types/database'

interface Props {
  episode: Episode
  onSave: (content: JSONContent) => void
}

/** TipTap 본문 에디터 — 회차별 content(jsonb) 자동 저장. 회차 전환 시 key 로 remount. */
export function WorkspaceEditor({ episode, onSave }: Props) {
  const save = useDebouncedCallback((json: JSONContent) => onSave(json), 800)

  const editor = useEditor({
    extensions: [StarterKit],
    content: (episode.content as JSONContent) ?? '',
    editorProps: {
      attributes: { class: 'ProseMirror focus:outline-none' },
    },
    onUpdate: ({ editor }) => save(editor.getJSON()),
  })

  return <EditorContent editor={editor} />
}
