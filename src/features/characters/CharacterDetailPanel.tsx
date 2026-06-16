import { useEffect, useState } from 'react'
import type { Character } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { SaveStatus, type SaveState } from '@/components/ui/SaveStatus'
import { CloseIcon, TrashIcon } from '@/components/ui/icons'

// 편집 가능한 프로필 필드 (외적/내적)
type FormKey =
  | 'name' | 'age' | 'gender' | 'appearance'
  | 'strengths' | 'weaknesses' | 'values_text'
  | 'trauma' | 'lack' | 'desire' | 'signature_line'

type Form = Record<FormKey, string>

const FORM_KEYS: FormKey[] = [
  'name', 'age', 'gender', 'appearance',
  'strengths', 'weaknesses', 'values_text',
  'trauma', 'lack', 'desire', 'signature_line',
]

function toForm(c: Character): Form {
  return FORM_KEYS.reduce((acc, k) => {
    acc[k] = (c[k] as string | null) ?? ''
    return acc
  }, {} as Form)
}

interface Props {
  character: Character
  onChange: (patch: Partial<Character>) => void
  onClose: () => void
  onDelete: () => void
}

export function CharacterDetailPanel({ character, onChange, onClose, onDelete }: Props) {
  const [form, setForm] = useState<Form>(() => toForm(character))
  const [status, setStatus] = useState<SaveState>('idle')

  // 다른 캐릭터 선택 시 폼 갱신
  useEffect(() => {
    setForm(toForm(character))
    setStatus('idle')
  }, [character.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((next: Form) => {
    setStatus('saving')
    onChange(next)
    setStatus('saved')
  })

  function set(key: FormKey, value: string) {
    const next = { ...form, [key]: value }
    setForm(next)
    save(next)
  }

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-line bg-surface/70 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">인물 상세</span>
          <SaveStatus state={status} />
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
          aria-label="닫기"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* 외적 요소 */}
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            외적 요소
          </h4>
          <Field label="이름">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="나이">
              <Input value={form.age} onChange={(e) => set('age', e.target.value)} />
            </Field>
            <Field label="성별">
              <Input value={form.gender} onChange={(e) => set('gender', e.target.value)} />
            </Field>
          </div>
          <Field label="외모 묘사">
            <Textarea rows={3} value={form.appearance} onChange={(e) => set('appearance', e.target.value)} />
          </Field>
        </section>

        {/* 내적 요소 */}
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            내적 요소
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="장점">
              <Textarea rows={2} value={form.strengths} onChange={(e) => set('strengths', e.target.value)} />
            </Field>
            <Field label="단점">
              <Textarea rows={2} value={form.weaknesses} onChange={(e) => set('weaknesses', e.target.value)} />
            </Field>
          </div>
          <Field label="가치관">
            <Textarea rows={2} value={form.values_text} onChange={(e) => set('values_text', e.target.value)} />
          </Field>
          <Field label="트라우마">
            <Textarea rows={2} value={form.trauma} onChange={(e) => set('trauma', e.target.value)} />
          </Field>
          <Field label="결핍">
            <Textarea rows={2} value={form.lack} onChange={(e) => set('lack', e.target.value)} />
          </Field>
          <Field label="내재적 욕구 / 목적" hint="서사를 끌고 가는 핵심 동인">
            <Textarea rows={2} value={form.desire} onChange={(e) => set('desire', e.target.value)} />
          </Field>
          <Field label="시그니처 대사">
            <Textarea rows={2} value={form.signature_line} onChange={(e) => set('signature_line', e.target.value)} />
          </Field>
        </section>
      </div>

      <footer className="border-t border-line px-5 py-3">
        <Button variant="danger" size="sm" onClick={onDelete}>
          <TrashIcon /> 인물 삭제
        </Button>
      </footer>
    </aside>
  )
}
