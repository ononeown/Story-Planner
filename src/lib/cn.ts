/** 조건부 className 결합 헬퍼 (의존성 없이 경량) */
export type ClassValue = string | false | null | undefined

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
