import { useProject } from '@/features/projects/ProjectProvider'
import { useEpisodes } from '@/features/timeline/useEpisodes'
import { EpisodeDigestRow } from './EpisodeDigestRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/icons'

/** 회차정리 — 회차별 핵심 전개를 스크롤형 타임라인으로 한눈에 */
export function EpisodeDigestPage() {
  const { project } = useProject()
  const { list, create, update } = useEpisodes(project.id)
  const episodes = list.data ?? []

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="회차정리"
        description="회차별 핵심 전개를 한 줄기로"
        actions={
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            <PlusIcon /> 새 회차
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
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
    </div>
  )
}
