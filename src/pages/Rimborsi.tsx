import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Download, List, CalendarDays } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useExpenseQuotas } from '@/hooks/useExpenseQuotas'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { usePurchases } from '@/hooks/usePurchases'
import { defaultFilterState } from '@/types'
import { QuotaList } from '@/components/rimborsi/QuotaList'
import { CreatePlanModal } from '@/components/rimborsi/CreatePlanModal'
import { RimborsiExportDialog } from '@/components/rimborsi/RimborsiExportDialog'
import { RimborsiCalendar } from '@/components/rimborsi/RimborsiCalendar'
import type { ExpenseQuota } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function toIsoMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

function formatMese(iso: string): string {
  const [y, m] = iso.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

function addMonths(iso: string, n: number): string {
  const [y, m] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return toIsoMonth(d)
}

type View = 'lista' | 'calendario'

// ─── Rimborsi ─────────────────────────────────────────────────────────────────

export default function Rimborsi() {
  const [view, setView]         = useState<View>('lista')
  const [periodo, setPeriodo]   = useState<string>(toIsoMonth(new Date()))
  const [createOpen, setCreateOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const {
    quotas,
    directPurchases,
    loading,
    error,
    refresh,
    updateQuotaStato,
    updateDirectRimborso,
  } = useExpenseQuotas(periodo)

  const { purchases: allPurchases } = usePurchases(defaultFilterState)
  const filterOptions = useFilterOptions()

  // ── Raggruppa le quote per piano ──────────────────────────────────────────
  const groups = useMemo(() => {
    const map = new Map<string, {
      purchase: ExpenseQuota['purchase'] & object
      planId: string
      nPeriodi: number
      quotas: ExpenseQuota[]
    }>()
    for (const q of quotas) {
      const existing = map.get(q.plan_id)
      if (existing) {
        existing.quotas.push(q)
      } else {
        map.set(q.plan_id, {
          purchase: (q as ExpenseQuota & { purchase: object }).purchase as never,
          planId: q.plan_id,
          nPeriodi: q.quota_totale,
          quotas: [q],
        })
      }
    }
    return [...map.values()]
  }, [quotas])

  // ── KPI ───────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const quotaTot  = quotas.reduce((s, q) => s + q.importo, 0)
    const quotaRimb = quotas.filter(q => q.stato === 'rimborsata').reduce((s, q) => s + q.importo, 0)
    const dirTot    = directPurchases.reduce((s, p) => s + p.imponibile, 0)
    const dirRimb   = directPurchases.filter(p => p.rimborso === 'rimborsata').reduce((s, p) => s + p.imponibile, 0)
    return {
      totale:       quotaTot + dirTot,
      rimborsato:   quotaRimb + dirRimb,
      daRimborsare: (quotaTot - quotaRimb) + (dirTot - dirRimb),
    }
  }, [quotas, directPurchases])

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-[#1A202C]">Rimborsi</h1>
          <div className="flex items-center gap-2">

            {/* Toggle Lista / Calendario */}
            <div className="flex items-center bg-[#F1F5F9] rounded-xl p-0.5">
              <button
                onClick={() => setView('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'lista'
                    ? 'bg-white text-[#1A202C] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1A202C]'
                }`}
              >
                <List size={15} />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setView('calendario')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'calendario'
                    ? 'bg-white text-[#1A202C] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1A202C]'
                }`}
              >
                <CalendarDays size={15} />
                <span className="hidden sm:inline">Calendario</span>
              </button>
            </div>

            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Esporta</span>
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Nuovo piano</span>
            </button>
          </div>
        </div>

        {/* Navigatore mensile — solo in vista Lista */}
        {view === 'lista' && (
          <>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => setPeriodo(p => addMonths(p, -1))}
                className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-base font-semibold text-[#1A202C] capitalize min-w-[160px] text-center">
                {formatMese(periodo)}
              </span>
              <button
                onClick={() => setPeriodo(p => addMonths(p, 1))}
                className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <KpiCard label="Da rimborsare" value={kpi.daRimborsare} color="amber" />
              <KpiCard label="Rimborsate"    value={kpi.rimborsato}   color="emerald" />
              <KpiCard label="Totale mese"   value={kpi.totale}       color="blue" />
            </div>
          </>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 md:px-6">

        {/* Vista Lista */}
        {view === 'lista' && (
          <>
            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && !loading && (
              <div className="text-sm text-[#EF4444] bg-red-50 rounded-xl px-4 py-3">{error}</div>
            )}
            {!loading && !error && (
              <QuotaList
                groups={groups as never}
                directPurchases={directPurchases}
                onToggleQuota={updateQuotaStato}
                onToggleDirect={updateDirectRimborso}
                onPlanDeleted={refresh}
              />
            )}
          </>
        )}

        {/* Vista Calendario */}
        {view === 'calendario' && (
          <RimborsiCalendar initialPeriodo={periodo} />
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {createOpen && (
        <CreatePlanModal
          purchases={allPurchases}
          sedeOptions={filterOptions.ccSede}
          clienteOptions={filterOptions.ccCliente}
          onCreated={refresh}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {exportOpen && (
        <RimborsiExportDialog
          currentPeriodo={periodo}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: {
  label: string
  value: number
  color: 'amber' | 'emerald' | 'blue'
}) {
  const colors = {
    amber:   'bg-amber-50 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue:    'bg-[#EFF6FF] text-[#1E3A5F] border-[#BFDBFE]',
  }
  return (
    <div className={`border rounded-xl px-3 py-2.5 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1 leading-tight">{label}</p>
      <p className="text-sm font-bold leading-tight">{formatCurrency(value)}</p>
    </div>
  )
}
