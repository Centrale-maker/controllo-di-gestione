import { useState, useEffect } from 'react'
import { X, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useClientiOptions } from '@/hooks/useClientiOptions'
import CategoryCombobox from '@/components/budget/CategoryCombobox'

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
  const clientiOptions = useClientiOptions()
  const [cliente, setCliente] = useState('')
  const [nome, setNome] = useState('')
  const [codice, setCodice] = useState('')
  const [codiceError, setCodiceError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!company?.id) return
    supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .then(({ count }) => setCodice(generateCodice(count ?? 0)))
  }, [company?.id])

  function rigenera() {
    const base = parseInt(codice.slice(2, 6)) || 0
    setCodice(generateCodice(base))
    setCodiceError(null)
  }

  function handleCodiceChange(v: string) {
    setCodice(v.toUpperCase())
    setCodiceError(null)
  }

  async function validateCodice(value: string): Promise<boolean> {
    const trimmed = value.trim()
    if (!trimmed) { setCodiceError('Il codice è obbligatorio'); return false }
    const { count } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company!.id)
      .eq('codice', trimmed)
    if ((count ?? 0) > 0) {
      setCodiceError('Questo codice è già usato da un altro budget')
      return false
    }
    return true
  }

  async function handleCreate() {
    if (!company?.id || !cliente.trim() || !nome.trim()) return
    setSaving(true)
    setErr(null)
    try {
      const ok = await validateCodice(codice)
      if (!ok) { setSaving(false); return }

      const { data, error } = await supabase
        .from('budgets')
        .insert({ company_id: company.id, codice: codice.trim(), cliente: cliente.trim(), nome: nome.trim() })
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

  const canSubmit = !saving && cliente.trim() && nome.trim() && codice.trim()

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
            <CategoryCombobox
              value={cliente}
              onChange={setCliente}
              onConfirm={() => {}}
              options={clientiOptions}
              placeholder="Cerca cliente esistente o creane uno nuovo..."
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">
              Codice univoco *
              <span className="ml-2 text-xs font-normal text-[#64748B]">modificabile</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codice}
                onChange={e => handleCodiceChange(e.target.value)}
                placeholder="Es. KL0042PQ o EV2024AB"
                maxLength={20}
                className={`flex-1 border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${
                  codiceError ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                }`}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button
                type="button"
                onClick={rigenera}
                title="Genera nuovo codice"
                className="p-2.5 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E3A5F] transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {codiceError && <p className="mt-1.5 text-xs text-[#EF4444]">{codiceError}</p>}
            <p className="mt-1.5 text-xs text-[#94A3B8]">
              Generato automaticamente — puoi modificarlo o usare un ID già presente nelle fatture importate
            </p>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-[#EF4444]">{err}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annulla
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
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
