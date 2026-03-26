import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useFilters } from '@/hooks/useFilters'
import { usePurchases } from '@/hooks/usePurchases'
import KPIStrip from '@/components/kpi/KPIStrip'
import DataView from '@/components/tables/DataView'

export default function Dashboard() {
  const { filters, setFilter, resetFilters, activeCount } = useFilters()
  const { purchases, loading, error } = usePurchases(filters)

  const searchValue = filters.searchText

  const summary = useMemo(() => {
    if (loading) return null
    return `${purchases.length.toLocaleString('it-IT')} fatture`
  }, [purchases.length, loading])

  return (
    <div className="px-4 py-6 space-y-6 max-w-screen-xl mx-auto">
      {/* KPI */}
      <KPIStrip purchases={purchases} />

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setFilter('searchText', e.target.value)}
            placeholder="Cerca fornitore o descrizione..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
          />
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
          >
            <X size={14} />
            Reset ({activeCount})
          </button>
        )}
      </div>

      {/* Count label */}
      {summary && (
        <p className="text-xs text-[#64748B] -mt-4">{summary}</p>
      )}

      {/* Data */}
      <DataView purchases={purchases} loading={loading} error={error} />
    </div>
  )
}
