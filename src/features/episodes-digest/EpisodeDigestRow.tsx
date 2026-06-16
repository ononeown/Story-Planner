import { useEffect, useState } from 'react'
import type { Episode } from '@/types/database'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface Props {
  episode: Episode
  isLast: boolean
  onChange: (patch: Partial<Episode>) => void
}

/** 회차정리 타임라인의 한 행: 좌측 회차 마커 + 우측 제목/핵심 전개 */
export function EpisodeDigestRow({ episode, isLast, onChange }: Props) {
  const [title, setTitle] = useState(episode.title ?? '')
  const [summary, setSummary] = useState(episode.summary ?? '')

  useEffect(() => {
    setTitle(episode.title ?? '')
    setSummary(episode.summary ?? '')
  }, [episode.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useDebouncedCallback((patch: Partial<Episode>) => onChange(patch))

  return (
    <div className="flex gap-4">
      {/* 좌측 레일: 회차 번호 + 연결선 */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-[13px] font-semibold tabular-nums text-ink">
          {episode.episode_no}
        </span>
        {!isLast && <span className="w-px flex-1 bg-line" />}
      </div>

      {/* 우측 내용 */}
      <div className="flex-1 pb-6">
        <Input
          value={title}
          placeholder={`${episode.episode_no}화 제목`}
          onChange={(e) => {
            setTitle(e.target.value)
            save({ title: e.target.value })
          }}
          className="h-9 border-0 bg-transparent px-0 text-[15px] font-semibold focus:ring-0"
        />
        <Textarea
          rows={2}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value)
            save({ summary: e.target.value })
          }}
          placeholder="이 회차의 핵심 전개를 한두 줄로…"
          className="mt-1 bg-canvas"
        />
      </div>
    </div>
  )
}
