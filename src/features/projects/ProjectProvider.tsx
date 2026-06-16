import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Workspace } from '@/types/database'

/**
 * "작품(Project)" = DB 의 workspaces 행. 앱의 최상위 데이터 컨테이너.
 * (Tab6 "워크스페이스(집필)" 탭과는 다른 개념 — 혼동 방지 위해 코드명은 Project)
 *
 * 로그인 직후 사용자의 첫 작품을 로드하고, 없으면 기본 작품을 자동 생성한다.
 */
interface ProjectValue {
  project: Workspace
  refresh: () => Promise<void>
  /** workspaces 행 일부를 갱신하고 로컬 상태도 즉시 반영 */
  updateProject: (patch: Partial<Workspace>) => Promise<void>
}

const ProjectContext = createContext<ProjectValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [project, setProject] = useState<Workspace | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setError(null)

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      setError(error.message)
      return
    }
    if (data && data.length > 0) {
      setProject(data[0] as Workspace)
      return
    }

    // 첫 작품 자동 생성
    const { data: created, error: createErr } = await supabase
      .from('workspaces')
      .insert({ user_id: user.id, title: '제목 없는 작품' })
      .select()
      .single()

    if (createErr) setError(createErr.message)
    else setProject(created as Workspace)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const updateProject = useCallback(
    async (patch: Partial<Workspace>) => {
      if (!project) return
      setProject((prev) => (prev ? { ...prev, ...patch } : prev))
      const { error } = await supabase
        .from('workspaces')
        .update(patch)
        .eq('id', project.id)
      if (error) setError(error.message)
    },
    [project],
  )

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas px-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
          작품을 불러오지 못했습니다: {error}
          <div className="mt-2 text-ink-muted">
            Supabase에 <code>schema.sql</code>을 실행했는지, RLS 정책이 적용됐는지 확인하세요.
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-muted">작품 불러오는 중…</p>
      </div>
    )
  }

  return (
    <ProjectContext.Provider value={{ project, refresh: load, updateProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject(): ProjectValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject 는 ProjectProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
