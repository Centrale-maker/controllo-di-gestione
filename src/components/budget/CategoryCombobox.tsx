import { useState, useRef, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  options: string[]
  placeholder?: string
}

export default function CategoryCombobox({ value, onChange, onConfirm, options: allOptions, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? allOptions.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : allOptions

  const exactMatch = allOptions.some(o => o.toLowerCase() === value.toLowerCase())
  const showCreate = value.trim() && !exactMatch

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(option: string) {
    onChange(option)
    setOpen(false)
    onConfirm()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (value.trim()) {
        if (filtered.length === 1) select(filtered[0])
        else if (value.trim()) onConfirm()
      }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex-1">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Cerca o crea categoria...'}
          className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
          autoComplete="off"
        />
      </div>

      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(opt) }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#1A202C] hover:bg-[#F1F5F9] transition-colors"
            >
              {opt}
            </button>
          ))}

          {showCreate && (
            <>
              {filtered.length > 0 && <div className="border-t border-[#F1F5F9]" />}
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); select(value.trim()) }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#3B82F6] hover:bg-[#EFF6FF] transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                Crea "{value.trim()}"
              </button>
            </>
          )}

          {filtered.length === 0 && !showCreate && (
            <p className="px-4 py-3 text-sm text-[#94A3B8]">Nessuna categoria trovata</p>
          )}
        </div>
      )}
    </div>
  )
}
