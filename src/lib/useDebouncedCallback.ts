import { useEffect, useMemo, useRef } from 'react'

/**
 * 디바운스된 콜백을 반환한다. 마지막 호출 이후 delay(ms) 동안
 * 추가 호출이 없으면 실제 콜백을 실행. (자동 저장 등에 사용)
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay = 600,
): (...args: A) => void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  return useMemo(() => {
    return (...args: A) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => cbRef.current(...args), delay)
    }
  }, [delay])
}
