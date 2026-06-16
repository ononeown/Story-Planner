import { useEffect, useState } from 'react'
import type { CharacterArc, Episode } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { useCharacterArcs } from './useCharacterArcs'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'

type ArcKey = 'task' | 'goal' | 'emotion' | 'action' | 'result'
const FIELDS: { key: ArcKey; label: string }[] = [
  { key: 'task', label: '주어진 과제' },
  { key: 'goal', label: '목표' },
  { key: 'emotion', label: '생각·감정' },
  { key: 'action', label: '행동·해결방안' },
  { key: 'result', label: '생긴 변화' },
]

function ArcRow({
  episode,
  arc,
  onSave,
}: {
  episode: Episode
  arc?: CharacterArc
  onSave: (patch: Partial<CharacterArc>) => void
}) {
  const [form, setForm] = useState<Record<ArcKey, string>>({
    task: arc?.task ?? '',
    goal: arc?.goal ?? '',
    emotion: arc?.emotion ?? '',
    action: arc?.action ?? '',
    result: arc?.result ?? '',
  })

  useEffect(() => {
    setForm({
      task: arc?.task ?? '',
      goal: arc?.goal ?? '',
      emotion: arc?.emotion ?? '',
      action: arc?.action ?? '',
      result: arc?.result ?? '',
    })
  }, [episode.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((patch: Partial<CharacterArc>) => onSave(patch))

  return (
    <div className="rounded-lg border border-line bg-canvas p-3">
      <p className="mb-2 text-[13px] font-semibold text-ink">
        {episode.episode_no}화 {episode.title ? `· ${episode.title}` : ''}
      </p>
      <div className="space-y-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <p className="mb-0.5 text-[11px] text-ink-faint">{f.label}</p>
            <Textarea
              rows={1}
              value={form[f.key]}
              onChange={(e) => {
                const v = e.target.value
                setForm((s) => ({ ...s, [f.key]: v }))
                save({ [f.key]: v })
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 인물의 회차별 변화표 */
export function ArcMatrix({ characterId, episodes }: { characterId: string; episodes: Episode[] }) {
  const arcs = useCharacterArcs(characterId)

  if (episodes.length === 0) {
    return <p className="text-[13px] text-ink-faint">회차를 먼저 추가하면 회차별 변화를 기입할 수 있어요.</p>
  }
  if (arcs.list.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {episodes.map((e) => (
        <ArcRow
          key={e.id}
          episode={e}
          arc={arcs.list.data?.find((a) => a.episode_id === e.id)}
          onSave={(patch) => arcs.upsert.mutate({ episodeId: e.id, patch })}
        />
      ))}
    </div>
  )
}
