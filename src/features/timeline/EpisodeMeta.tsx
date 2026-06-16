import { useEffect, useState } from 'react'
import type { Episode } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Field } from '@/components/ui/Field'

interface Props {
  episode: Episode
  onChange: (patch: Partial<Episode>) => void
}

/** 선택된 회차의 메타 편집 (제목 · 진행률 · 주요 사건 · 아이디어 메모) */
export function EpisodeMeta({ episode, onChange }: Props) {
  const [title, setTitle] = useState(episode.title ?? '')
  const [summary, setSummary] = useState(episode.summary ?? '')
  const [idea, setIdea] = useState(episode.idea_memo ?? '')
  const [progress, setProgress] = useState(episode.progress_percent)

  useEffect(() => {
    setTitle(episode.title ?? '')
    setSummary(episode.summary ?? '')
    setIdea(episode.idea_memo ?? '')
    setProgress(episode.progress_percent)
  }, [episode.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((patch: Partial<Episode>) => onChange(patch))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 shrink-0 items-center rounded-lg bg-surface-2 px-2.5 text-[13px] font-semibold text-ink">
          {episode.episode_no}화
        </span>
        <Input
          value={title}
          placeholder="회차 제목"
          onChange={(e) => {
            setTitle(e.target.value)
            save({ title: e.target.value })
          }}
          className="h-9 text-base font-semibold"
        />
      </div>

      {/* 진행률 */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[13px] font-medium text-ink-muted">서사 진행률</span>
          <span className="text-[13px] tabular-nums text-ink">{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => {
            const v = Number(e.target.value)
            setProgress(v)
            save({ progress_percent: v })
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="주요 사건">
          <Textarea
            rows={2}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value)
              save({ summary: e.target.value })
            }}
            placeholder="이 회차의 핵심 전개"
          />
        </Field>
        <Field label="아이디어 메모">
          <Textarea
            rows={2}
            value={idea}
            onChange={(e) => {
              setIdea(e.target.value)
              save({ idea_memo: e.target.value })
            }}
            placeholder="떠오른 생각, 복선 아이디어 …"
          />
        </Field>
      </div>
    </div>
  )
}
