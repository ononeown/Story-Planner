import { useEffect, useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useSynopsis } from './useSynopsis'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PageHeader } from '@/components/layout/PageHeader'
import { SaveStatus, type SaveState } from '@/components/ui/SaveStatus'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import type { Synopsis } from '@/types/database'

type SynKey =
  | 'logline' | 'intention'
  | 'plot_intro' | 'plot_rising' | 'plot_crisis' | 'plot_climax' | 'plot_resolution'

type SynForm = Record<SynKey, string>

const SYN_KEYS: SynKey[] = [
  'logline', 'intention',
  'plot_intro', 'plot_rising', 'plot_crisis', 'plot_climax', 'plot_resolution',
]

const EMPTY = Object.fromEntries(SYN_KEYS.map((k) => [k, ''])) as SynForm

// 5단 플롯 카드 (발단 → 전개 → 위기 → 절정 → 결말) — 큰 골격
const PLOT_STAGES: { key: SynKey; label: string; hint: string }[] = [
  { key: 'plot_intro', label: '발단', hint: '인물·배경 소개' },
  { key: 'plot_rising', label: '전개', hint: '갈등의 점화' },
  { key: 'plot_crisis', label: '위기', hint: '갈등의 심화' },
  { key: 'plot_climax', label: '절정', hint: '결정적 전환' },
  { key: 'plot_resolution', label: '결말', hint: '갈등 해소' },
]

export function SynopsisPage() {
  const { project, updateProject } = useProject()
  const { query, update } = useSynopsis(project.id)

  // 메타데이터 (workspaces 행)
  const [meta, setMeta] = useState({
    title: project.title,
    genre: project.genre ?? '',
    expected_length: project.expected_length ?? '',
  })

  // 시놉시스 행 (로그라인·기획의도·5단 플롯)
  const [syn, setSyn] = useState<SynForm>(EMPTY)
  const [status, setStatus] = useState<SaveState>('idle')

  useEffect(() => {
    if (query.data) {
      setSyn(
        SYN_KEYS.reduce((acc, k) => {
          acc[k] = (query.data?.[k as keyof Synopsis] as string | null) ?? ''
          return acc
        }, {} as SynForm),
      )
    }
  }, [query.data])

  const saveMeta = useDebouncedCallback(async (next: typeof meta) => {
    setStatus('saving')
    try {
      await updateProject(next)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  })

  const saveSyn = useDebouncedCallback((patch: Partial<SynForm>) => {
    setStatus('saving')
    update.mutate(patch, {
      onSuccess: () => setStatus('saved'),
      onError: () => setStatus('error'),
    })
  })

  function onMeta(key: keyof typeof meta, value: string) {
    const next = { ...meta, [key]: value }
    setMeta(next)
    saveMeta(next)
  }

  function onSyn(key: SynKey, value: string) {
    setSyn((s) => ({ ...s, [key]: value }))
    saveSyn({ [key]: value })
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="시놉시스"
        description="작품의 거시적 정보와 핵심 뼈대"
        actions={<SaveStatus state={status} />}
      />

      {query.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-4xl space-y-8 px-8 py-8">
          {/* 기본 메타데이터 */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="작품명">
              <Input
                value={meta.title}
                onChange={(e) => onMeta('title', e.target.value)}
                placeholder="제목 없는 작품"
              />
            </Field>
            <Field label="장르">
              <Input
                value={meta.genre}
                onChange={(e) => onMeta('genre', e.target.value)}
                placeholder="판타지, 로맨스 …"
              />
            </Field>
            <Field label="예상 분량">
              <Input
                value={meta.expected_length}
                onChange={(e) => onMeta('expected_length', e.target.value)}
                placeholder="예: 100화 / 장편"
              />
            </Field>
          </section>

          {/* 핵심 요약 */}
          <section className="space-y-4">
            <Field label="로그라인" hint="작품을 한 줄로 압축한 요약">
              <Textarea
                rows={2}
                value={syn.logline}
                onChange={(e) => onSyn('logline', e.target.value)}
                placeholder="한 문장으로 이 이야기를 설명한다면?"
              />
            </Field>
            <Field label="기획 의도" hint="왜 이 이야기를 쓰는가">
              <Textarea
                rows={4}
                value={syn.intention}
                onChange={(e) => onSyn('intention', e.target.value)}
                placeholder="주제 의식, 차별점, 타깃 독자 …"
              />
            </Field>
          </section>

          {/* 5단 플롯 (골격) */}
          <section>
            <h3 className="mb-3 text-[13px] font-medium text-ink-muted">5단 플롯 구조</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {PLOT_STAGES.map((stage, i) => (
                <Card key={stage.key} className="flex flex-col p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/15 text-[11px] font-semibold text-accent">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-ink">{stage.label}</span>
                  </div>
                  <Textarea
                    rows={6}
                    className="flex-1 border-0 bg-transparent px-0 py-0 focus:ring-0"
                    value={syn[stage.key]}
                    onChange={(e) => onSyn(stage.key, e.target.value)}
                    placeholder={stage.hint}
                  />
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
