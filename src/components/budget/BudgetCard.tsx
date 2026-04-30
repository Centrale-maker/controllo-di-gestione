import { useNavigate } from 'react-router-dom'
import { Lock, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BudgetSummary } from '@/hooks/useBudgets'

const STATO_COLORS: Record<string, string> = {
  bozza:      'bg-gray-100 text-gray-600',
  inviato:    'bg-blue-50 text-blue-700',
  confermato: 'bg-emerald-50 text-emerald-700',
  chiuso:     'bg-slate-100 text-slate-600',
}

const STATO_LABEL: Record<string, string> = {
  bozza: 'Bozza', inviato: 'Inviato', confermato: 'Confermato', chiuso: 'Chiuso',
}

export default function BudgetCard({ b }: { b: BudgetSummary }) {
  const navigate = useNavigate()
  const marginePerc = b.totale_ricavi > 0 ? (b.margine / b.totale_ricavi) * 100 : 0

  return (
    <button
      onClick={() => navigate(`/budget/${b.id}`)}
      className="w-full text-left bg-white rounded-xl border border-[#E2E8F0] p-4 hover:border-[#3B82F6] hover:shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-[#1E3A5F] bg-[#EFF6FF] px-2.5 py-1 rounded-lg shrink-0">
            {b.codice}
          </span>
          {b.preventivo_bloccato && (
            <Lock size={13} className="text-amber-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATO_COLORS[b.stato]}`}>
            {STATO_LABEL[b.stato]}
          </span>
          <ChevronRight size={16} className="text-[#94A3B8]" />
        </div>
      </div>

      <p className="text-sm font-semibold text-[#1A202C] truncate">{b.nome}</p>
      <p className="text-xs text-[#64748B] truncate mt-0.5">{b.cliente}</p>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F1F5F9]">
        <div>
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Costi</p>
          <p className="text-sm font-semibold text-[#EF4444] mt-0.5">{formatCurrency(b.totale_costi)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Ricavi</p>
          <p className="text-sm font-semibold text-[#10B981] mt-0.5">{formatCurrency(b.totale_ricavi)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Margine</p>
          <p className={`text-sm font-semibold mt-0.5 ${b.margine >= 0 ? 'text-[#1E3A5F]' : 'text-[#EF4444]'}`}>
            {marginePerc.toFixed(0)}%
          </p>
        </div>
      </div>

      <p className="text-[10px] text-[#94A3B8] mt-3">
        {b.n_centri} {b.n_centri === 1 ? 'centro' : 'centri'} · {b.n_voci} {b.n_voci === 1 ? 'voce' : 'voci'}
      </p>
    </button>
  )
}
