import { useEffect, useState } from 'react'

// Ctrl/Shift/Meta 가 눌려있는지 전역 추적 (리스너는 모듈당 1회만)
let held = false
const subs = new Set<(v: boolean) => void>()

function set(v: boolean) {
  if (v === held) return
  held = v
  subs.forEach((s) => s(v))
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) set(true)
  })
  window.addEventListener('keyup', (e) => set(e.ctrlKey || e.metaKey || e.shiftKey))
  window.addEventListener('blur', () => set(false))
}

/** Ctrl/Shift/Meta 중 하나라도 눌려있으면 true */
export function useModifierHeld(): boolean {
  const [v, setV] = useState(held)
  useEffect(() => {
    subs.add(setV)
    return () => {
      subs.delete(setV)
    }
  }, [])
  return v
}
