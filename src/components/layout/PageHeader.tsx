import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  /** 우측 영역 (저장 상태, 액션 버튼 등) */
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/80 px-8 py-4 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}
