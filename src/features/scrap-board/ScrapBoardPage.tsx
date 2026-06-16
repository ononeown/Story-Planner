import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  type Node,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { supabase } from '@/lib/supabase'
import { useProject } from '@/features/projects/ProjectProvider'
import { useScrapCards } from './useScrapCards'
import { PostitNode, type PostitData } from './PostitNode'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { PlusIcon, PinIcon, TrashIcon } from '@/components/ui/icons'
import type { ScrapCard } from '@/types/database'

const nodeTypes: NodeTypes = { postit: PostitNode }

function matches(card: ScrapCard, q: string): boolean {
  if (!q) return true
  const hay = [card.title, card.body, card.description, card.url].join(' ').toLowerCase()
  return hay.includes(q.toLowerCase())
}

export function ScrapBoardPage() {
  const { project } = useProject()
  const { list, create, update, remove } = useScrapCards(project.id)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [keyword, setKeyword] = useState('')
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; card: ScrapCard } | null>(null)

  const cards = useMemo(() => list.data ?? [], [list.data])

  // 카드/검색어 변경 시 노드 재구성
  useEffect(() => {
    setNodes(
      cards.map((card) => ({
        id: card.id,
        type: 'postit',
        position: { x: card.pos_x, y: card.pos_y },
        data: {
          card,
          dimmed: !matches(card, keyword),
          onChange: (patch: Partial<ScrapCard>) => update.mutate({ id: card.id, patch }),
          onDelete: () => remove.mutate(card.id),
        } satisfies PostitData,
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, keyword])

  function handleNodesChange(changes: NodeChange[]) {
    onNodesChange(changes)
    // 드래그 종료 시 위치 저장
    for (const ch of changes) {
      if (ch.type === 'position' && ch.dragging === false && ch.position) {
        update.mutate({ id: ch.id, patch: { pos_x: ch.position.x, pos_y: ch.position.y } })
      }
    }
  }

  function onNodeContextMenu(e: MouseEvent, node: Node) {
    e.preventDefault()
    const card = cards.find((c) => c.id === node.id)
    if (card) setMenu({ x: e.clientX, y: e.clientY, card })
  }

  function onNodesDelete(deleted: Node[]) {
    deleted.forEach((n) => remove.mutate(n.id))
  }

  function addMemo() {
    const n = cards.length
    create.mutate({
      kind: 'memo',
      color: 'yellow',
      pos_x: 80 + (n % 6) * 28,
      pos_y: 80 + (Math.floor(n / 6) % 6) * 28,
    })
  }

  async function scrapeUrl() {
    const target = url.trim()
    if (!target) return
    setScraping(true)
    const n = cards.length
    const pos = { pos_x: 80 + (n % 6) * 28, pos_y: 80 + (Math.floor(n / 6) % 6) * 28 }
    try {
      const { data, error } = await supabase.functions.invoke('og-scrape', {
        body: { url: target },
      })
      const og = !error && data ? (data as { title?: string; image?: string; description?: string }) : null
      create.mutate({
        kind: 'link',
        color: 'blue',
        url: target,
        title: og?.title ?? target,
        description: og?.description ?? null,
        image_url: og?.image ?? null,
        ...pos,
      })
    } catch {
      // Edge Function 미배포/실패 시: URL만으로 카드 생성
      create.mutate({ kind: 'link', color: 'blue', url: target, title: target, ...pos })
    } finally {
      setScraping(false)
      setUrl('')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="스크랩 보드"
        description="자료를 포스트잇처럼 자유롭게 배치"
        actions={
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색"
            className="h-9 w-56"
          />
        }
      />

      {/* 추가 툴바 */}
      <div className="flex items-center gap-2 border-b border-line px-8 py-2.5">
        <Button size="sm" onClick={addMemo}>
          <PlusIcon /> 메모
        </Button>
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && scrapeUrl()}
            placeholder="URL 붙여넣고 Enter"
            className="h-9 max-w-md"
          />
          <Button size="sm" variant="secondary" onClick={scrapeUrl} disabled={scraping || !url.trim()}>
            {scraping ? <Spinner className="h-4 w-4" /> : '스크랩'}
          </Button>
        </div>
      </div>

      {/* 캔버스 */}
      <div className="relative min-h-0 flex-1">
        {list.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            onNodesChange={handleNodesChange}
            onNodeContextMenu={onNodeContextMenu}
            onNodesDelete={onNodesDelete}
            deleteKeyCode={['Delete']}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={2}
            fitView={cards.length > 0}
            className="bg-surface/40"
          >
            <Background gap={20} color="var(--color-line)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}

        {/* 우클릭 컨텍스트 메뉴 */}
        {menu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault()
                setMenu(null)
              }}
            />
            <div
              className="fixed z-50 w-36 overflow-hidden rounded-lg border border-line bg-canvas py-1 shadow-lg shadow-black/20"
              style={{ left: menu.x, top: menu.y }}
            >
              <button
                onClick={() => {
                  update.mutate({ id: menu.card.id, patch: { pinned: !menu.card.pinned } })
                  setMenu(null)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-surface-2"
              >
                <PinIcon width={14} height={14} /> {menu.card.pinned ? '핀 해제' : '핀 고정'}
              </button>
              <button
                onClick={() => {
                  remove.mutate(menu.card.id)
                  setMenu(null)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-danger transition-colors hover:bg-danger/10"
              >
                <TrashIcon width={14} height={14} /> 삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
