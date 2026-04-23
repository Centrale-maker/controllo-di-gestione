import { useState } from 'react'
import { X, Pencil, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Purchase } from '@/types'
import type { FacetedOptions } from '@/hooks/useFacetedOptions'

export type RowPatch = Partial<Pick<Purchase, 'cc_tipo' | 'cc_sede' | 'cc_cliente' | 'categoria' | 'targhe'>>

interface Props {
  purchase: Purchase | null
  options:  FacetedOptions
  onSave:   (id: string, patch: RowPatch) => Promise<void>
  onClose:  () => void
}

const TARGA_RE = /^[A-Z]{2}\d{3}[A-Z]{2}$/

// ─── Select field ─────────────────────────────────────────────────────────────
function SelectField({ label, value, opts, onChange }: {
  label: string
  value: string | null
  opts: string[]
  onChange: (v: string | null) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1">{label}</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
      >
        <option value="">— Nessuno —</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── Targhe editor ────────────────────────────────────────────────────────────
function TargheEditor({ value, onChange }: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState(false)

  function add() {
    const t = input.toUpperCase().trim()
    if (!TARGA_RE.test(t)) { setInputError(true); return }
    if (!value.includes(t)) onChange([...value, t])
    setInput('')
    setInputError(false)
  }

  function remove(t: string) {
    onChange(value.filter(x => x !== t))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1">Targhe</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E3A5F] text-xs font-medium">
            {t}
            <button type="button" onClick={() => remove(t)} className="hover:text-[#EF4444] transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-[#64748B]">Nessuna targa</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          placeholder="es. AB123CD"
          maxLength={7}
          onChange={e => { setInput(e.target.value.toUpperCase()); setInputError(false) }}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          className={`flex-1 h-9 px-3 rounded-lg border text-sm text-[#1A202C] uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${
            inputError ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
          }`}
        />
        <button
          type="button"
          onClick={add}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B]"
        >
          <Plus size={16} />
        </button>
      </div>
      {inputError && <p className="text-xs text-[#EF4444] mt-1">Formato non valido (es. AB123CD)</p>}
    </div>
  )
}

// ─── Modal principale ─────────────────────────────────────────────────────────
export default function RowEditModal({ purchase, options, onSave, onClose }: Props) {
  const [patch, setPatch] = useState<RowPatch>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!purchase) return null

  // Valore corrente (patch sovrascrive se modificato)
  function cur<K extends keyof RowPatch>(key: K): RowPatch[K] {
    return key in patch ? patch[key] : (purchase![key] as RowPatch[K])
  }

  function set<K extends keyof RowPatch>(key: K, val: RowPatch[K]) {
    setPatch(p => ({ ...p, [key]: val }))
  }

  async function handleSave() {
    if (Object.keys(patch).length === 0) { onClose(); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(purchase!.id, patch)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center shrink-0">
              <Pencil size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#1A202C] truncate">{purchase.fornitore}</h2>
              <p className="text-xs text-[#64748B]">{formatDate(purchase.data)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] shrink-0">
            <X size={17} />
          </button>
        </div>

        {/* Campi */}
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Centro di costo" value={cur('cc_tipo')    ?? null} opts={options.ccTipo}    onChange={v => set('cc_tipo', v)} />
            <SelectField label="Cliente"        value={cur('cc_cliente') ?? null} opts={options.ccCliente} onChange={v => set('cc_cliente', v)} />
            <SelectField label="ID Univoco"     value={cur('cc_sede')    ?? null} opts={options.ccSede}    onChange={v => set('cc_sede', v)} />
            <SelectField label="Categoria" value={cur('categoria') ?? null} opts={options.categoria}  onChange={v => set('categoria', v)} />
          </div>
          <TargheEditor
            value={cur('targhe') ?? []}
            onChange={v => set('targhe', v.length > 0 ? v : null)}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E2E8F0]">
          {error && <p className="text-xs text-[#EF4444] mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]">
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
