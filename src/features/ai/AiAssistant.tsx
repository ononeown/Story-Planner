import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProject } from '@/features/projects/ProjectProvider'
import { AI_ROLES, type AiRole } from './roles'
import { SparkleIcon, CloseIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'

interface Menu {
  x: number
  y: number
  selection: string
}
interface Panel {
  role: AiRole
  message: string
  prompt: string
}

const GEMINI_URL = 'https://gemini.google.com/app'

/**
 * 전역 AI 집필 보조 (API 미사용 — 결제된 Gemini 웹 활용).
 * 텍스트 선택 후 우클릭 → 역할 선택 → 프롬프트 자동 조립+복사 + Gemini 탭 열기.
 * 사용자는 Gemini 입력창에서 Ctrl+V → Enter.
 */
export function AiAssistant() {
  const { project } = useProject()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [panel, setPanel] = useState<Panel | null>(null)
  const ctxCache = useRef<Record<string, string>>({})

  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      const sel = window.getSelection()?.toString().trim() ?? ''
      if (!sel) return
      e.preventDefault()
      setMenu({ x: e.clientX, y: e.clientY, selection: sel })
    }
    document.addEventListener('contextmenu', onContextMenu)
    return () => document.removeEventListener('contextmenu', onContextMenu)
  }, [])

  const getContext = useCallback(async (): Promise<string> => {
    if (ctxCache.current[project.id]) return ctxCache.current[project.id]
    const [syn, chars, eps] = await Promise.all([
      supabase.from('synopsis').select('*').eq('workspace_id', project.id).maybeSingle(),
      supabase.from('characters').select('name,desire,lack').eq('workspace_id', project.id).order('sort_order'),
      supabase.from('episodes').select('episode_no,title,summary').eq('workspace_id', project.id).order('episode_no'),
    ])
    const s = syn.data
    const lines: string[] = []
    lines.push(`작품명: ${project.title}`)
    if (project.genre) lines.push(`장르: ${project.genre}`)
    if (s?.logline) lines.push(`로그라인: ${s.logline}`)
    if (s?.intention) lines.push(`기획의도: ${s.intention}`)
    const plot = [s?.plot_intro, s?.plot_rising, s?.plot_crisis, s?.plot_climax, s?.plot_resolution]
      .filter(Boolean)
      .join(' / ')
    if (plot) lines.push(`플롯(발-전-위-절-결): ${plot}`)
    const cs = (chars.data ?? [])
      .map((c) => `- ${c.name || '무명'}${c.desire ? ` (욕구: ${c.desire})` : ''}`)
      .join('\n')
    if (cs) lines.push(`[인물]\n${cs}`)
    const es = (eps.data ?? [])
      .filter((e) => e.summary)
      .map((e) => `- ${e.episode_no}화 ${e.title ?? ''}: ${e.summary}`)
      .join('\n')
    if (es) lines.push(`[회차 요약]\n${es}`)
    const ctx = lines.join('\n')
    ctxCache.current[project.id] = ctx
    return ctx
  }, [project])

  async function run(role: AiRole) {
    if (!menu) return
    const selection = menu.selection
    setMenu(null)
    const ctx = role.needsContext ? await getContext() : ''
    const prompt = `${role.system}\n\n${role.buildUser(selection, ctx)}`
    await navigator.clipboard.writeText(prompt).catch(() => {})
    window.open(GEMINI_URL, '_blank', 'noopener')
    setPanel({
      role,
      prompt,
      message: '프롬프트를 복사했어요. 열린 Gemini 탭 입력창에서 Ctrl+V → Enter 하세요.',
    })
  }

  return (
    <>
      {/* 우클릭 역할 메뉴 */}
      {menu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null) }} />
          <div
            className="fixed z-[61] w-44 overflow-hidden rounded-lg border border-line bg-canvas py-1 shadow-lg shadow-black/20"
            style={{ left: menu.x, top: menu.y }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-ink-faint">
              <SparkleIcon width={13} height={13} /> AI 집필 보조
            </div>
            {AI_ROLES.map((role) => (
              <button
                key={role.key}
                onClick={() => run(role)}
                className="block w-full px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-surface-2"
              >
                {role.label}
                <span className="block text-[11px] text-ink-faint">{role.hint}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 우측 안내 말풍선 */}
      {panel && (
        <div className="fixed right-4 top-20 z-50 flex w-[340px] max-w-[calc(100vw-2rem)] gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <SparkleIcon width={16} height={16} />
          </div>
          <div className="relative flex-1 rounded-2xl rounded-tl-sm border border-line bg-canvas p-4 shadow-xl shadow-black/15">
            <button
              onClick={() => setPanel(null)}
              className="absolute right-2 top-2 rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label="닫기"
            >
              <CloseIcon width={14} height={14} />
            </button>
            <p className="mb-1 text-[11px] font-semibold text-accent">{panel.role.label}</p>
            <p className="text-[13px] leading-relaxed text-ink">{panel.message}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(panel.prompt)}>
                프롬프트 다시 복사
              </Button>
              <Button size="sm" onClick={() => window.open(GEMINI_URL, '_blank', 'noopener')}>
                Gemini 열기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
