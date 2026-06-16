import { useState } from 'react'
import { useProject } from '@/features/projects/ProjectProvider'
import { useCharacters } from '@/features/characters/useCharacters'
import { useScrapCards } from '@/features/scrap-board/useScrapCards'
import { Segmented } from '@/components/ui/Segmented'
import { CloseIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

type Tab = 'characters' | 'scraps'

interface Props {
  onClose: () => void
}

/** 집필 중 캐릭터 설정·스크랩을 곁눈질로 호출하는 참고 패널 */
export function ReferenceSidebar({ onClose }: Props) {
  const { project } = useProject()
  const characters = useCharacters(project.id)
  const scraps = useScrapCards(project.id)
  const [tab, setTab] = useState<Tab>('characters')
  const [open, setOpen] = useState<string | null>(null)

  function toggle(id: string) {
    setOpen((cur) => (cur === id ? null : id))
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-line bg-surface/60 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'characters', label: '캐릭터' },
            { value: 'scraps', label: '스크랩' },
          ]}
        />
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
          aria-label="패널 닫기"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'characters' ? (
          (characters.list.data ?? []).length === 0 ? (
            <p className="px-1 py-2 text-xs text-ink-faint">등록된 인물이 없습니다.</p>
          ) : (
            <ul className="space-y-1.5">
              {(characters.list.data ?? []).map((c) => (
                <li key={c.id} className="rounded-lg border border-line bg-canvas">
                  <button
                    onClick={() => toggle(c.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
                      {(c.name || '?').charAt(0)}
                    </span>
                    <span className="flex-1 truncate text-[13px] font-medium text-ink">
                      {c.name || '이름 없는 인물'}
                    </span>
                  </button>
                  {open === c.id && (
                    <div className="space-y-1 border-t border-line px-3 py-2 text-xs text-ink-muted">
                      <Detail label="욕구/목적" value={c.desire} />
                      <Detail label="결핍" value={c.lack} />
                      <Detail label="가치관" value={c.values_text} />
                      <Detail label="시그니처 대사" value={c.signature_line} />
                      <Detail label="외모" value={c.appearance} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : (scraps.list.data ?? []).length === 0 ? (
          <p className="px-1 py-2 text-xs text-ink-faint">스크랩이 없습니다.</p>
        ) : (
          <ul className="space-y-1.5">
            {(scraps.list.data ?? []).map((s) => {
              const isOpen = open === s.id
              return (
                <li
                  key={s.id}
                  className={cn(
                    'rounded-lg border border-line p-3',
                    s.color === 'yellow' && 'bg-sticky-yellow',
                    s.color === 'pink' && 'bg-sticky-pink',
                    s.color === 'green' && 'bg-sticky-green',
                    s.color === 'blue' && 'bg-sticky-blue',
                    s.color === 'gray' && 'bg-sticky-gray',
                  )}
                >
                  <button onClick={() => toggle(s.id)} className="block w-full text-left">
                    <p className={cn('text-[13px] font-medium text-ink', !isOpen && 'truncate')}>
                      {s.title || (s.kind === 'memo' ? '메모' : '링크')}
                    </p>
                    {s.description && (
                      <p className={cn('mt-0.5 text-xs text-ink/70', !isOpen && 'line-clamp-2')}>
                        {s.description}
                      </p>
                    )}
                    {s.body && (
                      <p
                        className={cn(
                          'mt-0.5 whitespace-pre-wrap text-xs text-ink/70',
                          !isOpen && 'line-clamp-2',
                        )}
                      >
                        {s.body}
                      </p>
                    )}
                  </button>
                  {isOpen && s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-[11px] text-accent hover:underline"
                    >
                      {s.url}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null
  return (
    <p>
      <span className="text-ink-faint">{label}:</span> {value}
    </p>
  )
}
