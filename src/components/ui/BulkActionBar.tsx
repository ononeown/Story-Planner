import { Button } from './Button'
import { TrashIcon } from './icons'

interface Props {
  count: number
  noun: string
  onDelete: () => void
  onClear: () => void
}

/** 다중 선택 시 떠오르는 일괄 작업 바 */
export function BulkActionBar({ count, noun, onDelete, onClear }: Props) {
  if (count === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-canvas/90 py-2 pl-4 pr-2 shadow-lg shadow-black/15 backdrop-blur-xl">
        <span className="text-[13px] text-ink">
          {count}개 {noun} 선택됨
        </span>
        <button
          onClick={onClear}
          className="text-[13px] text-ink-muted transition-colors hover:text-ink"
        >
          선택 해제
        </button>
        <Button size="sm" variant="danger" onClick={onDelete}>
          <TrashIcon /> 삭제
        </Button>
      </div>
    </div>
  )
}
