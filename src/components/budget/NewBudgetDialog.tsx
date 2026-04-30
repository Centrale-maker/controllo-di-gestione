import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

function generateCodice(count: number): string {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const r = () => L[Math.floor(Math.random() * L.length)]
  return `${r()}${r()}${String(count + 1).padStart(4, '0')}${r()}${r()}`
}

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

export default function NewBudgetDialog({ onClose, onCreated }: Props) {
  const { company } = useAuth()
  const [cliente, setCliente] = useState('')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleCreate() {
    if (!company?.id || !cliente.trim() || !nome.trim()) return
    setSaving(true)
    setErr(null)
    try {
      const { count } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)

      const codice = generateCodice(count ?? 0)

      const { data, error } = await supabase
        .from('budgets')
        .insert({ company_id: company.id, codice, cliente: cliente.trim(), nome: nome.trim() })
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      onCreated(data.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore creazione budget')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A202C]">Nuovo Budget</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Cliente *</label>
            <input
              type="text"
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Es. Comune di Roma"
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Nome evento / progetto *</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Es. Gala di inaugurazione 2026"
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-[#EF4444]">{err}</p>}

        <p className="mt-3 text-xs text-[#64748B]">
          Il codice univoco verrà generato automaticamente (es. KL0042PQ)
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annulla
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !cliente.trim() || !nome.trim()}
            className="flex-1 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Crea Budget
          </button>
        </div>
      </div>
    </div>
  )
}
