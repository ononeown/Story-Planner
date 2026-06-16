import type { Episode, Foreshadowing, Scene } from '@/types/database'
import { cn } from '@/lib/cn'

interface Props {
  episodes: Episode[]
  scenes: Scene[]
  foreshadowings: Foreshadowing[]
}

/**
 * 회차 축 간트 트래커 (간결 버전 — 회차정리 페이지에 통합).
 * - 사건(scene): 시작~종료 회차에 걸친 막대 (상위 위계)
 * - 복선(foreshadowing): 심은~회수 회차에 걸친 얇고 옅은 막대 (하위 위계, 미회수는 점선)
 */
export function TrackerView({ episodes, scenes, foreshadowings }: Props) {
  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no)
  const idx = new Map(sorted.map((e, i) => [e.id, i]))
  const n = sorted.length

  if (n === 0) {
    return <p className="px-1 py-4 text-xs text-ink-faint">회차가 없습니다.</p>
  }

  const gridStyle = { gridTemplateColumns: `repeat(${n}, minmax(28px, 1fr))` }

  function span(startIdx: number, endIdx: number) {
    const s = Math.max(0, Math.min(startIdx, n - 1))
    const e = Math.max(s, Math.min(endIdx, n - 1))
    return { gridColumnStart: 1 + s, gridColumnEnd: 2 + e }
  }

  const placedScenes = scenes.filter((s) => s.episode_id && idx.has(s.episode_id))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max space-y-3">
        {/* 헤더: 회차 번호 */}
        <div className="grid" style={gridStyle}>
          {sorted.map((ep) => (
            <div key={ep.id} className="text-center text-[10px] tabular-nums text-ink-faint">
              {ep.episode_no}
            </div>
          ))}
        </div>

        {/* 사건 */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
            사건
          </p>
          {placedScenes.length === 0 ? (
            <p className="text-[11px] text-ink-faint">없음</p>
          ) : (
            <div className="space-y-1">
              {placedScenes.map((s) => {
                const startIdx = idx.get(s.episode_id!)!
                const endIdx = s.end_episode_id ? (idx.get(s.end_episode_id) ?? startIdx) : startIdx
                return (
                  <div key={s.id} className="grid" style={gridStyle}>
                    <div
                      style={span(startIdx, endIdx)}
                      className="flex h-5 items-center overflow-hidden rounded bg-accent px-1.5"
                      title={s.title || '사건'}
                    >
                      <span className="truncate text-[10px] font-medium text-white">
                        {s.title || '사건'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 복선 */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
            복선
          </p>
          {foreshadowings.filter((f) => idx.has(f.episode_id)).length === 0 ? (
            <p className="text-[11px] text-ink-faint">없음</p>
          ) : (
            <div className="space-y-1">
              {foreshadowings
                .filter((f) => idx.has(f.episode_id))
                .map((f) => {
                  const startIdx = idx.get(f.episode_id)!
                  const endIdx =
                    f.resolved && f.resolved_episode_id
                      ? (idx.get(f.resolved_episode_id) ?? n - 1)
                      : n - 1
                  return (
                    <div key={f.id} className="grid" style={gridStyle}>
                      <div
                        style={span(startIdx, endIdx)}
                        className={cn(
                          'flex h-3.5 items-center overflow-hidden rounded px-1.5',
                          f.resolved
                            ? 'bg-amber-300/60'
                            : 'border border-dashed border-amber-400/60 bg-amber-200/20',
                        )}
                        title={f.content || '복선'}
                      >
                        <span className="truncate text-[9px] text-ink-muted">
                          {f.content || '복선'}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
