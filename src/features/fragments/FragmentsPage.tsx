import { useEffect, useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useFragments } from './useFragments'
import { FragmentCard } from './FragmentCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/icons'

/** 장면 조각 — 보고 싶은 장면을 조각글로 적어 사건으로 디벨롭 */
export function FragmentsPage() {
  const { project } = useProject()
  const { list, create, update, remove } = useFragments(project.id)
  const fragments = list.data ?? []

  // 일괄 접기/펼치기 신호 (Ctrl+] 모두 접기 / Ctrl+[ 모두 펼치기)
  const [bulk, setBulk] = useState({ collapsed: false, seq: 0 })
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === ']') {
        e.preventDefault()
        setBulk((b) => ({ collapsed: true, seq: b.seq + 1 }))
      } else if (e.key === '[') {
        e.preventDefault()
        setBulk((b) => ({ collapsed: false, seq: b.seq + 1 }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="장면 조각"
        actions={
          <Button size="sm" onClick={() => create.mutate('yellow')} disabled={create.isPending}>
            <PlusIcon /> 조각 추가
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {list.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : fragments.length === 0 ? (
          <EmptyState
            title="아직 조각글이 없습니다"
            hint="떠오르는 장면·대사·상황을 부담 없이 적어두면, 나중에 사건으로 발전시키기 좋아요."
            action={
              <Button size="sm" onClick={() => create.mutate('yellow')}>
                <PlusIcon /> 조각 추가
              </Button>
            }
          />
        ) : (
          <div className="mx-auto max-w-5xl [column-fill:_balance] gap-4 [column-gap:1rem] sm:columns-2 lg:columns-3">
            {fragments.map((f) => (
              <div key={f.id} className="mb-4">
                <FragmentCard
                  fragment={f}
                  bulk={bulk}
                  onChange={(patch) => update.mutate({ id: f.id, patch })}
                  onDelete={() => remove.mutate(f.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
