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
 * 사용자는 여러 작품을 두고 전환할 수 있다. (현재 작품 id 는 localStorage 에 보존)
 */
interface ProjectValue {
  projects: Workspace[]
  project: Workspace
  setProjectId: (id: string) => void
  createProject: () => Promise<Workspace>
  updateProject: (patch: Partial<Workspace>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const ProjectContext = createContext<ProjectValue | null>(null)
const STORAGE_KEY = 'story-planner:current-project'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Workspace[] | null>(null)
  const [currentId, setCurrentId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  )
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setError(null)

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    let list = (data ?? []) as Workspace[]

    // 작품이 하나도 없으면 기본 작품 자동 생성
    if (list.length === 0) {
      const { data: created, error: createErr } = await supabase
        .from('workspaces')
        .insert({ user_id: user.id, title: '제목 없는 작품' })
        .select()
        .single()
      if (createErr) {
        setError(createErr.message)
        return
      }
      list = [created as Workspace]
    }

    setProjects(list)
    setCurrentId((prev) => (prev && list.some((p) => p.id === prev) ? prev : list[0].id))
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const setProjectId = useCallback((id: string) => {
    setCurrentId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const createProject = useCallback(async () => {
    if (!user) throw new Error('로그인이 필요합니다.')
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ user_id: user.id, title: '제목 없는 작품' })
      .select()
      .single()
    if (error) throw error
    const created = data as Workspace
    setProjects((prev) => [...(prev ?? []), created])
    setProjectId(created.id)
    return created
  }, [user, setProjectId])

  const updateProject = useCallback(
    async (patch: Partial<Workspace>) => {
      if (!currentId) return
      setProjects((prev) =>
        prev?.map((p) => (p.id === currentId ? { ...p, ...patch } : p)) ?? prev,
      )
      const { error } = await supabase.from('workspaces').update(patch).eq('id', currentId)
      if (error) setError(error.message)
    },
    [currentId],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id)
      if (error) {
        setError(error.message)
        return
      }
      const remaining = (projects ?? []).filter((p) => p.id !== id)
      // 마지막 작품을 지우면 기본 작품을 다시 생성
      if (remaining.length === 0) {
        await load()
        return
      }
      setProjects(remaining)
      if (currentId === id) setProjectId(remaining[0].id)
    },
    [projects, currentId, load, setProjectId],
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

  const project = projects?.find((p) => p.id === currentId) ?? projects?.[0]

  if (!projects || !project) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-muted">작품 불러오는 중…</p>
      </div>
    )
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        project,
        setProjectId,
        createProject,
        updateProject,
        deleteProject,
        refresh: load,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject(): ProjectValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject 는 ProjectProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
