import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function CheckList({ label, options, selected, onChange }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v])
  }

  const hasActive = selected.length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1A202C] uppercase tracking-wide">{label}</span>
        {hasActive && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-[#3B82F6] hover:underline"
          >
            Reset ({selected.length})
          </button>
        )}
      </div>

      {options.length > 6 && (
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Cerca ${label.toLowerCase()}...`}
            className="w-full h-8 pl-7 pr-7 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X size={12} className="text-[#64748B]" />
            </button>
          )}
        </div>
      )}

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {filtered.map(opt => (
          <label key={opt} className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-[#F8FAFC]">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="w-3.5 h-3.5 rounded accent-[#1E3A5F]"
            />
            <span className={`text-xs truncate ${selected.includes(opt) ? 'font-medium text-[#1E3A5F]' : 'text-[#1A202C]'}`}>
              {opt}
            </span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-[#64748B] py-2 text-center">Nessun risultato</p>
        )}
      </div>
    </div>
  )
}
