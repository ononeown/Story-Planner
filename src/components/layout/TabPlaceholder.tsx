interface TabPlaceholderProps {
  title: string
  description: string
  /** 이 탭에서 구현 예정인 핵심 기능 목록 */
  todo: string[]
}

/** 각 탭의 뼈대 화면. 실제 기능 구현 전, 무엇이 들어올지 보여주는 자리표시자. */
export function TabPlaceholder({ title, description, todo }: TabPlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>

      <div className="mt-6 rounded-lg border border-dashed border-line bg-surface/40 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          구현 예정 기능
        </p>
        <ul className="mt-3 space-y-1.5">
          {todo.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
