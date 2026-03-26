import { useEffect, useState } from 'react'
import { UserPlus, Users, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { supabaseSignup } from '@/lib/supabaseAdmin'
import type { Profile } from '@/types'

function UserList() {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at').then(({ data }) => {
      if (data) setProfiles(data as Profile[])
    })
  }, [])

  if (profiles.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
        <Users size={16} className="text-[#64748B]" />
        <h3 className="text-sm font-semibold text-[#1A202C]">Utenti registrati</h3>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {profiles.map(p => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#1A202C]">{p.full_name ?? '—'}</p>
              <p className="text-xs text-[#64748B] capitalize">{p.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const INITIAL_FORM = { nome: '', email: '', password: '', conferma: '' }

export default function Settings() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function setField(key: keyof typeof INITIAL_FORM, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.conferma) {
      setError('Le password non coincidono.')
      return
    }
    if (form.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Crea l'utente con il client separato (non tocca la sessione admin)
      const { data, error: signupError } = await supabaseSignup.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      })
      if (signupError) throw new Error(signupError.message)
      if (!data.user) throw new Error('Utente non creato.')

      // Inserisce il profilo manualmente (trigger rimosso in precedenza)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, full_name: form.nome.trim(), role: 'viewer' })
      if (profileError) throw new Error(profileError.message)

      setSuccess(true)
      setForm(INITIAL_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-base font-semibold text-[#1A202C]">Impostazioni</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Gestione accessi</p>
      </div>

      <UserList />

      {/* Form nuovo utente */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus size={16} className="text-[#64748B]" />
          <h3 className="text-sm font-semibold text-[#1A202C]">Crea nuovo utente</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setField('nome', e.target.value)}
              placeholder="Mario Rossi"
              required
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              placeholder="mario@italianglobalsolution.it"
              required
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setField('password', e.target.value)}
              placeholder="Minimo 6 caratteri"
              required
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">Conferma password</label>
            <input
              type="password"
              value={form.conferma}
              onChange={e => setField('conferma', e.target.value)}
              placeholder="Ripeti la password"
              required
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          {success && (
            <div className="flex items-center gap-2 text-sm text-[#10B981]">
              <CheckCircle size={16} />
              Utente creato con successo!
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creazione in corso...' : 'Crea utente'}
          </button>
        </form>
      </div>
    </div>
  )
}
