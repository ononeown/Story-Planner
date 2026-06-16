import { useEffect, useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useSynopsis } from './useSynopsis'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PageHeader } from '@/components/layout/PageHeader'
import { SaveStatus, type SaveState } from '@/components/ui/SaveStatus'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'

export function SynopsisPage() {
  const { project, updateProject } = useProject()
  const { query, update } = useSynopsis(project.id)

  // 메타데이터 (workspaces 행)
  const [meta, setMeta] = useState({
    title: project.title,
    genre: project.genre ?? '',
    expected_length: project.expected_length ?? '',
  })

  // 핵심 요약 (synopsis 행)
  const [logline, setLogline] = useState('')
  const [intention, setIntention] = useState('')
  const [status, setStatus] = useState<SaveState>('idle')

  useEffect(() => {
    if (query.data) {
      setLogline(query.data.logline ?? '')
      setIntention(query.data.intention ?? '')
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

  const saveSyn = useDebouncedCallback((patch: { logline?: string; intention?: string }) => {
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

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="시놉시스"
        description="작품의 거시적 정보와 핵심 요약"
        actions={<SaveStatus state={status} />}
      />

      {query.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-8 px-8 py-8">
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
                value={logline}
                onChange={(e) => {
                  setLogline(e.target.value)
                  saveSyn({ logline: e.target.value })
                }}
                placeholder="한 문장으로 이 이야기를 설명한다면?"
              />
            </Field>
            <Field label="기획 의도" hint="왜 이 이야기를 쓰는가">
              <Textarea
                rows={5}
                value={intention}
                onChange={(e) => {
                  setIntention(e.target.value)
                  saveSyn({ intention: e.target.value })
                }}
                placeholder="주제 의식, 차별점, 타깃 독자 …"
              />
            </Field>
          </section>
        </div>
      )}
    </div>
  )
}
