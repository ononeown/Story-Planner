import { useState } from 'react'
import { useProject } from './ProjectProvider'
import { ChevronIcon, PlusIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

/** 작품 전환 드롭다운 (간단 버전) — 사이드바 상단 작품명 자리에 표시 */
export function ProjectSwitcher() {
  const { projects, project, setProjectId, createProject } = useProject()
  const [open, setOpen] = useState(false)

  async function handleCreate() {
    setOpen(false)
    await createProject()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-surface-2"
      >
        <span className="truncate text-[13px] text-ink-muted" title={project.title}>
          {project.title}
        </span>
        <ChevronIcon
          width={14}
          height={14}
          className={cn('shrink-0 text-ink-faint transition-transform', open && 'rotate-90')}
        />
      </button>

      {open && (
        <>
          {/* 바깥 클릭 닫기 */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-canvas py-1 shadow-lg shadow-black/10">
            <div className="max-h-64 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProjectId(p.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-2',
                    p.id === project.id ? 'text-ink' : 'text-ink-muted',
                  )}
                >
                  <span className="truncate">{p.title}</span>
                  {p.id === project.id && <span className="text-accent">✓</span>}
                </button>
              ))}
            </div>
            <div className="mt-1 border-t border-line pt-1">
              <button
                onClick={handleCreate}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[13px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <PlusIcon width={13} height={13} /> 새 작품
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
