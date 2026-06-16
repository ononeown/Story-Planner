import { useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useCharacters } from './useCharacters'
import { CharacterDetailPanel } from './CharacterDetailPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export function CharactersPage() {
  const { project } = useProject()
  const { list, create, update, remove } = useCharacters(project.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const characters = list.data ?? []
  const selected = characters.find((c) => c.id === selectedId) ?? null

  async function handleCreate() {
    const created = await create.mutateAsync()
    setSelectedId(created.id)
  }

  function handleDelete() {
    if (!selected) return
    if (!confirm(`'${selected.name || '이름 없는 인물'}'을(를) 삭제할까요?`)) return
    remove.mutate(selected.id)
    setSelectedId(null)
  }

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col">
        <PageHeader
          title="캐릭터 데이터베이스"
          description="인물 프로필 설정 및 서사 추적"
          actions={
            <Button size="sm" onClick={handleCreate} disabled={create.isPending}>
              <PlusIcon /> 새 인물
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto px-8 py-8">
          {list.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : characters.length === 0 ? (
            <EmptyState
              title="아직 등록된 인물이 없습니다"
              hint="첫 인물을 추가해 프로필을 작성해 보세요."
              action={
                <Button size="sm" onClick={handleCreate}>
                  <PlusIcon /> 새 인물
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'flex flex-col items-start gap-3 rounded-xl border bg-surface p-4 text-left transition-colors',
                    selectedId === c.id
                      ? 'border-accent/60 ring-1 ring-accent/40'
                      : 'border-line hover:border-ink-faint/50 hover:bg-surface-2/50',
                  )}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-base font-semibold text-ink">
                    {(c.name || '?').trim().charAt(0) || '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {c.name || '이름 없는 인물'}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {[c.age, c.gender].filter(Boolean).join(' · ') || '설정 미입력'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <CharacterDetailPanel
          character={selected}
          onChange={(patch) => update.mutate({ id: selected.id, patch })}
          onClose={() => setSelectedId(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
