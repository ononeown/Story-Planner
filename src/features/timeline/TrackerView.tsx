import type { Episode, Foreshadowing, Scene } from '@/types/database'
import { cn } from '@/lib/cn'

interface Props {
  episodes: Episode[]
  scenes: Scene[]
  foreshadowings: Foreshadowing[]
}

interface Row {
  id: string
  name: string
  start: number // 0-based episode index
  end: number
  startNo: number
  endNo: number
  open?: boolean // 미회수 복선
}

/** 시작~종료 회차를 전체 길이에 대한 비율 막대로 */
function Track({ start, end, total, kind, open }: { start: number; end: number; total: number; kind: 'event' | 'fore'; open?: boolean }) {
  const left = total > 1 ? (start / total) * 100 : 0
  const width = total > 0 ? ((end - start + 1) / total) * 100 : 100
  return (
    <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2/70">
      <div
        className={cn(
          'absolute inset-y-0 rounded-full',
          kind === 'event' ? 'bg-accent' : open ? 'bg-amber-400/55' : 'bg-amber-400',
        )}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    </div>
  )
}

function rangeLabel(r: Row, kind: 'event' | 'fore'): string {
  if (r.startNo === r.endNo && !r.open) return `${r.startNo}화`
  if (r.open) return `${r.startNo}화~`
  return `${r.startNo}${kind === 'fore' ? '→' : '–'}${r.endNo}화`
}

export function TrackerView({ episodes, scenes, foreshadowings }: Props) {
  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no)
  const idx = new Map(sorted.map((e, i) => [e.id, i]))
  const noOf = (i: number) => sorted[i]?.episode_no ?? 0
  const n = sorted.length

  if (n === 0) {
    return <p className="px-1 py-4 text-xs text-ink-faint">회차가 없습니다.</p>
  }

  const events: Row[] = scenes
    .filter((s) => s.episode_id && idx.has(s.episode_id))
    .map((s) => {
      const start = idx.get(s.episode_id!)!
      const end = s.end_episode_id ? Math.max(start, idx.get(s.end_episode_id) ?? start) : start
      return { id: s.id, name: s.title || '사건', start, end, startNo: noOf(start), endNo: noOf(end) }
    })
    .sort((a, b) => a.start - b.start)

  const fores: Row[] = foreshadowings
    .filter((f) => idx.has(f.episode_id))
    .map((f) => {
      const start = idx.get(f.episode_id)!
      const resolvedIdx = f.resolved && f.resolved_episode_id ? idx.get(f.resolved_episode_id) : undefined
      const end = resolvedIdx != null ? Math.max(start, resolvedIdx) : n - 1
      return {
        id: f.id,
        name: f.content || '복선',
        start,
        end,
        startNo: noOf(start),
        endNo: noOf(end),
        open: !f.resolved,
      }
    })
    .sort((a, b) => a.start - b.start)

  return (
    <div className="space-y-5">
      <Group title="사건" count={events.length} kind="event" rows={events} total={n} />
      <Group title="복선" count={fores.length} kind="fore" rows={fores} total={n} />
    </div>
  )
}

function Group({
  title,
  count,
  kind,
  rows,
  total,
}: {
  title: string
  count: number
  kind: 'event' | 'fore'
  rows: Row[]
  total: number
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            kind === 'event' ? 'bg-accent' : 'bg-amber-400',
          )}
        />
        <h4 className="text-[12px] font-semibold text-ink">{title}</h4>
        <span className="text-[11px] text-ink-faint">{count}</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-1 text-[11px] text-ink-faint">없음</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface-2/50">
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-[13px] text-ink" title={r.name}>
                  {r.name}
                </span>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-ink-muted">
                  {rangeLabel(r, kind)}
                </span>
              </div>
              <Track start={r.start} end={r.end} total={total} kind={kind} open={r.open} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
