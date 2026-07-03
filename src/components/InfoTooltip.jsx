import { useState, useRef } from 'react'

export default function InfoTooltip({ children }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      <button
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
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
            {children}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </span>
  )
}
