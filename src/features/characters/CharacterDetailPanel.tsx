import { useEffect, useState } from 'react'
import type { Character } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { useProject } from '@/features/projects/ProjectProvider'
import { useEpisodes } from '@/features/timeline/useEpisodes'
import { ArcMatrix } from './ArcMatrix'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { SaveStatus, type SaveState } from '@/components/ui/SaveStatus'
import { CloseIcon, TrashIcon } from '@/components/ui/icons'

type FormKey =
  | 'name' | 'age' | 'gender' | 'appearance'
  | 'strengths' | 'weaknesses' | 'values_text'
  | 'trauma' | 'lack' | 'desire' | 'signature_line'
  | 'constant_traits' | 'variable_traits'

type Form = Record<FormKey, string>

const FORM_KEYS: FormKey[] = [
  'name', 'age', 'gender', 'appearance',
  'strengths', 'weaknesses', 'values_text',
  'trauma', 'lack', 'desire', 'signature_line',
  'constant_traits', 'variable_traits',
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

type View = 'profile' | 'arc'

export function CharacterDetailPanel({ character, onChange, onClose, onDelete }: Props) {
  const { project } = useProject()
  const episodes = useEpisodes(project.id)
  const [form, setForm] = useState<Form>(() => toForm(character))
  const [status, setStatus] = useState<SaveState>('idle')
  const [view, setView] = useState<View>('profile')

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
    <aside className="flex h-full w-[400px] shrink-0 flex-col border-l border-line bg-surface/70 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'profile', label: '프로필' },
            { value: 'arc', label: '변화표' },
          ]}
        />
        <div className="flex items-center gap-2">
          <SaveStatus state={status} />
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {view === 'profile' ? (
          <>
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">외적 요소</h4>
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

            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">내적 요소</h4>
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
              <Field label="시그니처 대사">
                <Textarea rows={2} value={form.signature_line} onChange={(e) => set('signature_line', e.target.value)} />
              </Field>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">고정 축</h4>
              <Field label="목적 / 내재적 욕망" hint="서사를 끌고 가는 핵심 동인">
                <Textarea rows={2} value={form.desire} onChange={(e) => set('desire', e.target.value)} />
              </Field>
              <Field label="변하지 않는 부분">
                <Textarea rows={2} value={form.constant_traits} onChange={(e) => set('constant_traits', e.target.value)} />
              </Field>
              <Field label="스토리에 따라 변하는 부분">
                <Textarea rows={2} value={form.variable_traits} onChange={(e) => set('variable_traits', e.target.value)} />
              </Field>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">회차별 변화</h4>
              <ArcMatrix characterId={character.id} episodes={episodes.list.data ?? []} />
            </section>
          </>
        )}
      </div>

      <footer className="border-t border-line px-5 py-3">
        <Button variant="danger" size="sm" onClick={onDelete}>
          <TrashIcon /> 인물 삭제
        </Button>
      </footer>
    </aside>
  )
}
