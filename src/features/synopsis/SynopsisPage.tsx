import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProject } from '@/features/projects/ProjectProvider'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PageHeader } from '@/components/layout/PageHeader'
import { SaveStatus, type SaveState } from '@/components/ui/SaveStatus'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'

interface SynForm {
  logline: string
  intention: string
  plot_intro: string
  plot_rising: string
  plot_crisis: string
  plot_climax: string
  plot_resolution: string
}

const EMPTY: SynForm = {
  logline: '',
  intention: '',
  plot_intro: '',
  plot_rising: '',
  plot_crisis: '',
  plot_climax: '',
  plot_resolution: '',
}

// 5단 플롯 카드 정의 (발단 → 전개 → 위기 → 절정 → 결말)
const PLOT_STAGES: { key: keyof SynForm; label: string; hint: string }[] = [
  { key: 'plot_intro', label: '발단', hint: '인물·배경 소개, 일상의 균형' },
  { key: 'plot_rising', label: '전개', hint: '사건의 시작, 갈등의 점화' },
  { key: 'plot_crisis', label: '위기', hint: '갈등 고조, 위기의 심화' },
  { key: 'plot_climax', label: '절정', hint: '갈등의 정점, 결정적 전환' },
  { key: 'plot_resolution', label: '결말', hint: '갈등 해소, 새로운 균형' },
]

export function SynopsisPage() {
  const { project, updateProject } = useProject()

  // 메타데이터 (workspaces 행)
  const [meta, setMeta] = useState({
    title: project.title,
    genre: project.genre ?? '',
    expected_length: project.expected_length ?? '',
  })

  // 시놉시스 본문 (synopsis 행)
  const [syn, setSyn] = useState<SynForm>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<SaveState>('idle')

  // 시놉시스 행 로드
  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('synopsis')
      .select('*')
      .eq('workspace_id', project.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (data) {
          setSyn({
            logline: data.logline ?? '',
            intention: data.intention ?? '',
            plot_intro: data.plot_intro ?? '',
            plot_rising: data.plot_rising ?? '',
            plot_crisis: data.plot_crisis ?? '',
            plot_climax: data.plot_climax ?? '',
            plot_resolution: data.plot_resolution ?? '',
          })
        } else {
          setSyn(EMPTY)
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [project.id])

  // 메타데이터 자동 저장
  const saveMeta = useDebouncedCallback(async (next: typeof meta) => {
    setStatus('saving')
    try {
      await updateProject(next)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  })

  // 시놉시스 자동 저장 (upsert: 행이 없으면 생성)
  const saveSyn = useDebouncedCallback(async (next: SynForm) => {
    setStatus('saving')
    const { error } = await supabase
      .from('synopsis')
      .upsert({ workspace_id: project.id, ...next })
    setStatus(error ? 'error' : 'saved')
  })

  function onMeta(key: keyof typeof meta, value: string) {
    const next = { ...meta, [key]: value }
    setMeta(next)
    saveMeta(next)
  }

  function onSyn(key: keyof SynForm, value: string) {
    const next = { ...syn, [key]: value }
    setSyn(next)
    saveSyn(next)
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="마스터 시놉시스"
        description="작품의 거시적 정보와 핵심 뼈대"
        actions={<SaveStatus state={status} />}
      />

      {loading ? (
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

          {/* 5단 플롯 */}
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
