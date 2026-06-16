import { useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  type Node,
  type NodeChange,
  type NodeProps,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCharacters } from './useCharacters'
import { useCharacterRelations } from './useCharacterRelations'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

/** 인물 카드 노드 (연결 핸들 포함) */
function CharacterNode({ data }: NodeProps) {
  const name = (data as { name: string }).name
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-sm shadow-black/10">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-ink-faint" />
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold">
        {(name || '?').charAt(0)}
      </span>
      <span className="ml-2 align-middle">{name}</span>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-accent" />
    </div>
  )
}

const nodeTypes = { character: CharacterNode }

export function RelationshipMap({ workspaceId }: { workspaceId: string }) {
  const characters = useCharacters(workspaceId)
  const relations = useCharacterRelations(workspaceId)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [label, setLabel] = useState('')

  const chars = characters.list.data ?? []

  useEffect(() => {
    setNodes(
      chars.map((c, i) => ({
        id: c.id,
        type: 'character',
        position:
          c.pos_x || c.pos_y ? { x: c.pos_x, y: c.pos_y } : { x: (i % 5) * 200, y: Math.floor(i / 5) * 130 },
        data: { name: c.name || '이름 없는 인물' },
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters.list.data])

  const edges: Edge[] = (relations.list.data ?? []).map((r) => ({
    id: r.id,
    source: r.from_character_id,
    target: r.to_character_id,
    label: r.label || undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: 'var(--color-ink-faint)' },
    labelBgStyle: { fill: 'var(--color-canvas)' },
    labelStyle: { fill: 'var(--color-ink)', fontSize: 12 },
    selected: r.id === selected,
  }))

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

  const saveLabel = useDebouncedCallback((id: string, v: string) => {
    relations.update.mutate({ id, patch: { label: v } })
  })

  const selectedRel = relations.list.data?.find((r) => r.id === selected)

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onConnect={onConnect}
        onEdgeClick={(_, edge) => {
          setSelected(edge.id)
          const rel = relations.list.data?.find((r) => r.id === edge.id)
          setLabel(rel?.label ?? '')
        }}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        fitView
        className="bg-surface/30"
      >
        <Background gap={20} color="var(--color-line)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* 안내 */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-canvas/80 px-2.5 py-1 text-[11px] text-ink-muted backdrop-blur">
        카드 아래 점에서 다른 카드로 드래그하면 관계가 생깁니다 · 화살표 클릭 → 내용 입력
      </div>

      {/* 선택된 관계 내용 편집 */}
      {selectedRel && (
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 shadow-lg shadow-black/15">
          <Input
            autoFocus
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              saveLabel(selectedRel.id, e.target.value)
            }}
            placeholder="관계 내용 (예: 우호 / 적대 / 동맹)"
            className="h-8 w-56"
          />
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              relations.remove.mutate(selectedRel.id)
              setSelected(null)
            }}
          >
            삭제
          </Button>
          <button
            onClick={() => setSelected(null)}
            className="text-[13px] text-ink-muted hover:text-ink"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
