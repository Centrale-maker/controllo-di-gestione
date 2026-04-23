import { useMemo, useState, useCallback, type ReactNode } from 'react'
import { initialActiveDims } from '@/components/filters/filterDimensions'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useFilters } from '@/hooks/useFilters'
import { usePurchases } from '@/hooks/usePurchases'
import { useFacetedOptions } from '@/hooks/useFacetedOptions'
import { useIsMobile } from '@/hooks/useIsMobile'
import { getMonthlyCashflow, getByField, getRinnovi } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import type { FilterState } from '@/types'
import FilterBottomSheet from '@/components/filters/FilterBottomSheet'
import FilterChips from '@/components/filters/FilterChips'
import DragFilterBar from '@/components/filters/DragFilterBar'
import CashflowChart from '@/components/charts/CashflowChart'
import CategorieChart from '@/components/charts/CategorieChart'
import HBarChart from '@/components/charts/HBarChart'
import RinnoviChart from '@/components/charts/RinnoviChart'
import CommesseView from '@/components/charts/CommesseView'

type Tab = 'costi' | 'commesse'

function Card({ title, children, hint }: { title: string; children: ReactNode; hint?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1A202C]">{title}</h3>
        {hint && (
          <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded px-1.5 py-0.5 select-none">
            clicca per filtrare
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 w-fit">
      {(['costi', 'commesse'] as Tab[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === t
              ? 'bg-white text-[#1A202C] shadow-sm'
              : 'text-[#64748B] hover:text-[#1A202C]'
          }`}
        >
          {t === 'costi' ? 'Costi' : 'Commesse'}
        </button>
      ))}
    </div>
  )
}

export default function Analytics() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('costi')

  const { filters, setFilter, patchFilters, resetFilters, activeCount } = useFilters()
  const [activeDimIds, setActiveDimIds] = useState<string[]>(() => initialActiveDims(filters))
  const { purchases, loading } = usePurchases(filters)
  const { options, allRows } = useFacetedOptions(filters, activeDimIds)

  const monthly     = useMemo(() => getMonthlyCashflow(purchases), [purchases])
  const categorie   = useMemo(() => getByField(purchases, 'categoria', 8), [purchases])
  const centroCosto = useMemo(() => getByField(purchases, 'centro_costo', 10), [purchases])
  const fornitori   = useMemo(() => getByField(purchases, 'fornitore', 10), [purchases])
  const paese       = useMemo(() => getByField(purchases, 'paese', 10), [purchases])
  const rinnovi     = useMemo(() => getRinnovi(purchases), [purchases])

  const totale     = useMemo(() => purchases.reduce((s, p) => s + Number(p.imponibile) + Number(p.iva), 0), [purchases])
  const imponibile = useMemo(() => purchases.reduce((s, p) => s + Number(p.imponibile), 0), [purchases])
  const iva        = useMemo(() => purchases.reduce((s, p) => s + Number(p.iva), 0), [purchases])

  const filterProps = { filters, options, allRows, activeCount, setFilter, patchFilters, resetFilters }

  const drillTo = useCallback((patch: Partial<FilterState>) => {
    patchFilters(patch)
    navigate('/dashboard')
  }, [patchFilters, navigate])

  const costiTab = loading ? (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Totale lordo', value: formatCurrency(totale) },
          { label: 'Imponibile',   value: formatCurrency(imponibile) },
          { label: 'IVA',          value: formatCurrency(iva) },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Andamento mensile" hint>
          <CashflowChart data={monthly} onDrilldown={drillTo} />
        </Card>
        <Card title="Spesa per categoria" hint>
          <CategorieChart data={categorie} onDrilldown={drillTo} />
        </Card>
        <Card title="Top 10 fornitori" hint>
          <HBarChart data={fornitori} color="#3B82F6" onDrilldown={drillTo} filterKey="fornitore" />
        </Card>
        <Card title="Centro di costo" hint>
          <HBarChart data={centroCosto} color="#10B981" onDrilldown={drillTo} filterKey="centroCosto" />
        </Card>
        <Card title="Ricorrente vs Una tantum" hint>
          <RinnoviChart data={rinnovi} onDrilldown={drillTo} />
        </Card>
        <Card title="Spesa per paese" hint>
          <HBarChart data={paese} color="#F59E0B" onDrilldown={drillTo} filterKey="paese" />
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
          {activeTab === 'costi' && (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B]"
            >
              <SlidersHorizontal size={15} />
              Filtri {activeCount > 0 && <span className="bg-[#1E3A5F] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>}
            </button>
          )}
        </div>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === 'costi' && (
          <>
            <FilterChips filters={filters} allRows={allRows} setFilter={setFilter} patchFilters={patchFilters} />
            {costiTab}
          </>
        )}
        {activeTab === 'commesse' && <CommesseView />}
        <FilterBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} {...filterProps} />
      </div>
    )
  }

  /* ── Desktop ── */
  return (
    <div className="flex flex-col h-full">
      {activeTab === 'costi' && (
        <DragFilterBar
          filters={filters}
          options={options}
          allRows={allRows}
          setFilter={setFilter}
          patchFilters={patchFilters}
          resetFilters={resetFilters}
          activeDimIds={activeDimIds}
          onActiveDimsChange={setActiveDimIds}
        />
      )}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A202C]">Analytics</h2>
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>
        {activeTab === 'costi'    && costiTab}
        {activeTab === 'commesse' && <CommesseView />}
      </main>
    </div>
  )
}
