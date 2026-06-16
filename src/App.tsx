import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
import { AuthPage } from '@/features/auth/AuthPage'
import { ProjectProvider, useProject } from '@/features/projects/ProjectProvider'
import { FullScreenSpinner } from '@/components/ui/Spinner'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AiAssistant } from '@/features/ai/AiAssistant'
import { SynopsisPage } from '@/features/synopsis/SynopsisPage'
import { ScrapBoardPage } from '@/features/scrap-board/ScrapBoardPage'
import { WorldbuildingPage } from '@/features/worldbuilding/WorldbuildingPage'
import { CharactersPage } from '@/features/characters/CharactersPage'
import { TimelinePage } from '@/features/timeline/TimelinePage'
import { EpisodeDigestPage } from '@/features/episodes-digest/EpisodeDigestPage'
import { FragmentsPage } from '@/features/fragments/FragmentsPage'
import { WorkspacePage } from '@/features/workspace/WorkspacePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/synopsis" replace /> },
      { path: 'synopsis', element: <SynopsisPage /> },
      { path: 'scrap-board', element: <ScrapBoardPage /> },
      { path: 'worldbuilding', element: <WorldbuildingPage /> },
      { path: 'characters', element: <CharactersPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'digest', element: <EpisodeDigestPage /> },
      { path: 'fragments', element: <FragmentsPage /> },
      { path: 'workspace', element: <WorkspacePage /> },
    ],
  },
])

/** 작품이 바뀌면 라우터를 remount 해 페이지 로컬 상태를 초기화 */
function AppRouter() {
  const { project } = useProject()
  return (
    <>
      <RouterProvider key={project.id} router={router} />
      <AiAssistant />
    </>
  )
}

/** 로그인 여부에 따라 앱 본체 또는 로그인 화면을 보여주는 게이트 */
function AuthGate() {
  const { session, loading } = useAuth()

  if (loading) return <FullScreenSpinner label="불러오는 중…" />
  if (!session) return <AuthPage />

  return (
    <ProjectProvider>
      <AppRouter />
    </ProjectProvider>
  )
}

/** Supabase 환경변수 미설정 시 흰 화면 대신 보여줄 안내 */
function SetupScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-lg space-y-4">
        <h1 className="text-xl font-semibold text-ink">설정이 필요합니다</h1>
        <p className="text-sm text-ink-muted">
          Supabase 자격증명이 없어 앱을 실행할 수 없습니다. 프로젝트 루트에{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-ink">.env.local</code>{' '}
          파일을 만들고 아래 값을 넣은 뒤 개발 서버를 재시작하세요.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line bg-surface p-4 text-[13px] text-ink">
{`VITE_SUPABASE_URL=https://<프로젝트>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public 키>`}
        </pre>
        <p className="text-xs text-ink-faint">
          값은 Supabase 대시보드 → Project Settings → API 에서 복사할 수 있습니다.
          (Vercel 배포에는 이미 환경변수가 설정돼 있어도, 로컬 개발에는 .env.local 이 따로 필요합니다)
        </p>
      </div>
    </div>
  )
}

export function App() {
  if (!isSupabaseConfigured) return <SetupScreen />

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
