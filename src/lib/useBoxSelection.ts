import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'

export interface MarqueeRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * 범위 드래그(마퀴) + Shift 범위 + Ctrl/⌘ 토글 다중 선택.
 * - 항목 요소에는 data-select-id={id} 를 부여한다.
 * - 컨테이너(position:relative)에 ref 와 onPointerDown 을 연결하고 marqueeRect 로 오버레이를 그린다.
 */
export function useBoxSelection(orderedIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null)

  const orderRef = useRef(orderedIds)
  orderRef.current = orderedIds
  const anchorRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const startRef = useRef<{ x: number; y: number } | null>(null)
  const baseRef = useRef<Set<string>>(new Set())
  const moveRef = useRef<((e: globalThis.PointerEvent) => void) | null>(null)
  const upRef = useRef<(() => void) | null>(null)

  const clear = useCallback(() => setSelected(new Set()), [])
  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  /** 항목 클릭. multi(ctrl/shift) 제스처면 true 반환(호출측은 열기 동작 생략) */
  const handleClick = useCallback((id: string, e: MouseEvent): boolean => {
    const ids = orderRef.current
    if (e.shiftKey && anchorRef.current) {
      const a = ids.indexOf(anchorRef.current)
      const b = ids.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setSelected(new Set(ids.slice(lo, hi + 1)))
        return true
      }
    }
    if (e.metaKey || e.ctrlKey) {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      anchorRef.current = id
      return true
    }
    // 일반 클릭: 다중 선택 해제(열기 동작은 호출측)
    anchorRef.current = id
    setSelected(new Set())
    return false
  }, [])

  const onContainerPointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('[data-select-id]')) return // 항목 위에서 시작 → 드래그/클릭에 양보

    startRef.current = { x: e.clientX, y: e.clientY }
    const additive = e.metaKey || e.ctrlKey
    baseRef.current = additive ? new Set(selected) : new Set()
    if (!additive) setSelected(new Set())

    const onMove = (ev: globalThis.PointerEvent) => {
      const s = startRef.current
      const cont = containerRef.current
      if (!s || !cont) return
      const l = Math.min(s.x, ev.clientX)
      const t = Math.min(s.y, ev.clientY)
      const r = Math.max(s.x, ev.clientX)
      const b = Math.max(s.y, ev.clientY)

      const box = cont.getBoundingClientRect()
      setMarqueeRect({ left: l - box.left, top: t - box.top, width: r - l, height: b - t })

      const next = new Set(baseRef.current)
      cont.querySelectorAll('[data-select-id]').forEach((el) => {
        const er = el.getBoundingClientRect()
        const hit = !(er.right < l || er.left > r || er.bottom < t || er.top > b)
        if (hit) next.add(el.getAttribute('data-select-id')!)
      })
      setSelected(next)
    }
    const onUp = () => {
      startRef.current = null
      setMarqueeRect(null)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    moveRef.current = onMove
    upRef.current = onUp
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [selected])

  // 드래그 중 언마운트 안전 정리
  useEffect(() => {
    return () => {
      if (moveRef.current) window.removeEventListener('pointermove', moveRef.current)
      if (upRef.current) window.removeEventListener('pointerup', upRef.current)
    }
  }, [])

  return { selected, isSelected, clear, handleClick, containerRef, onContainerPointerDown, marqueeRect }
}
