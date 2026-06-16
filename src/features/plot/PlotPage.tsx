import { useEffect, useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useSynopsis } from '@/features/synopsis/useSynopsis'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PageHeader } from '@/components/layout/PageHeader'
import { SaveStatus, type SaveState } from '@/components/ui/SaveStatus'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import type { Synopsis } from '@/types/database'

type PlotKey = Extract<keyof Synopsis, `plot_${string}`>

// 5단 플롯 구조 (발단 → 전개 → 위기 → 절정 → 결말)
const STAGES: { key: PlotKey; label: string; hint: string }[] = [
  { key: 'plot_intro', label: '발단', hint: '인물·배경 소개, 일상의 균형' },
  { key: 'plot_rising', label: '전개', hint: '사건의 시작, 갈등의 점화' },
  { key: 'plot_crisis', label: '위기', hint: '갈등 고조, 위기의 심화' },
  { key: 'plot_climax', label: '절정', hint: '갈등의 정점, 결정적 전환' },
  { key: 'plot_resolution', label: '결말', hint: '갈등 해소, 새로운 균형' },
]

type PlotForm = Record<PlotKey, string>
const EMPTY: PlotForm = {
  plot_intro: '',
  plot_rising: '',
  plot_crisis: '',
  plot_climax: '',
  plot_resolution: '',
}

export function PlotPage() {
  const { project } = useProject()
  const { query, update } = useSynopsis(project.id)
  const [form, setForm] = useState<PlotForm>(EMPTY)
  const [status, setStatus] = useState<SaveState>('idle')

  useEffect(() => {
    if (query.data) {
      setForm({
        plot_intro: query.data.plot_intro ?? '',
        plot_rising: query.data.plot_rising ?? '',
        plot_crisis: query.data.plot_crisis ?? '',
        plot_climax: query.data.plot_climax ?? '',
        plot_resolution: query.data.plot_resolution ?? '',
      })
    }
  }, [query.data])

  const save = useDebouncedCallback((patch: Partial<PlotForm>) => {
    setStatus('saving')
    update.mutate(patch, {
      onSuccess: () => setStatus('saved'),
      onError: () => setStatus('error'),
    })
  })

  function set(key: PlotKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    save({ [key]: value })
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="플롯"
        description="발단 · 전개 · 위기 · 절정 · 결말 — 작품의 큰 골격"
        actions={<SaveStatus state={status} />}
      />

      {query.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto px-8 py-8">
          <div className="flex min-w-max gap-4">
            {STAGES.map((stage, i) => (
              <div
                key={stage.key}
                className="flex w-72 flex-col rounded-xl border border-line bg-surface p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/15 text-[11px] font-semibold text-accent">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-ink">{stage.label}</span>
                </div>
                <p className="mb-3 text-xs text-ink-faint">{stage.hint}</p>
                <Textarea
                  rows={14}
                  className="flex-1 bg-canvas"
                  value={form[stage.key]}
                  onChange={(e) => set(stage.key, e.target.value)}
                  placeholder={`${stage.label} 단계의 전개를 적어보세요`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
