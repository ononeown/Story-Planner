import { useRef, useState, type ChangeEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { TABS } from '@/config/tabs'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProject } from '@/features/projects/ProjectProvider'
import { ProjectSwitcher } from '@/features/projects/ProjectSwitcher'
import { exportProject } from '@/features/export/exportProject'
import { importProject } from '@/features/export/importProject'
import { DownloadIcon, PlusIcon } from '@/components/ui/icons'
import { Spinner } from '@/components/ui/Spinner'

/** 좌측 세로 탭 내비게이션 (라인 중심 미니멀 UI) */
export function TabNav() {
  const { user, signOut } = useAuth()
  const { project, refresh, setProjectId } = useProject()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    try {
      await exportProject(project)
    } catch (e) {
      alert('내보내기에 실패했습니다: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setImporting(true)
    try {
      const newId = await importProject(file, user.id)
      await refresh()
      setProjectId(newId)
    } catch (err) {
      alert('가져오기에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <nav className="flex w-60 shrink-0 flex-col border-r border-line bg-surface/70 backdrop-blur-xl">
      <div className="px-4 py-5">
        <h1 className="px-1 text-sm font-semibold tracking-tight text-ink">
          Story Planner
        </h1>
        <div className="mt-1.5">
          <ProjectSwitcher />
        </div>
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
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          {exporting ? <Spinner className="h-3.5 w-3.5" /> : <DownloadIcon width={14} height={14} />}
          내보내기 (.zip)
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          {importing ? <Spinner className="h-3.5 w-3.5" /> : <PlusIcon width={14} height={14} />}
          가져오기 (새 작품)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleImport}
        />
        <p className="mt-2.5 truncate text-xs text-ink-faint" title={user?.email ?? ''}>
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
