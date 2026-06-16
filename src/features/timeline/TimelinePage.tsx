import { useEffect, useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useCharacters } from '@/features/characters/useCharacters'
import { useEpisodes } from './useEpisodes'
import { useScenes } from './useScenes'
import { EpisodeMeta } from './EpisodeMeta'
import { SceneCard } from './SceneCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon, TrashIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export function TimelinePage() {
  const { project } = useProject()
  const episodes = useEpisodes(project.id)
  const scenes = useScenes(project.id)
  const characters = useCharacters(project.id)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const episodeList = episodes.list.data ?? []
  // 선택된 회차 유지 (없으면 첫 회차)
  useEffect(() => {
    if (episodeList.length === 0) {
      setSelectedId(null)
    } else if (!episodeList.some((e) => e.id === selectedId)) {
      setSelectedId(episodeList[0].id)
    }
  }, [episodeList, selectedId])

  const selected = episodeList.find((e) => e.id === selectedId) ?? null
  const sceneData = scenes.query.data
  const episodeScenes =
    sceneData?.scenes.filter((s) => s.episode_id === selectedId) ?? []

  async function addEpisode() {
    const created = await episodes.create.mutateAsync()
    setSelectedId(created.id)
  }

  function deleteEpisode(id: string, no: number) {
    if (!confirm(`${no}화를 삭제할까요? 이 회차의 씬도 함께 삭제됩니다.`)) return
    episodes.remove.mutate(id)
  }

  return (
    <div className="flex h-full">
      {/* 좌측: 회차 리스트 */}
      <div className="flex w-56 shrink-0 flex-col border-r border-line">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[13px] font-semibold text-ink">회차</span>
          <button
            onClick={addEpisode}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="새 회차"
          >
            <PlusIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {episodes.list.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : episodeList.length === 0 ? (
            <p className="px-2 py-4 text-xs text-ink-faint">
              아직 회차가 없습니다. 위 + 로 추가하세요.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {episodeList.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setSelectedId(e.id)}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                      selectedId === e.id
                        ? 'bg-surface-2 text-ink'
                        : 'text-ink-muted hover:bg-surface-2/60 hover:text-ink',
                    )}
                  >
                    <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
                      {e.episode_no}
                    </span>
                    <span className="flex-1 truncate text-[13px]">
                      {e.title || '제목 없음'}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        deleteEpisode(e.id, e.episode_no)
                      }}
                      className="shrink-0 rounded p-0.5 text-ink-faint opacity-0 hover:text-danger group-hover:opacity-100"
                      aria-label="회차 삭제"
                    >
                      <TrashIcon width={13} height={13} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 우측: 선택 회차 + 씬 디자이너 */}
      <div className="flex h-full flex-1 flex-col">
        <PageHeader
          title="타임라인 & 씬 디자이너"
          description="회차별 전개와 사건의 인과관계 설계"
        />
        <div className="flex-1 overflow-y-auto px-8 py-8">
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
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => scenes.create.mutate(selected.id)}
                  >
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
                    hint="‘새 사건’으로 사건 상세·인물·공간·목적·결과·인과관계를 구조적으로 설계하세요."
                  />
                ) : (
                  <div className="space-y-4">
                    {episodeScenes.map((scene) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        characters={characters.list.data ?? []}
                        otherScenes={(sceneData?.scenes ?? []).filter((s) => s.id !== scene.id)}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
