import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function InfoTooltip({ children }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, above: true })
  const btnRef = useRef(null)

  useEffect(() => {
    if (!visible || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const above = r.top > 220
    setPos({
      top: above ? r.top + window.scrollY - 8 : r.bottom + window.scrollY + 8,
      left: r.left + r.width / 2 + window.scrollX,
      above,
    })
  }, [visible])

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-3.5 h-3.5 rounded-full bg-gray-200 hover:bg-brand-200 text-gray-500 hover:text-brand-600 flex items-center justify-center text-[9px] font-bold leading-none transition-colors flex-shrink-0 cursor-default"
        aria-label="Mais informações"
      >
        i
      </button>
      {visible && createPortal(
        <div
          className="fixed z-[9999] w-72 pointer-events-none"
          style={{
            top: pos.above ? undefined : pos.top,
            bottom: pos.above ? `calc(100vh - ${pos.top}px)` : undefined,
            left: pos.left,
            transform: 'translateX(-50%)',
          }}
        >
          {pos.above && <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto mt-1 mb-[-4px]" />}
          <div className="bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
            {children}
          </div>
          {!pos.above && <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />}
        </div>,
        document.body
      )}
    </span>
  )
}
