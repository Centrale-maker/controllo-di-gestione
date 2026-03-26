import { useEffect, useState } from 'react'
import { UserPlus, Pencil, Trash2, Check, X, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { supabaseSignup } from '@/lib/supabaseAdmin'
import type { Profile } from '@/types'

// ─── Lista utenti ─────────────────────────────────────────────────────────────

function UserList({ refreshKey }: { refreshKey: number }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    if (data) setProfiles(data as Profile[])
  }

  useEffect(() => { load() }, [refreshKey])

  function startEdit(p: Profile) {
    setEditing(p.id)
    setEditName(p.full_name ?? '')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: editName.trim() }).eq('id', id)
    setSaving(false)
    setEditing(null)
    load()
  }

  async function deleteUser(p: Profile) {
    if (!confirm(`Eliminare "${p.full_name ?? p.id}"? L'utente non potrà più accedere all'app.`)) return
    await supabase.from('profiles').delete().eq('id', p.id)
    load()
  }

  if (profiles.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1A202C]">Utenti registrati</h3>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {profiles.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            {editing === p.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 h-8 px-2 rounded-lg border border-[#3B82F6] text-sm text-[#1A202C] focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(p.id)}
                  disabled={saving}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#10B981] text-white"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B]"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A202C] truncate">{p.full_name ?? '—'}</p>
                </div>
                <button
                  onClick={() => startEdit(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteUser(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Form nuovo utente ────────────────────────────────────────────────────────

const INITIAL = { nome: '', email: '', password: '', conferma: '' }

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function setField(key: keyof typeof INITIAL, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.conferma) return setError('Le password non coincidono.')
    if (form.password.length < 6) return setError('Password minimo 6 caratteri.')

    setLoading(true)
    try {
      const { data, error: signupError } = await supabaseSignup.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      })
      if (signupError) throw new Error(signupError.message)
      if (!data.user) throw new Error('Utente non creato.')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, full_name: form.nome.trim(), role: 'viewer' })
      if (profileError) throw new Error(profileError.message)

      setSuccess(true)
      setForm(INITIAL)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <div className="flex items-center gap-2 mb-5">
        <UserPlus size={16} className="text-[#64748B]" />
        <h3 className="text-sm font-semibold text-[#1A202C]">Crea nuovo utente</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'nome', label: 'Nome completo', type: 'text', placeholder: 'Mario Rossi' },
          { key: 'email', label: 'Email', type: 'email', placeholder: 'mario@italianglobalsolution.it' },
          { key: 'password', label: 'Password', type: 'password', placeholder: 'Minimo 6 caratteri' },
          { key: 'conferma', label: 'Conferma password', type: 'password', placeholder: 'Ripeti la password' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-[#1A202C] mb-1.5">{f.label}</label>
            <input
              type={f.type}
              value={form[f.key as keyof typeof INITIAL]}
              onChange={e => setField(f.key as keyof typeof INITIAL, e.target.value)}
              placeholder={f.placeholder}
              required
              className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>
        ))}

        {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-sm text-[#10B981]">
            <CheckCircle size={16} /> Utente creato con successo!
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
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function Settings() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-base font-semibold text-[#1A202C]">Impostazioni</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Gestione accessi</p>
      </div>

      <UserList refreshKey={refreshKey} />
      <CreateUserForm onCreated={() => setRefreshKey(k => k + 1)} />
    </div>
  )
}
