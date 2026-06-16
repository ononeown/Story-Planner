import { NavLink } from 'react-router-dom'
import { TABS } from '@/config/tabs'

/** 좌측 세로 탭 내비게이션 (라인 중심 미니멀 UI) */
export function TabNav() {
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-4 py-5">
        <h1 className="text-sm font-semibold tracking-tight text-ink">
          Story Planner
        </h1>
        <p className="mt-0.5 text-[11px] text-ink-muted">작가 전용 스토리 빌딩</p>
      </div>

      <ul className="flex-1 space-y-0.5 px-2">
        {TABS.map((tab) => (
          <li key={tab.path}>
            <NavLink
              to={tab.path}
              className={({ isActive }) =>
                [
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-muted hover:bg-surface-2/60 hover:text-ink',
                ].join(' ')
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-t border-line px-4 py-3 text-[11px] text-ink-muted">
        v0.1 · 뼈대
      </div>
    </nav>
  )
}
