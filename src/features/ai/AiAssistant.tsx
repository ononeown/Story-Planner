import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { askGemini, isGeminiConfigured } from '@/lib/gemini'
import { useProject } from '@/features/projects/ProjectProvider'
import { AI_ROLES, type AiRole } from './roles'
import { SparkleIcon, CloseIcon } from '@/components/ui/icons'
import { Spinner } from '@/components/ui/Spinner'

interface Menu {
  x: number
  y: number
  selection: string
}
interface Panel {
  role: AiRole
  status: 'loading' | 'done' | 'error'
  text: string
}

/**
 * 전역 AI 집필 보조.
 * 텍스트 선택 후 우클릭 → 역할 메뉴 → 우측 말풍선 응답.
 * (대강 버전 — 디자인은 추후 교체)
 */
export function AiAssistant() {
  const { project } = useProject()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [panel, setPanel] = useState<Panel | null>(null)
  const ctxCache = useRef<Record<string, string>>({})

  // 텍스트 선택 + 우클릭 → 메뉴
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      const sel = window.getSelection()?.toString().trim() ?? ''
      // 선택 텍스트가 있을 때만 가로채기 (없으면 기본 메뉴 허용)
      if (!sel) return
      e.preventDefault()
      setMenu({ x: e.clientX, y: e.clientY, selection: sel })
    }
    document.addEventListener('contextmenu', onContextMenu)
    return () => document.removeEventListener('contextmenu', onContextMenu)
  }, [])

  // 작품 설정 컨텍스트 (작품당 1회 조회 후 캐시)
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
    setPanel({ role, status: 'loading', text: '' })
    try {
      const ctx = role.needsContext ? await getContext() : ''
      const text = await askGemini(role.system, role.buildUser(selection, ctx), {
        model: role.model,
        temperature: role.temperature,
        maxOutputTokens: role.maxOutputTokens,
      })
      setPanel({ role, status: 'done', text })
    } catch (e) {
      setPanel({ role, status: 'error', text: e instanceof Error ? e.message : String(e) })
    }
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
            {!isGeminiConfigured && (
              <p className="px-3 py-1.5 text-[11px] text-danger">API 키 미설정</p>
            )}
          </div>
        </>
      )}

      {/* 우측 말풍선 응답 패널 */}
      {panel && (
        <div className="fixed right-4 top-20 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] gap-2">
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
            <p className="mb-2 text-[11px] font-semibold text-accent">{panel.role.label}</p>
            {panel.status === 'loading' ? (
              <div className="flex items-center gap-2 py-3 text-sm text-ink-muted">
                <Spinner className="h-4 w-4" /> 생각 중…
              </div>
            ) : (
              <>
                <div
                  className={
                    'max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed ' +
                    (panel.status === 'error' ? 'text-danger' : 'text-ink')
                  }
                >
                  {panel.text}
                </div>
                {panel.status === 'done' && (
                  <button
                    onClick={() => navigator.clipboard.writeText(panel.text)}
                    className="mt-3 text-[12px] text-ink-muted hover:text-ink"
                  >
                    복사
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
