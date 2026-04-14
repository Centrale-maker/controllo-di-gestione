import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { supabaseSignup } from '@/lib/supabaseAdmin'
import type { Company, UserRole } from '@/types'

interface Props {
  company: Company
  onClose: () => void
  onCreated: () => void
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

const INITIAL = { nome: '', email: '', password: '', role: 'editor' as UserRole }

export default function CreateUserModal({ company, onClose, onCreated }: Props) {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) return setError('Password minimo 6 caratteri.')
    setLoading(true)
    setError(null)

    try {
      const { data, error: signupError } = await supabaseSignup.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.nome.trim(),
            role: form.role,
            company_id: company.id,
          },
        },
      })
      if (signupError) throw new Error(signupError.message)
      if (!data.user) throw new Error('Utente non creato.')

      // Upsert profile: il trigger potrebbe averlo già creato
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, full_name: form.nome.trim(), role: form.role, company_id: company.id },
          { onConflict: 'id' }
        )
      if (profileError) throw new Error(profileError.message)

      onCreated()
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
          <div>
            <h2 className="text-sm font-semibold text-[#1A202C]">Nuovo utente</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{company.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[
            { key: 'nome', label: 'Nome completo', type: 'text', placeholder: 'Mario Rossi' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'mario@azienda.it' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Minimo 6 caratteri' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-[#1A202C] mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as 'nome' | 'email' | 'password']}
                onChange={e => setField(f.key as 'nome' | 'email' | 'password', e.target.value)}
                placeholder={f.placeholder}
                required
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Ruolo</label>
            <select
              value={form.role}
              onChange={e => setField('role', e.target.value as UserRole)}
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
              {loading ? 'Creazione...' : 'Crea utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
