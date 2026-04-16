import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { QuotaStatusPill } from './QuotaStatusPill'
import { useExpensePlans } from '@/hooks/useExpensePlans'
import type { ExpenseQuota, Purchase, QuotaStato } from '@/types'
import type { EditModeProps } from './CreatePlanModal'

// ─── Tipi ─────────────────────────────────────────────────────────────────────

interface QuotaGroup {
  purchase: Purchase
  planId: string | null
  nPeriodi: number | null
  quotas: ExpenseQuota[]
}

interface Props {
  groups: QuotaGroup[]
  directPurchases: Purchase[]
  onToggleQuota: (id: string, nuovoStato: QuotaStato) => Promise<boolean>
  onToggleDirect: (purchaseId: string, stato: 'rimborsata' | 'non rimborsata' | null) => Promise<boolean>
  onPlanDeleted: () => void
  onEditPlan: (editProps: EditModeProps) => void   // apre il modal in edit mode
}

// ─── QuotaList ────────────────────────────────────────────────────────────────

export function QuotaList({ groups, directPurchases, onToggleQuota, onToggleDirect, onPlanDeleted, onEditPlan }: Props) {
  const hasPlan = groups.length > 0
  const hasDirect = directPurchases.length > 0

  if (!hasPlan && !hasDirect) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
        <p className="text-sm">Nessun rimborso per questo mese</p>
        <p className="text-xs mt-1">Crea un piano o aggiungi spese nel mese selezionato</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map(group => (
        <PlanGroup
          key={group.planId ?? group.purchase.id}
          group={group}
          onToggleQuota={onToggleQuota}
          onPlanDeleted={onPlanDeleted}
          onEditPlan={onEditPlan}
        />
      ))}

      {hasDirect && (
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Rimborso diretto
            </span>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {directPurchases.map(p => (
              <DirectRow key={p.id} purchase={p} onToggle={onToggleDirect} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PlanGroup ────────────────────────────────────────────────────────────────

function PlanGroup({ group, onToggleQuota, onPlanDeleted, onEditPlan }: {
  group: QuotaGroup
  onToggleQuota: (id: string, stato: QuotaStato) => Promise<boolean>
  onPlanDeleted: () => void
  onEditPlan: (editProps: EditModeProps) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const { deletePlan } = useExpensePlans()

  const rimborsate = group.quotas.filter(q => q.stato === 'rimborsata').length
  const totale = group.quotas.length
  const totImporto = group.quotas.reduce((s, q) => s + q.importo, 0)
  const rimborsataImporto = group.quotas.filter(q => q.stato === 'rimborsata').reduce((s, q) => s + q.importo, 0)
  const periodoMax = group.quotas[0]?.quota_totale ?? 1
  const periodiRimborsati = [...new Set(
    group.quotas.filter(q => q.stato === 'rimborsata').map(q => q.quota_index)
  )].length

  async function handleDelete() {
    if (!group.planId) return
    if (!confirm('Eliminare questo piano e tutte le sue quote?')) return
    setDeleting(true)
    await deletePlan(group.planId)
    onPlanDeleted()
    setDeleting(false)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    if (!group.planId) return
    // Prende le quote del primo periodo per ricostruire sedi/clienti
    const minIndex = Math.min(...group.quotas.map(q => q.quota_index))
    const firstPeriodQuotas = group.quotas.filter(q => q.quota_index === minIndex)
    const importoTotale = totImporto / (totale / (firstPeriodQuotas.length || 1))

    onEditPlan({
      planId: group.planId,
      nRimborsate: rimborsate,
      firstPeriodQuotas,
      initialPurchaseId: group.purchase.id,
      initialImporto: importoTotale * periodoMax,
      initialNPeriodi: periodoMax,
      initialDataInizio: group.quotas.reduce(
        (min, q) => q.periodo < min ? q.periodo : min,
        group.quotas[0]?.periodo ?? ''
      ),
      initialNote: null,
    })
  }

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-white cursor-pointer select-none hover:bg-[#F8FAFC]"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded
          ? <ChevronDown size={15} className="text-[#64748B] shrink-0" />
          : <ChevronRight size={15} className="text-[#64748B] shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#1A202C] truncate">
              {group.purchase.fornitore}
            </span>
            {group.nPeriodi && (
              <span className="text-xs bg-[#EFF6FF] text-[#1E3A5F] border border-[#BFDBFE] px-2 py-0.5 rounded-full font-medium">
                {periodiRimborsati} di {periodoMax}
              </span>
            )}
            {rimborsate === totale && totale > 0 && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✓ Completato
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] truncate mt-0.5">
            {group.purchase.descrizione?.slice(0, 60)}
          </p>
        </div>

        <div className="text-right shrink-0 ml-2">
          <p className="text-sm font-semibold text-[#1A202C]">{formatCurrency(totImporto)}</p>
          <p className="text-xs text-[#64748B]">{formatCurrency(rimborsataImporto)} rimborsati</p>
        </div>

        {/* Tasto modifica */}
        <button
          type="button"
          onClick={handleEdit}
          className="ml-1 p-1.5 text-[#64748B] hover:text-[#1E3A5F] hover:bg-[#EFF6FF] rounded-lg"
          title="Modifica piano"
        >
          <Pencil size={14} />
        </button>

        {/* Tasto elimina */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleDelete() }}
          disabled={deleting}
          className="p-1.5 text-[#EF4444] hover:bg-red-50 rounded-lg disabled:opacity-40"
          title="Elimina piano"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="divide-y divide-[#F1F5F9] border-t border-[#F1F5F9]">
          {group.quotas.map(quota => (
            <QuotaRow key={quota.id} quota={quota} onToggle={onToggleQuota} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── QuotaRow ─────────────────────────────────────────────────────────────────

function QuotaRow({ quota, onToggle }: {
  quota: ExpenseQuota
  onToggle: (id: string, stato: QuotaStato) => Promise<boolean>
}) {
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    await onToggle(quota.id, quota.stato === 'rimborsata' ? 'da_rimborsare' : 'rimborsata')
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-[#FAFAFA]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {quota.sede && (
            <span className="text-xs bg-[#F1F5F9] text-[#475569] px-1.5 py-0.5 rounded font-medium">
              {quota.sede}
            </span>
          )}
          {quota.cliente && (
            <span className="text-xs bg-[#F0FDF4] text-[#166534] px-1.5 py-0.5 rounded font-medium">
              {quota.cliente}
            </span>
          )}
          {!quota.sede && !quota.cliente && (
            <span className="text-xs text-[#64748B]">Quota intera</span>
          )}
          <span className="text-xs text-[#64748B]">
            · periodo {quota.quota_index}/{quota.quota_totale}
          </span>
        </div>
        {quota.data_rimborso && (
          <p className="text-xs text-[#64748B] mt-0.5">
            Rimborsata il {formatDate(quota.data_rimborso)}
          </p>
        )}
      </div>

      <span className="text-sm font-semibold text-[#1A202C] shrink-0">
        {formatCurrency(quota.importo)}
      </span>

      <QuotaStatusPill stato={quota.stato} onClick={toggle} disabled={busy} />
    </div>
  )
}

// ─── DirectRow ────────────────────────────────────────────────────────────────

function DirectRow({ purchase, onToggle }: {
  purchase: Purchase
  onToggle: (id: string, stato: 'rimborsata' | 'non rimborsata' | null) => Promise<boolean>
}) {
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    const nuovoStato = purchase.rimborso === 'rimborsata' ? 'non rimborsata' : 'rimborsata'
    await onToggle(purchase.id, nuovoStato)
    setBusy(false)
  }

  const isRimborsata = purchase.rimborso === 'rimborsata'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-[#FAFAFA]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A202C] truncate">{purchase.fornitore}</p>
        <p className="text-xs text-[#64748B] truncate">{purchase.descrizione?.slice(0, 60)}</p>
      </div>

      <span className="text-sm font-semibold text-[#1A202C] shrink-0">
        {formatCurrency(purchase.imponibile)}
      </span>

      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={[
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'border transition-colors select-none',
          busy ? 'opacity-60 cursor-default' : 'cursor-pointer',
          isRimborsata
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        ].join(' ')}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isRimborsata ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {isRimborsata ? 'Rimborsata' : 'Da rimborsare'}
      </button>
    </div>
  )
}
