import { useEffect, useState } from 'react'
import { UserPlus, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Company, Profile, UserRole } from '@/types'
import CreateUserModal from './CreateUserModal'

interface Props {
  company: Company
}

const ROLES: UserRole[] = ['admin', 'editor', 'viewer']

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-[#1E3A5F] text-white',
  editor: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  viewer: 'bg-[#F1F5F9] text-[#64748B]',
}

export default function CompanyUsersPanel({ company }: Props) {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at')
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [company.id])

  async function changeRole(userId: string, role: UserRole) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  async function deleteUser(user: Profile) {
    if (!confirm(`Eliminare "${user.full_name ?? user.id}"? L'utente non potrà più accedere.`)) return
    await supabase.from('profiles').delete().eq('id', user.id)
    setUsers(prev => prev.filter(u => u.id !== user.id))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-semibold text-[#1A202C]">Utenti</h3>
          <p className="text-xs text-[#64748B] truncate max-w-[200px]">{company.name}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#1E3A5F] text-white text-xs font-medium hover:bg-[#2E5F8A] transition-colors"
        >
          <UserPlus size={13} />
          Aggiungi
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
        {loading && (
          <div className="px-4 py-8 text-center text-sm text-[#64748B]">Caricamento...</div>
        )}
        {!loading && users.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#64748B]">Nessun utente</div>
        )}
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#1E3A5F]">
                {u.full_name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A202C] truncate">{u.full_name ?? '—'}</p>
            </div>
            <div className="relative">
              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value as UserRole)}
                className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs font-medium cursor-pointer ${ROLE_COLORS[u.role] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60" />
            </div>
            <button
              onClick={() => deleteUser(u)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateUserModal
          company={company}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}
