import { useEffect, useState } from 'react'
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
import { useCharacters } from '@/features/characters/useCharacters'
import { useEpisodes } from './useEpisodes'
import { useScenes } from './useScenes'
import { useForeshadowings } from './useForeshadowings'
import { EpisodeMeta } from './EpisodeMeta'
import { SceneCard } from './SceneCard'
import { ForeshadowRow } from './ForeshadowRow'
import { TrackerView } from './TrackerView'
import { SortableEpisodeItem } from './SortableEpisodeItem'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Segmented } from '@/components/ui/Segmented'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { PlusIcon } from '@/components/ui/icons'
import { useBoxSelection } from '@/lib/useBoxSelection'

type View = 'design' | 'tracker'

export function TimelinePage() {
  const { project } = useProject()
  const episodes = useEpisodes(project.id)
  const scenes = useScenes(project.id)
  const characters = useCharacters(project.id)
  const foreshadowings = useForeshadowings(project.id)

  const [view, setView] = useState<View>('design')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const episodeList = episodes.list.data ?? []
  const sel = useBoxSelection(episodeList.map((e) => e.id))

  useEffect(() => {
    if (episodeList.length === 0) setSelectedId(null)
    else if (!episodeList.some((e) => e.id === selectedId)) setSelectedId(episodeList[0].id)
  }, [episodeList, selectedId])

  function deleteBulk() {
    const ids = [...sel.selected]
    if (ids.length === 0) return
    if (!confirm(`선택한 회차 ${ids.length}개를 삭제할까요? 각 회차의 씬·복선도 함께 삭제되며 되돌릴 수 없습니다.`))
      return
    episodes.removeMany.mutate(ids)
    sel.clear()
  }

  function handleEpisodeDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = episodeList.map((ep) => ep.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    episodes.reorder.mutate(arrayMove(ids, from, to))
  }

  const selected = episodeList.find((e) => e.id === selectedId) ?? null
  const sceneData = scenes.query.data
  const episodeScenes = sceneData?.scenes.filter((s) => s.episode_id === selectedId) ?? []
  const episodeForeshadows =
    foreshadowings.list.data?.filter((f) => f.episode_id === selectedId) ?? []

  async function addEpisode() {
    const created = await episodes.create.mutateAsync()
    setSelectedId(created.id)
  }

  const header = (
    <PageHeader
      title="타임라인 & 씬 디자이너"
      description="회차별 전개와 사건·복선의 인과/지속 설계"
      actions={
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'design', label: '설계' },
            { value: 'tracker', label: '트래커' },
          ]}
        />
      }
    />
  )

  // ── 트래커 뷰 ──────────────────────────────────────────────
  if (view === 'tracker') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex-1 overflow-auto px-8 py-8">
          {scenes.query.isLoading || episodes.list.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <TrackerView
              episodes={episodeList}
              scenes={sceneData?.scenes ?? []}
              foreshadowings={foreshadowings.list.data ?? []}
            />
          )}
        </div>
      </div>
    )
  }

  // ── 설계 뷰 ────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="flex min-h-0 flex-1">
        {/* 좌측: 회차 리스트 */}
        <div className="flex w-56 shrink-0 flex-col border-r border-line">
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
            {episodes.list.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : episodeList.length === 0 ? (
              <p className="px-2 py-4 text-xs text-ink-faint">
                아직 회차가 없습니다. 위 + 로 추가하세요.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleEpisodeDragEnd}
              >
                <SortableContext
                  items={episodeList.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0.5">
                    {episodeList.map((e) => (
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

        {/* 우측: 선택 회차 + 씬 + 복선 */}
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
          {!selected ? (
            <EmptyState
              title="회차를 선택하거나 추가하세요"
              hint="좌측에서 회차를 만들면 해당 회차의 사건(씬)을 설계할 수 있습니다."
              action={
                <Button size="sm" onClick={addEpisode}>
                  <PlusIcon /> 새 회차
                </Button>
              }
            />
          ) : (
            <div className="mx-auto max-w-3xl space-y-8">
              <EpisodeMeta
                episode={selected}
                onChange={(patch) => episodes.update.mutate({ id: selected.id, patch })}
              />

              {/* 씬 디자이너 */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">사건(씬) 설계</h3>
                  <Button size="sm" variant="secondary" onClick={() => scenes.create.mutate(selected.id)}>
                    <PlusIcon /> 새 사건
                  </Button>
                </div>

                {scenes.query.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : episodeScenes.length === 0 ? (
                  <EmptyState
                    title="이 회차에 설계된 사건이 없습니다"
                    hint="‘새 사건’으로 사건 상세·인물·공간·목적·결과·지속·인과관계를 구조적으로 설계하세요."
                  />
                ) : (
                  <div className="space-y-4">
                    {episodeScenes.map((scene) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        characters={characters.list.data ?? []}
                        otherScenes={(sceneData?.scenes ?? []).filter((s) => s.id !== scene.id)}
                        episodes={episodeList}
                        relatedCharIds={sceneData?.charMap[scene.id] ?? []}
                        nextSceneIds={sceneData?.linkMap[scene.id] ?? []}
                        onChange={(patch) => scenes.update.mutate({ id: scene.id, patch })}
                        onToggleCharacter={(characterId, on) =>
                          scenes.toggleCharacter.mutate({ sceneId: scene.id, characterId, on })
                        }
                        onToggleLink={(nextSceneId, on) =>
                          scenes.toggleLink.mutate({ sceneId: scene.id, nextSceneId, on })
                        }
                        onDelete={() => scenes.remove.mutate(scene.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* 복선 */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">복선</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => foreshadowings.create.mutate(selected.id)}
                  >
                    <PlusIcon /> 복선 추가
                  </Button>
                </div>
                {episodeForeshadows.length === 0 ? (
                  <p className="text-[13px] text-ink-faint">
                    이 회차에 심은 복선이 없습니다. 회수 여부와 회수 회차를 함께 관리하세요.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {episodeForeshadows.map((f) => (
                      <ForeshadowRow
                        key={f.id}
                        foreshadow={f}
                        episodes={episodeList}
                        onChange={(patch) => foreshadowings.update.mutate({ id: f.id, patch })}
                        onDelete={() => foreshadowings.remove.mutate(f.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      <BulkActionBar
        count={sel.selected.size}
        noun="회차"
        onDelete={deleteBulk}
        onClear={sel.clear}
      />
    </div>
  )
}
