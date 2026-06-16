import type { Episode, Foreshadowing, Scene } from '@/types/database'
import { cn } from '@/lib/cn'

interface Props {
  episodes: Episode[]
  scenes: Scene[]
  foreshadowings: Foreshadowing[]
}

interface Item {
  id: string
  name: string
  start: number
  end: number
}

const ROW_H = 30 // 회차 한 칸 높이
const AXIS_W = 22 // 좌측 회차 번호 축
const LANE_W = 20 // 스트로크 레인 폭
const GROUP_GAP = 10 // 사건/복선 그룹 간격

/** 겹치지 않게 레인(열) 배정 — 구간 스케줄링. items[i] → lane index */
function packLanes(items: Item[]): { lanes: number[]; count: number } {
  const order = items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => a.it.start - b.it.start || a.it.end - b.it.end)
  const laneEnds: number[] = []
  const lanes = new Array<number>(items.length)
  for (const { it, i } of order) {
    let placed = laneEnds.findIndex((end) => end < it.start)
    if (placed === -1) {
      placed = laneEnds.length
      laneEnds.push(it.end)
    } else {
      laneEnds[placed] = it.end
    }
    lanes[i] = placed
  }
  return { lanes, count: laneEnds.length }
}

/**
 * 세로축 트래커. 회차는 위→아래, 사건·복선은 세로 스트로크.
 * 이름은 시작 지점에서 세로로 흐르고, 겹치는 항목은 다른 레인에 배치.
 */
export function TrackerView({ episodes, scenes, foreshadowings }: Props) {
  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no)
  const idx = new Map(sorted.map((e, i) => [e.id, i]))
  const n = sorted.length

  if (n === 0) {
    return <p className="px-1 py-4 text-xs text-ink-faint">회차가 없습니다.</p>
  }

  const events: Item[] = scenes
    .filter((s) => s.episode_id && idx.has(s.episode_id))
    .map((s) => {
      const start = idx.get(s.episode_id!)!
      const end = s.end_episode_id ? (idx.get(s.end_episode_id) ?? start) : start
      return { id: s.id, name: s.title || '사건', start, end: Math.max(start, end) }
    })

  const fores: (Item & { resolved: boolean })[] = foreshadowings
    .filter((f) => idx.has(f.episode_id))
    .map((f) => {
      const start = idx.get(f.episode_id)!
      const end =
        f.resolved && f.resolved_episode_id ? (idx.get(f.resolved_episode_id) ?? n - 1) : n - 1
      return { id: f.id, name: f.content || '복선', start, end: Math.max(start, end), resolved: f.resolved }
    })

  const evLanes = packLanes(events)
  const foLanes = packLanes(fores)

  const evBaseX = AXIS_W + 6
  const foBaseX = evBaseX + evLanes.count * LANE_W + (evLanes.count > 0 && foLanes.count > 0 ? GROUP_GAP : 0)
  const totalW = Math.max(foBaseX + foLanes.count * LANE_W + 6, AXIS_W + 40)
  const totalH = n * ROW_H

  function Stroke({
    item,
    laneX,
    kind,
  }: {
    item: Item
    laneX: number
    kind: 'event' | 'fore'
  }) {
    const top = item.start * ROW_H + 4
    const height = Math.max((item.end - item.start) * ROW_H + ROW_H - 8, 16)
    return (
      <div
        className="absolute flex overflow-hidden"
        style={{ left: laneX, top, height, width: LANE_W }}
        title={item.name}
      >
        <div
          className={cn(
            'h-full shrink-0',
            kind === 'event'
              ? 'border-l-2 border-accent'
              : 'border-l-2 border-dashed border-amber-500/70',
          )}
        />
        <span
          className={cn(
            'ml-0.5 overflow-hidden whitespace-nowrap text-[9px] leading-none',
            kind === 'event' ? 'text-ink' : 'text-ink-muted',
          )}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {item.name}
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <div className="relative" style={{ width: totalW, height: totalH }}>
        {/* 회차 가이드 라인 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW_H - 1}px, var(--color-line) ${ROW_H - 1}px, var(--color-line) ${ROW_H}px)`,
          }}
        />

        {/* 좌측 회차 번호 축 */}
        {sorted.map((ep, i) => (
          <div
            key={ep.id}
            className="absolute flex items-center justify-center text-[10px] tabular-nums text-ink-faint"
            style={{ top: i * ROW_H, left: 0, height: ROW_H, width: AXIS_W }}
          >
            {ep.episode_no}
          </div>
        ))}

        {/* 사건 스트로크 */}
        {events.map((it, i) => (
          <Stroke key={it.id} item={it} kind="event" laneX={evBaseX + evLanes.lanes[i] * LANE_W} />
        ))}

        {/* 복선 스트로크 */}
        {fores.map((it, i) => (
          <Stroke key={it.id} item={it} kind="fore" laneX={foBaseX + foLanes.lanes[i] * LANE_W} />
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-3 flex items-center gap-4 px-1 text-[10px] text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0 border-l-2 border-accent" /> 사건
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0 border-l-2 border-dashed border-amber-500/70" /> 복선
        </span>
      </div>
    </div>
  )
}
