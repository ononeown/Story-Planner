import { useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useWorldbuilding } from './useWorldbuilding'
import { WorldEntryCard } from './WorldEntryCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronIcon, PlusIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { WorldCategory } from '@/types/database'

// 기획서 §2 Tab3 — 카테고리별 권장 필드 (칩으로 빠르게 항목 생성)
const CATEGORIES: {
  key: WorldCategory
  label: string
  desc: string
  fields: string[]
}[] = [
  {
    key: 'spacetime',
    label: '시공간',
    desc: '주요 장소와 시대 배경',
    fields: ['주요 장소', '시대 / 연호'],
  },
  {
    key: 'society',
    label: '사회 · 인프라',
    desc: '세계를 움직이는 구조',
    fields: ['환경', '언어', '역사', '정치 체제', '경제 구조', '사회적 관습'],
  },
  {
    key: 'mind',
    label: '정신 · 제약',
    desc: '믿음과 금기',
    fields: ['종교', '신화', '규율', '금기(Taboo)'],
  },
]

export function WorldbuildingPage() {
  const { project } = useProject()
  const { list, create, update, remove } = useWorldbuilding(project.id)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const entries = list.data ?? []

  function toggle(key: string) {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }))
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="다차원 세계관 위키" description="배경 설정을 구조화해 보관" />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {list.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {CATEGORIES.map((cat) => {
              const items = entries.filter((e) => e.category === cat.key)
              const isOpen = !collapsed[cat.key]
              return (
                <section
                  key={cat.key}
                  className="overflow-hidden rounded-xl border border-line bg-surface"
                >
                  <button
                    onClick={() => toggle(cat.key)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2/40"
                  >
                    <ChevronIcon
                      className={cn(
                        'text-ink-muted transition-transform',
                        isOpen && 'rotate-90',
                      )}
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-ink">{cat.label}</h3>
                      <p className="text-xs text-ink-muted">{cat.desc}</p>
                    </div>
                    <span className="text-xs text-ink-faint">{items.length}</span>
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-line px-5 py-4">
                      {items.map((entry) => (
                        <WorldEntryCard
                          key={entry.id}
                          entry={entry}
                          onChange={(patch) => update.mutate({ id: entry.id, patch })}
                          onDelete={() => remove.mutate(entry.id)}
                        />
                      ))}

                      {/* 권장 필드 + 직접 추가 칩 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cat.fields.map((f) => (
                          <button
                            key={f}
                            onClick={() => create.mutate({ category: cat.key, title: f })}
                            className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
                          >
                            + {f}
                          </button>
                        ))}
                        <button
                          onClick={() => create.mutate({ category: cat.key })}
                          className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
                        >
                          <PlusIcon width={12} height={12} /> 직접 추가
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
