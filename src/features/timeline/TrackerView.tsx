import type { Episode, Foreshadowing, Scene } from '@/types/database'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

interface Props {
  episodes: Episode[]
  scenes: Scene[]
  foreshadowings: Foreshadowing[]
}

/**
 * 회차 축 간트 트래커.
 * - 사건(scene): 시작~종료(end_episode) 회차에 걸친 굵은 막대 (상위 위계)
 * - 복선(foreshadowing): 심은~회수 회차에 걸친 얇고 옅은 막대 (하위 위계, 미회수는 점선)
 */
export function TrackerView({ episodes, scenes, foreshadowings }: Props) {
  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no)
  const idx = new Map(sorted.map((e, i) => [e.id, i]))
  const n = sorted.length

  if (n === 0) {
    return (
      <EmptyState
        title="트래커에 표시할 회차가 없습니다"
        hint="회차를 추가하고 사건·복선을 등록하면 회차 축으로 펼쳐집니다."
      />
    )
  }

  const gridStyle = { gridTemplateColumns: `180px repeat(${n}, minmax(56px, 1fr))` }

  // grid column: 1 = 라벨, 회차 i(0-based) → 2 + i
  function span(startIdx: number, endIdx: number) {
    const s = Math.max(0, Math.min(startIdx, n - 1))
    const e = Math.max(s, Math.min(endIdx, n - 1))
    return { gridColumnStart: 2 + s, gridColumnEnd: 3 + e }
  }

  const placedScenes = scenes.filter((s) => s.episode_id && idx.has(s.episode_id))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* 헤더: 회차 번호 */}
        <div className="grid items-center border-b border-line pb-2" style={gridStyle}>
          <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            회차 →
          </div>
          {sorted.map((ep) => (
            <div key={ep.id} className="text-center text-[11px] tabular-nums text-ink-muted">
              {ep.episode_no}
            </div>
          ))}
        </div>

        {/* 사건 (상위 위계) */}
        <div className="mt-3">
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            사건
          </p>
          {placedScenes.length === 0 ? (
            <p className="px-2 py-2 text-xs text-ink-faint">
              등록된 사건이 없습니다. ‘사건 설계’에서 추가하세요.
            </p>
          ) : (
            placedScenes.map((s) => {
              const startIdx = idx.get(s.episode_id!)!
              const endIdx = s.end_episode_id ? (idx.get(s.end_episode_id) ?? startIdx) : startIdx
              return (
                <div key={s.id} className="grid items-center py-1" style={gridStyle}>
                  <div className="truncate px-2 text-[13px] text-ink" title={s.title}>
                    {s.title || '제목 없는 사건'}
                  </div>
                  <div
                    style={span(startIdx, endIdx)}
                    className="flex h-7 items-center overflow-hidden rounded-md bg-accent px-2"
                  >
                    <span className="truncate text-[11px] font-medium text-white">
                      {s.title || '사건'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 복선 (하위 위계) */}
        <div className="mt-4">
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            복선
          </p>
          {foreshadowings.length === 0 ? (
            <p className="px-2 py-2 text-xs text-ink-faint">
              등록된 복선이 없습니다. 회차별 ‘복선’에서 추가하세요.
            </p>
          ) : (
            foreshadowings
              .filter((f) => f.episode_id && idx.has(f.episode_id))
              .map((f) => {
                const startIdx = idx.get(f.episode_id)!
                const endIdx =
                  f.resolved && f.resolved_episode_id
                    ? (idx.get(f.resolved_episode_id) ?? n - 1)
                    : n - 1
                return (
                  <div key={f.id} className="grid items-center py-1" style={gridStyle}>
                    <div
                      className="truncate px-2 text-xs text-ink-muted"
                      title={f.content}
                    >
                      {f.content || '내용 없는 복선'}
                    </div>
                    <div
                      style={span(startIdx, endIdx)}
                      className={cn(
                        'flex h-4 items-center overflow-hidden rounded px-2',
                        f.resolved
                          ? 'bg-amber-300/60'
                          : 'border border-dashed border-amber-400/60 bg-amber-200/20',
                      )}
                    >
                      <span className="truncate text-[10px] text-ink-muted">
                        {f.resolved ? '회수' : '미회수'}
                      </span>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
