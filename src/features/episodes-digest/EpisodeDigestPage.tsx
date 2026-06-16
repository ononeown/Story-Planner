import { useProject } from '@/features/projects/ProjectProvider'
import { useEpisodes } from '@/features/timeline/useEpisodes'
import { useScenes } from '@/features/timeline/useScenes'
import { useForeshadowings } from '@/features/timeline/useForeshadowings'
import { TrackerView } from '@/features/timeline/TrackerView'
import { EpisodeDigestRow } from './EpisodeDigestRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/icons'

/** 회차정리 — 좌: 핵심 전개 타임라인 / 우: 사건·복선 트래커 */
export function EpisodeDigestPage() {
  const { project } = useProject()
  const { list, create, update } = useEpisodes(project.id)
  const scenes = useScenes(project.id)
  const foreshadowings = useForeshadowings(project.id)
  const episodes = list.data ?? []

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="회차정리"
        description="핵심 전개와 사건·복선 트래커"
        actions={
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            <PlusIcon /> 새 회차
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* 좌: 핵심 전개 타임라인 */}
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
          {list.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : episodes.length === 0 ? (
            <EmptyState
              title="정리할 회차가 없습니다"
              hint="회차를 추가하면 핵심 전개를 타임라인으로 정리할 수 있습니다."
              action={
                <Button size="sm" onClick={() => create.mutate()}>
                  <PlusIcon /> 새 회차
                </Button>
              }
            />
          ) : (
            <div className="mx-auto max-w-2xl">
              {episodes.map((ep, i) => (
                <EpisodeDigestRow
                  key={ep.id}
                  episode={ep}
                  isLast={i === episodes.length - 1}
                  onChange={(patch) => update.mutate({ id: ep.id, patch })}
                />
              ))}
            </div>
          )}
        </div>

        {/* 우: 트래커 */}
        <div className="w-[38%] min-w-[260px] max-w-md shrink-0 overflow-y-auto border-l border-line px-5 py-6">
          <h3 className="mb-3 text-[13px] font-semibold text-ink">트래커</h3>
          {scenes.query.isLoading || list.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <TrackerView
              episodes={episodes}
              scenes={scenes.query.data?.scenes ?? []}
              foreshadowings={foreshadowings.list.data ?? []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
