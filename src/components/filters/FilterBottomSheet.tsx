import { X } from 'lucide-react'
import FilterPanel from './FilterPanel'
import type { FilterState } from '@/types'
import type { FilterOptions } from '@/hooks/useFilterOptions'

interface Props {
  open: boolean
  onClose: () => void
  filters: FilterState
  options: FilterOptions
  activeCount: number
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
}

export default function FilterBottomSheet({ open, onClose, ...panelProps }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[88dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] shrink-0">
          <h2 className="text-sm font-bold text-[#1A202C]">Filtri</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F8FAFC]"
          >
            <X size={18} className="text-[#64748B]" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4">
          <FilterPanel {...panelProps} />
        </div>
        <div className="px-4 py-3 border-t border-[#E2E8F0] shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium"
          >
            Applica filtri
          </button>
        </div>
      </div>
    </div>
  )
}
