import { useState } from 'react'
import { Search, SlidersHorizontal, Download } from 'lucide-react'
import { useFilters } from '@/hooks/useFilters'
import { usePurchases } from '@/hooks/usePurchases'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { useIsMobile } from '@/hooks/useIsMobile'
import KPIStrip from '@/components/kpi/KPIStrip'
import DataView from '@/components/tables/DataView'
import FilterPanel from '@/components/filters/FilterPanel'
import FilterBottomSheet from '@/components/filters/FilterBottomSheet'
import ExportDialog from '@/components/export/ExportDialog'

export default function Dashboard() {
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const { filters, setFilter, resetFilters, activeCount } = useFilters()
  const { purchases, loading, error, updateRinnovi, updateRow } = usePurchases(filters)
  const options = useFilterOptions()

  const filterProps = { filters, options, activeCount, setFilter, resetFilters }

  const content = (
    <div className="space-y-4">
      {/* KPI */}
      <KPIStrip purchases={purchases} />

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={filters.searchText}
            onChange={e => setFilter('searchText', e.target.value)}
            placeholder="Cerca fornitore o descrizione..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
          />
        </div>
        {isMobile && (
          <button
            onClick={() => setSheetOpen(true)}
            className="relative flex items-center gap-1.5 h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] shrink-0"
          >
            <SlidersHorizontal size={15} />
            Filtri
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#1E3A5F] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      {!loading && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#64748B]">
            {purchases.length.toLocaleString('it-IT')} fatture
            {activeCount > 0 && (
              <button onClick={resetFilters} className="ml-2 text-[#3B82F6] hover:underline">
                Reset filtri
              </button>
            )}
          </p>
          <button
            onClick={() => setExportOpen(true)}
            disabled={purchases.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            Esporta
          </button>
        </div>
      )}

      <DataView
        purchases={purchases}
        loading={loading}
        error={error}
        options={options}
        onRinnoviChange={updateRinnovi}
        onRowUpdate={updateRow}
      />
    </div>
  )

  const exportDialog = (
    <ExportDialog
      open={exportOpen}
      onClose={() => setExportOpen(false)}
      purchases={purchases}
      activeFiltersCount={activeCount}
    />
  )

  if (isMobile) {
    return (
      <div className="px-4 py-4">
        {content}
        <FilterBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} {...filterProps} />
        {exportDialog}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar filtri */}
      <aside className="w-72 shrink-0 border-r border-[#E2E8F0] bg-white overflow-y-auto p-5">
        <FilterPanel {...filterProps} />
      </aside>

      {/* Contenuto */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {content}
      </main>

      {exportDialog}
    </div>
  )
}
