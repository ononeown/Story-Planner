import { useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  MarkerType,
  ConnectionMode,
  useNodesState,
  useInternalNode,
  type Node,
  type InternalNode,
  type NodeChange,
  type NodeProps,
  type Edge,
  type EdgeProps,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCharacters } from './useCharacters'
import { useCharacterRelations } from './useCharacterRelations'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { cn } from '@/lib/cn'

/* ── 인물 카드 노드 (Apple 스타일) ───────────────────────── */
function CharacterNode({ data, selected }: NodeProps) {
  const name = (data as { name: string }).name
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border bg-surface/90 px-3.5 py-2.5 shadow-sm shadow-black/10 backdrop-blur transition-all',
        selected ? 'border-accent/60 ring-2 ring-accent/30' : 'border-line',
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-ink-faint/50" />
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
        {(name || '?').charAt(0)}
      </span>
      <span className="text-sm font-medium text-ink">{name}</span>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-accent" />
    </div>
  )
}

/* ── 플로팅 엣지: 노드 테두리에서 서로 마주보는 가장 가까운 지점 연결 ── */
function nodeIntersection(a: InternalNode, b: InternalNode) {
  const aw = (a.measured.width ?? 0) / 2
  const ah = (a.measured.height ?? 0) / 2
  const ax = a.internals.positionAbsolute.x + aw
  const ay = a.internals.positionAbsolute.y + ah
  const bx = b.internals.positionAbsolute.x + (b.measured.width ?? 0) / 2
  const by = b.internals.positionAbsolute.y + (b.measured.height ?? 0) / 2
  const xx = (bx - ax) / (2 * aw || 1) - (by - ay) / (2 * ah || 1)
  const yy = (bx - ax) / (2 * aw || 1) + (by - ay) / (2 * ah || 1)
  const m = 1 / (Math.abs(xx) + Math.abs(yy) || 1)
  return { x: aw * (m * xx + m * yy) + ax, y: ah * (-m * xx + m * yy) + ay }
}

interface RelData {
  label: string
  dir: number // -1 | 0 | 1 (양방향이면 좌우로 분리)
  onChange: (v: string) => void
  onDelete: () => void
  [k: string]: unknown
}

function RelationEdge({ id, source, target, markerEnd, data, selected }: EdgeProps) {
  const d = data as RelData
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const [val, setVal] = useState(d.label ?? '')
  useEffect(() => setVal(d.label ?? ''), [d.label])
  const save = useDebouncedCallback((v: string) => d.onChange(v), 500)

  if (!sourceNode || !targetNode) return null
  const s = nodeIntersection(sourceNode, targetNode)
  const t = nodeIntersection(targetNode, sourceNode)
  const sourceX = s.x, sourceY = s.y, targetX = t.x, targetY = t.y

  const mx = (sourceX + targetX) / 2
  const my = (sourceY + targetY) / 2
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const len = Math.hypot(dx, dy) || 1
  const off = 38 * (d.dir ?? 0)
  const cx = mx + (-dy / len) * off
  const cy = my + (dx / len) * off
  const path =
    (d.dir ?? 0) === 0
      ? `M ${sourceX},${sourceY} L ${targetX},${targetY}`
      : `M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ stroke: selected ? 'var(--color-accent)' : 'var(--color-ink-faint)', strokeWidth: 1.5 }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan group absolute flex items-center"
          style={{ transform: `translate(-50%,-50%) translate(${cx}px,${cy}px)`, pointerEvents: 'all' }}
        >
          <input
            value={val}
            onChange={(e) => {
              setVal(e.target.value)
              save(e.target.value)
            }}
            placeholder="관계"
            className="w-24 rounded-full border border-line bg-canvas/90 px-2.5 py-1 text-center text-[11px] text-ink shadow-sm outline-none backdrop-blur placeholder:text-ink-faint focus:w-36 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />
          <button
            onClick={d.onDelete}
            className="ml-1 hidden h-5 w-5 items-center justify-center rounded-full bg-canvas text-ink-faint shadow-sm hover:text-danger group-hover:flex"
            aria-label="관계 삭제"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = { character: CharacterNode }
const edgeTypes = { relation: RelationEdge }

export function RelationshipMap({ workspaceId }: { workspaceId: string }) {
  const characters = useCharacters(workspaceId)
  const relations = useCharacterRelations(workspaceId)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])

  const chars = characters.list.data ?? []
  const rels = relations.list.data ?? []

  useEffect(() => {
    setNodes(
      chars.map((c, i) => ({
        id: c.id,
        type: 'character',
        position:
          c.pos_x || c.pos_y ? { x: c.pos_x, y: c.pos_y } : { x: (i % 5) * 220, y: Math.floor(i / 5) * 150 },
        data: { name: c.name || '이름 없는 인물' },
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters.list.data])

  // 양방향 여부 판정 → 좌우로 분리할 방향(dir) 부여
  const pairSet = new Set(rels.map((r) => `${r.from_character_id}|${r.to_character_id}`))
  const edges: Edge[] = rels.map((r) => {
    const reverse = pairSet.has(`${r.to_character_id}|${r.from_character_id}`)
    const dir = reverse ? (r.from_character_id < r.to_character_id ? 1 : -1) : 0
    return {
      id: r.id,
      source: r.from_character_id,
      target: r.to_character_id,
      type: 'relation',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-ink-faint)' },
      data: {
        label: r.label ?? '',
        dir,
        onChange: (v: string) => relations.update.mutate({ id: r.id, patch: { label: v } }),
        onDelete: () => relations.remove.mutate(r.id),
      } satisfies RelData,
    }
  })

  function handleNodesChange(changes: NodeChange[]) {
    onNodesChange(changes)
    for (const ch of changes) {
      if (ch.type === 'position' && ch.dragging === false && ch.position) {
        characters.update.mutate({ id: ch.id, patch: { pos_x: ch.position.x, pos_y: ch.position.y } })
      }
    }
  }

  function onConnect(c: Connection) {
    if (c.source && c.target && c.source !== c.target) {
      relations.create.mutate({ from: c.source, to: c.target })
    }
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        fitView
        className="bg-surface/20"
      >
        <Background gap={22} size={1.5} color="var(--color-line)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-canvas/70 px-3 py-1.5 text-[11px] text-ink-muted shadow-sm backdrop-blur">
        카드 아래 점 → 다른 카드로 드래그하면 관계 생성 · 화살표 위 칸에 내용 입력 (양방향 각각)
      </div>
    </div>
  )
}
