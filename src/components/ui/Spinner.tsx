import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-5 w-5 animate-spin rounded-full border-2 border-ink-faint/40 border-t-ink',
        className,
      )}
      role="status"
      aria-label="로딩 중"
    />
  )
}

/** 화면 전체 중앙 로딩 (스플래시) */
export function FullScreenSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-canvas">
      <Spinner className="h-6 w-6" />
      {label && <p className="text-sm text-ink-muted">{label}</p>}
    </div>
  )
}
