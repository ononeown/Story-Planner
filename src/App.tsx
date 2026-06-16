import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
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

export function App() {
  return <RouterProvider router={router} />
}
