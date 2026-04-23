import { X, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useCommessaDetail } from '@/hooks/useCommessaDetail'
import { useCommesse } from '@/hooks/useCommesse'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Purchase, Revenue } from '@/types'

interface Props {
  commessaId: string | null
  onClose: () => void
}

function MargineTag({ margine, perc }: { margine: number; perc: number }) {
  const pos = margine >= 0
  const Icon = perc > 15 ? TrendingUp : perc < 0 ? TrendingDown : Minus
  const cls = pos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      <Icon size={12} />
      {pos ? '+' : ''}{formatCurrency(margine)} ({perc.toFixed(1)}%)
    </span>
  )
}

function PurchaseRow({ p }: { p: Purchase }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#1A202C] truncate">{p.fornitore}</p>
        <p className="text-[11px] text-[#64748B] truncate">{p.descrizione || p.categoria || '—'}</p>
        <p className="text-[11px] text-[#94A3B8] mt-0.5">{formatDate(p.data)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-[#EF4444]">{formatCurrency(Number(p.imponibile))}</p>
        {Number(p.iva) > 0 && (
          <p className="text-[11px] text-[#94A3B8]">+ IVA {formatCurrency(Number(p.iva))}</p>
        )}
      </div>
    </div>
  )
}

function RevenueRow({ r }: { r: Revenue }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#1A202C] truncate">{r.cliente || r.cr_cliente || '—'}</p>
        <p className="text-[11px] text-[#64748B] truncate">{r.oggetto_visibile || r.oggetto_interno || r.numero}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11px] text-[#94A3B8]">{formatDate(r.data)}</p>
          {r.saldato && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 rounded-full">Saldato</span>}
          {!r.saldato && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 rounded-full">In attesa</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-[#10B981]">{formatCurrency(Number(r.imponibile))}</p>
        {Number(r.iva) > 0 && (
          <p className="text-[11px] text-[#94A3B8]">+ IVA {formatCurrency(Number(r.iva))}</p>
        )}
      </div>
    </div>
  )
}

export default function CommessaDetailModal({ commessaId, onClose }: Props) {
  const { commesse } = useCommesse()
  const { detail, loading, error } = useCommessaDetail(commessaId)

  if (!commessaId) return null

  const commessa = commesse.find(c => c.id === commessaId)
  const totCosti   = detail.purchases.reduce((s, p) => s + Number(p.imponibile), 0)
  const totRicavi  = detail.revenues.reduce((s, r) => s + Number(r.imponibile), 0)
  const margine    = totRicavi - totCosti
  const marginePerc = totRicavi > 0 ? (margine / totRicavi) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Pannello */}
      <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E2E8F0] shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs bg-[#EFF6FF] text-[#1E40AF] rounded px-2 py-0.5">{commessaId}</span>
              <h2 className="text-base font-semibold text-[#1A202C]">{commessa?.nome ?? commessaId}</h2>
            </div>
            {commessa?.cliente && (
              <p className="text-sm text-[#64748B] mt-0.5">{commessa.cliente}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#64748B]" />
          </div>
        ) : error ? (
          <p className="text-sm text-[#EF4444] p-5">{error}</p>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* Dare / Avere — colonne affiancate */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0]">

                {/* ── DARE: Fatture Passive (Costi) ── */}
                <div className="flex flex-col">
                  <div className="px-5 py-3 bg-red-50 border-b border-[#E2E8F0] sticky top-0">
                    <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">DARE — Costi</p>
                    <p className="text-lg font-bold text-[#1A202C]">{formatCurrency(totCosti)}</p>
                    <p className="text-[11px] text-[#64748B]">{detail.purchases.length} fatture passive</p>
                  </div>
                  <div className="px-5 divide-y divide-transparent">
                    {detail.purchases.length === 0 ? (
                      <p className="text-sm text-[#94A3B8] py-6 text-center">Nessuna fattura passiva</p>
                    ) : (
                      detail.purchases.map(p => <PurchaseRow key={p.id} p={p} />)
                    )}
                  </div>
                </div>

                {/* ── AVERE: Fatture Attive (Ricavi) ── */}
                <div className="flex flex-col">
                  <div className="px-5 py-3 bg-emerald-50 border-b border-[#E2E8F0] sticky top-0">
                    <p className="text-xs font-bold text-[#10B981] uppercase tracking-wider">AVERE — Ricavi</p>
                    <p className="text-lg font-bold text-[#1A202C]">{formatCurrency(totRicavi)}</p>
                    <p className="text-[11px] text-[#64748B]">{detail.revenues.length} fatture attive</p>
                  </div>
                  <div className="px-5 divide-y divide-transparent">
                    {detail.revenues.length === 0 ? (
                      <p className="text-sm text-[#94A3B8] py-6 text-center">Nessuna fattura attiva</p>
                    ) : (
                      detail.revenues.map(r => <RevenueRow key={r.id} r={r} />)
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: saldo */}
            <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] text-[#64748B] uppercase tracking-wide">Costi totali</p>
                    <p className="text-base font-bold text-[#EF4444]">{formatCurrency(totCosti)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B] uppercase tracking-wide">Ricavi totali</p>
                    <p className="text-base font-bold text-[#10B981]">{formatCurrency(totRicavi)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#64748B] uppercase tracking-wide mb-1">Margine</p>
                  <MargineTag margine={margine} perc={marginePerc} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
