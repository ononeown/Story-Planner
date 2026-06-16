import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}

/** 라벨 + 입력 + 보조 설명을 묶는 폼 행 */
export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-ink-muted"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}
