import { useState, useRef } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { BudgetVoce } from '@/types'

interface Props {
  voce: BudgetVoce
  onRefresh: () => void
}

export default function BudgetVoceRow({ voce, onRefresh }: Props) {
  const [descrizione, setDescrizione] = useState(voce.descrizione)
  const [costo, setCosto] = useState(String(voce.costo_stimato || ''))
  const [vendita, setVendita] = useState(String(voce.prezzo_vendita || ''))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dirty = useRef(false)

  const costoN = parseFloat(costo) || 0
  const venditaN = parseFloat(vendita) || 0
  const margine = venditaN - costoN
  const marginePerc = costoN > 0 ? (margine / costoN) * 100 : 0

  function markDirty() { dirty.current = true }

  async function save() {
    if (!dirty.current) return
    dirty.current = false
    setSaving(true)
    try {
      await supabase.from('budget_voci').update({
        descrizione,
        costo_stimato: costoN,
        prezzo_vendita: venditaN,
        updated_at: new Date().toISOString(),
      }).eq('id', voce.id)
    } finally {
      setSaving(false)
      onRefresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Rimuovere questa voce?')) return
    setDeleting(true)
    await supabase.from('budget_voci').delete().eq('id', voce.id)
    onRefresh()
  }

  const inputCls = 'w-full bg-transparent border-0 focus:outline-none focus:bg-[#F8FAFC] rounded px-1.5 py-1 text-sm text-[#1A202C] placeholder-[#CBD5E1]'

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_36px] gap-2 items-center px-3 py-1.5 border-b border-[#F8FAFC] group hover:bg-[#FAFBFC]">
        <input
          className={inputCls}
          value={descrizione}
          placeholder="Descrizione voce"
          onChange={e => { setDescrizione(e.target.value); markDirty() }}
          onBlur={save}
        />
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">€</span>
          <input
            className={`${inputCls} pl-5 text-right`}
            value={costo}
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            onChange={e => { setCosto(e.target.value); markDirty() }}
            onBlur={save}
          />
        </div>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">€</span>
          <input
            className={`${inputCls} pl-5 text-right`}
            value={vendita}
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            onChange={e => { setVendita(e.target.value); markDirty() }}
            onBlur={save}
          />
        </div>
        <div className="text-right text-xs font-medium">
          {saving
            ? <Loader2 size={12} className="animate-spin ml-auto text-[#94A3B8]" />
            : <span className={margine >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                +{marginePerc.toFixed(0)}% ({formatCurrency(margine)})
              </span>
          }
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-all"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-3 py-2.5 border-b border-[#F8FAFC]">
        <input
          className="w-full text-sm text-[#1A202C] bg-transparent border-0 focus:outline-none focus:bg-[#F8FAFC] rounded px-1 py-0.5 mb-2 placeholder-[#CBD5E1]"
          value={descrizione}
          placeholder="Descrizione voce"
          onChange={e => { setDescrizione(e.target.value); markDirty() }}
          onBlur={save}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-[#94A3B8] mb-0.5">Costo</p>
            <input className="w-full text-sm border border-[#E2E8F0] rounded px-2 py-1" type="number" value={costo}
              onChange={e => { setCosto(e.target.value); markDirty() }} onBlur={save} placeholder="0" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-[#94A3B8] mb-0.5">Vendita</p>
            <input className="w-full text-sm border border-[#E2E8F0] rounded px-2 py-1" type="number" value={vendita}
              onChange={e => { setVendita(e.target.value); markDirty() }} onBlur={save} placeholder="0" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-[#94A3B8] mb-0.5">Margine</p>
            <p className={`text-sm font-medium ${margine >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              +{marginePerc.toFixed(0)}%
            </p>
          </div>
          <button onClick={handleDelete} disabled={deleting} className="p-2 text-[#94A3B8] hover:text-[#EF4444]">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
