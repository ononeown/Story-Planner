import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useProject } from '@/features/projects/ProjectProvider'
import { useCharacters } from './useCharacters'
import { useCharacterAppearances, tierOf } from './useCharacterAppearances'
import { SortableCharacterCard } from './SortableCharacterCard'
import { CharacterDetailPanel } from './CharacterDetailPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { PlusIcon } from '@/components/ui/icons'

export function CharactersPage() {
  const { project } = useProject()
  const { list, create, update, remove, removeMany, reorder } = useCharacters(project.id)
  const appearances = useCharacterAppearances(project.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bulk, setBulk] = useState<Set<string>>(new Set())

  const characters = list.data ?? []
  const selected = characters.find((c) => c.id === selectedId) ?? null

  function toggleBulk(id: string) {
    setBulk((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function deleteBulk() {
    const ids = [...bulk]
    if (ids.length === 0) return
    if (!confirm(`선택한 인물 ${ids.length}명을 삭제할까요? 되돌릴 수 없습니다.`)) return
    removeMany.mutate(ids)
    if (selectedId && bulk.has(selectedId)) setSelectedId(null)
    setBulk(new Set())
  }

  const counts = appearances.data ?? {}
  const maxCount = Math.max(0, ...Object.values(counts))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

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

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = characters.map((c) => c.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    reorder.mutate(arrayMove(ids, from, to))
  }

  function sortByAppearance() {
    const ordered = [...characters]
      .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.sort_order - b.sort_order)
      .map((c) => c.id)
    reorder.mutate(ordered)
  }

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col">
        <PageHeader
          title="캐릭터 데이터베이스"
          description="드래그로 순서 변경 · 등장 횟수로 위계 표시"
          actions={
            <>
              {characters.length > 1 && (
                <Button size="sm" variant="ghost" onClick={sortByAppearance}>
                  등장순 정렬
                </Button>
              )}
              <Button size="sm" onClick={handleCreate} disabled={create.isPending}>
                <PlusIcon /> 새 인물
              </Button>
            </>
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={characters.map((c) => c.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {characters.map((c) => (
                    <SortableCharacterCard
                      key={c.id}
                      character={c}
                      selected={selectedId === c.id}
                      bulkSelected={bulk.has(c.id)}
                      tier={tierOf(counts[c.id] ?? 0, maxCount)}
                      count={counts[c.id] ?? 0}
                      onSelect={() => setSelectedId(c.id)}
                      onToggleBulk={() => toggleBulk(c.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

      <BulkActionBar
        count={bulk.size}
        noun="인물"
        onDelete={deleteBulk}
        onClear={() => setBulk(new Set())}
      />
    </div>
  )
}
