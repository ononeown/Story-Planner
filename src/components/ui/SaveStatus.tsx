import { cn } from '@/lib/cn'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const label: Record<SaveState, string> = {
  idle: '',
  saving: '저장 중…',
  saved: '저장됨',
  error: '저장 실패',
}

/** 자동 저장 상태 인디케이터 */
export function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-[13px]',
        state === 'error' ? 'text-danger' : 'text-ink-muted',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          state === 'saving' && 'bg-ink-faint animate-pulse',
          state === 'saved' && 'bg-success',
          state === 'error' && 'bg-danger',
        )}
      />
      {label[state]}
    </span>
  )
}
