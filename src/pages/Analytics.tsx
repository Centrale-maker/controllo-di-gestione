import { useMemo, useState, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useFilters } from '@/hooks/useFilters'
import { usePurchases } from '@/hooks/usePurchases'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { useIsMobile } from '@/hooks/useIsMobile'
import { getMonthlyCashflow, getByField, getRinnovi } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import FilterPanel from '@/components/filters/FilterPanel'
import FilterBottomSheet from '@/components/filters/FilterBottomSheet'
import CashflowChart from '@/components/charts/CashflowChart'
import CategorieChart from '@/components/charts/CategorieChart'
import HBarChart from '@/components/charts/HBarChart'
import RinnoviChart from '@/components/charts/RinnoviChart'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <h3 className="text-sm font-semibold text-[#1A202C] mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function Analytics() {
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)

  const { filters, setFilter, resetFilters, activeCount } = useFilters()
  const { purchases, loading } = usePurchases(filters)
  const options = useFilterOptions()

  const monthly     = useMemo(() => getMonthlyCashflow(purchases), [purchases])
  const categorie   = useMemo(() => getByField(purchases, 'categoria', 8), [purchases])
  const centroCosto = useMemo(() => getByField(purchases, 'centro_costo', 10), [purchases])
  const fornitori   = useMemo(() => getByField(purchases, 'fornitore', 10), [purchases])
  const paese       = useMemo(() => getByField(purchases, 'paese', 10), [purchases])
  const rinnovi     = useMemo(() => getRinnovi(purchases), [purchases])

  const totale     = useMemo(() => purchases.reduce((s, p) => s + Number(p.imponibile) + Number(p.iva), 0), [purchases])
  const imponibile = useMemo(() => purchases.reduce((s, p) => s + Number(p.imponibile), 0), [purchases])
  const iva        = useMemo(() => purchases.reduce((s, p) => s + Number(p.iva), 0), [purchases])

  const filterProps = { filters, options, activeCount, setFilter, resetFilters }

  const charts = loading ? (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <div className="space-y-6">
      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Totale lordo', value: formatCurrency(totale) },
          { label: 'Imponibile', value: formatCurrency(imponibile) },
          { label: 'IVA', value: formatCurrency(iva) },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] px-3 py-3">
            <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide truncate">{k.label}</p>
            <p className="text-base font-bold text-[#1A202C] mt-0.5 truncate">{k.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#64748B]">
        {purchases.length.toLocaleString('it-IT')} fatture · {new Set(purchases.map(p => p.fornitore)).size} fornitori
      </p>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Andamento mensile">
          <CashflowChart data={monthly} />
        </Card>
        <Card title="Spesa per categoria">
          <CategorieChart data={categorie} />
        </Card>
        <Card title="Top 10 fornitori">
          <HBarChart data={fornitori} color="#3B82F6" />
        </Card>
        <Card title="Centro di costo">
          <HBarChart data={centroCosto} color="#10B981" />
        </Card>
        <Card title="Ricorrente vs Una tantum">
          <RinnoviChart data={rinnovi} />
        </Card>
        <Card title="Spesa per paese">
          <HBarChart data={paese} color="#F59E0B" />
        </Card>
      </div>
    </div>
  )

  /* ── Mobile ── */
  if (isMobile) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A202C]">Analytics</h2>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B]"
          >
            <SlidersHorizontal size={15} />
            Filtri {activeCount > 0 && <span className="bg-[#1E3A5F] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>
        {charts}
        <FilterBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} {...filterProps} />
      </div>
    )
  }

  /* ── Desktop ── */
  return (
    <div className="flex h-full">
      {/* Sidebar filtri */}
      <aside className="w-72 shrink-0 border-r border-[#E2E8F0] bg-white overflow-y-auto p-5">
        <FilterPanel {...filterProps} />
      </aside>

      {/* Contenuto */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {charts}
      </main>
    </div>
  )
}
