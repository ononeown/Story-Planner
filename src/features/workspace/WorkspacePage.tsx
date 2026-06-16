import { useEffect, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useEpisodes } from '@/features/timeline/useEpisodes'
import { WorkspaceEditor } from './WorkspaceEditor'
import { ReferenceSidebar } from './ReferenceSidebar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export function WorkspacePage() {
  const { project } = useProject()
  const { list, create, update } = useEpisodes(project.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const episodes = list.data ?? []
  useEffect(() => {
    if (episodes.length === 0) setSelectedId(null)
    else if (!episodes.some((e) => e.id === selectedId)) setSelectedId(episodes[0].id)
  }, [episodes, selectedId])

  const selected = episodes.find((e) => e.id === selectedId) ?? null

  async function addEpisode() {
    const created = await create.mutateAsync()
    setSelectedId(created.id)
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
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {list.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <ul className="space-y-0.5">
              {episodes.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setSelectedId(e.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
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
                  </button>
                </li>
              ))}
            </ul>
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
    </div>
  )
}
