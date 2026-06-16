import { useEffect, useState } from 'react'
import type { Character, Episode, Scene } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Field } from '@/components/ui/Field'
import { TrashIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

interface Props {
  scene: Scene
  characters: Character[]
  otherScenes: Scene[]
  episodes: Episode[]
  relatedCharIds: string[]
  nextSceneIds: string[]
  onChange: (patch: Partial<Scene>) => void
  onToggleCharacter: (characterId: string, on: boolean) => void
  onToggleLink: (nextSceneId: string, on: boolean) => void
  onDelete: () => void
}

type TextKey = 'detail' | 'location' | 'purpose' | 'result'

export function SceneCard({
  scene,
  characters,
  otherScenes,
  episodes,
  relatedCharIds,
  nextSceneIds,
  onChange,
  onToggleCharacter,
  onToggleLink,
  onDelete,
}: Props) {
  // 지속 회차 후보: 시작 회차 이후(같거나 큰 번호)
  const startNo =
    episodes.find((e) => e.id === scene.episode_id)?.episode_no ?? 0
  const endOptions = episodes.filter((e) => e.episode_no >= startNo)
  const [title, setTitle] = useState(scene.title)
  const [text, setText] = useState<Record<TextKey, string>>({
    detail: scene.detail ?? '',
    location: scene.location ?? '',
    purpose: scene.purpose ?? '',
    result: scene.result ?? '',
  })

  useEffect(() => {
    setTitle(scene.title)
    setText({
      detail: scene.detail ?? '',
      location: scene.location ?? '',
      purpose: scene.purpose ?? '',
      result: scene.result ?? '',
    })
  }, [scene.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((patch: Partial<Scene>) => onChange(patch))

  function setField(key: TextKey, value: string) {
    setText((t) => ({ ...t, [key]: value }))
    save({ [key]: value })
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      {/* 제목 */}
      <div className="mb-3 flex items-center gap-2">
        <Input
          value={title}
          placeholder="사건 제목"
          onChange={(e) => {
            setTitle(e.target.value)
            save({ title: e.target.value })
          }}
          className="h-9 border-0 bg-transparent px-0 text-[15px] font-semibold focus:ring-0"
        />
        <button
          onClick={onDelete}
          className="shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-2 hover:text-danger"
          aria-label="사건 삭제"
        >
          <TrashIcon />
        </button>
      </div>

      {/* 지속 회차 (트래커에서 막대 길이로 표현) */}
      <div className="mb-3 flex items-center gap-2 text-[13px] text-ink-muted">
        <span>지속</span>
        <select
          value={scene.end_episode_id ?? ''}
          onChange={(e) => onChange({ end_episode_id: e.target.value || null })}
          className="h-8 rounded-md border border-line bg-canvas px-2 text-[13px] text-ink focus:outline-none"
          title="이 사건이 어느 회차까지 지속되는지"
        >
          <option value="">이 회차만 (단발성)</option>
          {endOptions.map((ep) => (
            <option key={ep.id} value={ep.id}>
              ~ {ep.episode_no}화까지
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <Field label="사건 상세">
          <Textarea
            rows={3}
            className="bg-canvas"
            value={text.detail}
            onChange={(e) => setField('detail', e.target.value)}
            placeholder="무슨 일이 벌어지는가"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="공간 배경">
            <Input
              value={text.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="어디에서"
            />
          </Field>
          <Field label="사건 목적">
            <Input
              value={text.purpose}
              onChange={(e) => setField('purpose', e.target.value)}
              placeholder="이 사건이 존재하는 이유"
            />
          </Field>
        </div>

        <Field label="사건의 결과">
          <Textarea
            rows={2}
            className="bg-canvas"
            value={text.result}
            onChange={(e) => setField('result', e.target.value)}
            placeholder="이 사건이 남기는 변화"
          />
        </Field>

        {/* 관련 인물 */}
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink-muted">관련 인물</p>
          {characters.length === 0 ? (
            <p className="text-xs text-ink-faint">인물 탭에서 캐릭터를 먼저 추가하세요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {characters.map((c) => {
                const on = relatedCharIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => onToggleCharacter(c.id, !on)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs transition-colors',
                      on
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line text-ink-muted hover:border-ink-faint/50',
                    )}
                  >
                    {c.name || '이름 없는 인물'}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 이어지는 사건 (인과관계) */}
        {otherScenes.length > 0 && (
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink-muted">
              이어지는 사건 <span className="text-ink-faint">(인과관계)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {otherScenes.map((s) => {
                const on = nextSceneIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => onToggleLink(s.id, !on)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs transition-colors',
                      on
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line text-ink-muted hover:border-ink-faint/50',
                    )}
                  >
                    {on ? '→ ' : ''}
                    {s.title || '제목 없는 사건'}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
