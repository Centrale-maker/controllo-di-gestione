import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
  className?: string
  children?: React.ReactNode
}

export default function CellTooltip({ text, className = '', children }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const show = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (el.scrollWidth <= el.clientWidth) return // non troncato, non mostrare
    const r = el.getBoundingClientRect()
    setPos({ x: r.left, y: r.bottom + 6 })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  return (
    <div ref={ref} className={`truncate ${className}`} onMouseEnter={show} onMouseLeave={hide}>
      {children ?? text}
      {pos && createPortal(
        <div
          style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, maxWidth: 360 }}
          className="bg-[#1A202C] text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none whitespace-normal leading-relaxed"
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  )
}
