import { Outlet } from 'react-router-dom'
import { TabNav } from './TabNav'

/** 앱 전역 셸: 좌측 탭 내비 + 우측 콘텐츠 영역 */
export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink">
      <TabNav />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
