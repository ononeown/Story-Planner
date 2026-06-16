import { NavLink } from 'react-router-dom'
import { TABS } from '@/config/tabs'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProject } from '@/features/projects/ProjectProvider'

/** 좌측 세로 탭 내비게이션 (라인 중심 미니멀 UI) */
export function TabNav() {
  const { project } = useProject()
  const { user, signOut } = useAuth()

  return (
    <nav className="flex w-60 shrink-0 flex-col border-r border-line bg-surface/70 backdrop-blur-xl">
      <div className="px-4 py-5">
        <h1 className="text-sm font-semibold tracking-tight text-ink">
          Story Planner
        </h1>
        <p className="mt-1 truncate text-[13px] text-ink-muted" title={project.title}>
          {project.title}
        </p>
      </div>

      <ul className="flex-1 space-y-0.5 px-2">
        {TABS.map((tab) => (
          <li key={tab.path}>
            <NavLink
              to={tab.path}
              className={({ isActive }) =>
                [
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
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

      <div className="border-t border-line px-4 py-3">
        <p className="truncate text-xs text-ink-faint" title={user?.email ?? ''}>
          {user?.email}
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
        >
          로그아웃
        </button>
      </div>
    </nav>
  )
}
