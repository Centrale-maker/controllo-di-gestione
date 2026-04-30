import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BudgetVoceRow from './BudgetVoceRow'
import type { BudgetCentroWithVoci } from '@/hooks/useBudgetDetail'

interface Props {
  centro: BudgetCentroWithVoci
  onRefresh: () => void
}

export default function BudgetCentroSection({ centro, onRefresh }: Props) {
  const [open, setOpen] = useState(true)
  const [addingVoce, setAddingVoce] = useState(false)
  const [deletingCentro, setDeletingCentro] = useState(false)

  const totCosti = centro.voci.reduce((s, v) => s + Number(v.costo_stimato), 0)
  const totVendita = centro.voci.reduce((s, v) => s + Number(v.prezzo_vendita), 0)
  const margine = totVendita - totCosti
  const marginePerc = totCosti > 0 ? (margine / totCosti) * 100 : 0

  async function addVoce() {
    setAddingVoce(true)
    try {
      await supabase.from('budget_voci').insert({
        budget_centro_id: centro.id,
        budget_id: centro.budget_id,
        company_id: centro.company_id,
        descrizione: '',
        costo_stimato: 0,
        prezzo_vendita: 0,
        sort_order: centro.voci.length,
      })
      onRefresh()
    } finally {
      setAddingVoce(false)
    }
  }

  async function deleteCentro() {
    if (!confirm(`Eliminare il centro "${centro.nome}" e tutte le sue voci?`)) return
    setDeletingCentro(true)
    await supabase.from('budget_centri').delete().eq('id', centro.id)
    onRefresh()
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <button onClick={() => setOpen(o => !o)} className="shrink-0 text-[#64748B] hover:text-[#1A202C]">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <p className="font-semibold text-sm text-[#1A202C] flex-1 min-w-0 truncate">{centro.nome}</p>
        <div className="hidden sm:flex items-center gap-4 text-xs text-[#64748B] shrink-0">
          <span>Costi: <strong className="text-[#EF4444]">{formatCurrency(totCosti)}</strong></span>
          <span>Ricavi: <strong className="text-[#10B981]">{formatCurrency(totVendita)}</strong></span>
          <span className={`font-semibold ${margine >= 0 ? 'text-[#1E3A5F]' : 'text-[#EF4444]'}`}>
            +{marginePerc.toFixed(0)}%
          </span>
        </div>
        <button
          onClick={deleteCentro}
          disabled={deletingCentro}
          title="Elimina centro"
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
        >
          {deletingCentro ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>

      {open && (
        <>
          {/* Colonne header desktop */}
          {centro.voci.length > 0 && (
            <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_36px] gap-2 px-3 py-2 bg-[#FAFBFC] border-b border-[#F1F5F9]">
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-semibold px-1.5">Descrizione</p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-semibold text-right px-1.5">Costo stimato</p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-semibold text-right px-1.5">Prezzo vendita</p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-semibold text-right px-1.5">Margine</p>
              <div />
            </div>
          )}

          {/* Voci */}
          {centro.voci.length === 0 && (
            <p className="text-sm text-[#94A3B8] px-4 py-4 italic">Nessuna voce — aggiungine una</p>
          )}
          {centro.voci.map(v => (
            <BudgetVoceRow key={v.id} voce={v} onRefresh={onRefresh} />
          ))}

          {/* Footer totali mobile */}
          <div className="sm:hidden px-4 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-4 text-xs text-[#64748B]">
            <span>Costi: <strong className="text-[#EF4444]">{formatCurrency(totCosti)}</strong></span>
            <span>Ricavi: <strong className="text-[#10B981]">{formatCurrency(totVendita)}</strong></span>
          </div>

          {/* Aggiungi voce */}
          <div className="px-4 py-2.5 border-t border-[#F1F5F9]">
            <button
              onClick={addVoce}
              disabled={addingVoce}
              className="flex items-center gap-1.5 text-sm text-[#3B82F6] hover:text-[#1E3A5F] font-medium transition-colors"
            >
              {addingVoce
                ? <Loader2 size={14} className="animate-spin" />
                : <Plus size={14} />}
              Aggiungi voce
            </button>
          </div>
        </>
      )}
    </div>
  )
}
