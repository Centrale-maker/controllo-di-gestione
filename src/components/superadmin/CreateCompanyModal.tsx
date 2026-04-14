import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Company, CompanyPlan } from '@/types'

interface Props {
  onClose: () => void
  onCreated: (company: Company) => void
}

const PLANS: { value: CompanyPlan; label: string }[] = [
  { value: 'trial', label: 'Trial' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

export default function CreateCompanyModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [plan, setPlan] = useState<CompanyPlan>('trial')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function derivSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleName(value: string) {
    setName(value)
    setSlug(derivSlug(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('companies')
        .insert({ name: name.trim(), slug: slug || null, plan })
        .select('*')
        .single()
      if (err) throw new Error(err.message)
      onCreated(data as Company)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-[#1A202C]">Nuova azienda</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Nome azienda</label>
            <input
              value={name}
              onChange={e => handleName(e.target.value)}
              placeholder="Acme S.r.l."
              required
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Slug (URL)</label>
            <input
              value={slug}
              onChange={e => setSlug(derivSlug(e.target.value))}
              placeholder="acme"
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Piano</label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value as CompanyPlan)}
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:bg-[#F8FAFC]">
              Annulla
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-11 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] disabled:opacity-60">
              {loading ? 'Creazione...' : 'Crea azienda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
