import { useEffect, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useProject } from '@/features/projects/ProjectProvider'
import { useEpisodes } from '@/features/timeline/useEpisodes'
import { SortableEpisodeItem } from '@/features/timeline/SortableEpisodeItem'
import { WorkspaceEditor } from './WorkspaceEditor'
import { ReferenceSidebar } from './ReferenceSidebar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { PlusIcon } from '@/components/ui/icons'
import { useBoxSelection } from '@/lib/useBoxSelection'

export function WorkspacePage() {
  const { project } = useProject()
  const { list, create, update, reorder, removeMany } = useEpisodes(project.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const episodes = list.data ?? []
  const sel = useBoxSelection(episodes.map((e) => e.id))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (episodes.length === 0) setSelectedId(null)
    else if (!episodes.some((e) => e.id === selectedId)) setSelectedId(episodes[0].id)
  }, [episodes, selectedId])

  const selected = episodes.find((e) => e.id === selectedId) ?? null

  async function addEpisode() {
    const created = await create.mutateAsync()
    setSelectedId(created.id)
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = episodes.map((ep) => ep.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    reorder.mutate(arrayMove(ids, from, to))
  }

  function deleteBulk() {
    const ids = [...sel.selected]
    if (ids.length === 0) return
    if (!confirm(`선택한 회차 ${ids.length}개를 삭제할까요? 본문·사건·복선도 함께 삭제되며 되돌릴 수 없습니다.`))
      return
    removeMany.mutate(ids)
    sel.clear()
  }

  return (
    <div className="flex h-full">
      {/* 좌: 회차 내비 */}
      <div className="flex w-52 shrink-0 flex-col border-r border-line">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[13px] font-semibold text-ink">회차</span>
          <button
            onClick={addEpisode}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="새 회차"
          >
            <PlusIcon />
          </button>
        </div>
        <div
          ref={sel.containerRef}
          onPointerDown={sel.onContainerPointerDown}
          className="relative flex-1 overflow-y-auto px-2 pb-3"
        >
          {list.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : episodes.length === 0 ? (
            <p className="px-2 py-4 text-xs text-ink-faint">아직 회차가 없습니다. 위 + 로 추가하세요.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={episodes.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {episodes.map((e) => (
                    <SortableEpisodeItem
                      key={e.id}
                      episode={e}
                      selected={selectedId === e.id}
                      multiSelected={sel.isSelected(e.id)}
                      onClick={(ev) => {
                        if (!sel.handleClick(e.id, ev)) setSelectedId(e.id)
                      }}
                      onActivate={() => setSelectedId(e.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          {sel.marqueeRect && (
            <div
              className="pointer-events-none absolute z-10 rounded-sm border border-accent/60 bg-accent/10"
              style={sel.marqueeRect}
            />
          )}
        </div>
      </div>

      {/* 중앙: 집필 에디터 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="워크스페이스"
          description={selected ? `${selected.episode_no}화 집필` : '집필 공간'}
          actions={
            <Button
              size="sm"
              variant={panelOpen ? 'secondary' : 'ghost'}
              onClick={() => setPanelOpen((v) => !v)}
            >
              참고 패널
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="px-8 py-8">
              <EmptyState
                title="집필할 회차를 선택하거나 추가하세요"
                hint="좌측에서 회차를 만들면 본문을 작성할 수 있습니다."
                action={
                  <Button size="sm" onClick={addEpisode}>
                    <PlusIcon /> 새 회차
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mx-auto max-w-2xl px-8 py-8">
              <input
                value={selected.title ?? ''}
                onChange={(e) => update.mutate({ id: selected.id, patch: { title: e.target.value } })}
                placeholder={`${selected.episode_no}화 제목`}
                className="mb-4 w-full bg-transparent text-2xl font-bold text-ink outline-none placeholder:text-ink-faint"
              />
              <WorkspaceEditor
                key={selected.id}
                episode={selected}
                onSave={(content: JSONContent) =>
                  update.mutate({ id: selected.id, patch: { content } })
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* 우: 참고 사이드바 */}
      {panelOpen && <ReferenceSidebar onClose={() => setPanelOpen(false)} />}

      <BulkActionBar count={sel.selected.size} noun="회차" onDelete={deleteBulk} onClear={sel.clear} />
    </div>
  )
}
