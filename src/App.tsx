import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
import { AuthPage } from '@/features/auth/AuthPage'
import { ProjectProvider } from '@/features/projects/ProjectProvider'
import { FullScreenSpinner } from '@/components/ui/Spinner'
import { SynopsisPage } from '@/features/synopsis/SynopsisPage'
import { ScrapBoardPage } from '@/features/scrap-board/ScrapBoardPage'
import { WorldbuildingPage } from '@/features/worldbuilding/WorldbuildingPage'
import { CharactersPage } from '@/features/characters/CharactersPage'
import { TimelinePage } from '@/features/timeline/TimelinePage'
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
      { path: 'workspace', element: <WorkspacePage /> },
    ],
  },
])

/** 로그인 여부에 따라 앱 본체 또는 로그인 화면을 보여주는 게이트 */
function AuthGate() {
  const { session, loading } = useAuth()

  if (loading) return <FullScreenSpinner label="불러오는 중…" />
  if (!session) return <AuthPage />

  return (
    <ProjectProvider>
      <RouterProvider router={router} />
    </ProjectProvider>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
