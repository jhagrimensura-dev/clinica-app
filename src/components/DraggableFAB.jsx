import { useState, useEffect, useRef } from 'react'

export default function DraggableFAB({ children, storageKey, defaultRight = 24, defaultBottom = 24 }) {
  const getDefault = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey))
      if (saved && typeof saved.x === 'number') return saved
    } catch {}
    return {
      x: window.innerWidth - defaultRight - 40,
      y: window.innerHeight - defaultBottom - 40,
    }
  }

  const [pos, setPos] = useState(getDefault)
  const posRef = useRef(pos)
  const isDragging = useRef(false)
  const hasMoved = useRef(false)
  const startOffset = useRef({ x: 0, y: 0 })

  useEffect(() => { posRef.current = pos }, [pos])

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return
      e.preventDefault()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      hasMoved.current = true
      const newX = Math.max(0, Math.min(window.innerWidth - 40, clientX - startOffset.current.x))
      const newY = Math.max(0, Math.min(window.innerHeight - 40, clientY - startOffset.current.y))
      const next = { x: newX, y: newY }
      setPos(next)
      posRef.current = next
    }
    const onEnd = () => {
      if (!isDragging.current) return
      isDragging.current = false
      localStorage.setItem(storageKey, JSON.stringify(posRef.current))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchend', onEnd)
    }
  }, [storageKey])

  const onStart = (clientX, clientY) => {
    isDragging.current = true
    hasMoved.current = false
    startOffset.current = { x: clientX - posRef.current.x, y: clientY - posRef.current.y }
  }

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 50, touchAction: 'none', userSelect: 'none' }}
      onMouseDown={e => { e.preventDefault(); onStart(e.clientX, e.clientY) }}
      onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onClick={e => { if (hasMoved.current) { e.preventDefault(); e.stopPropagation() } }}
    >
      {children}
    </div>
  )
}
