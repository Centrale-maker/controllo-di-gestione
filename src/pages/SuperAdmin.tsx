import { useEffect, useState } from 'react'
import { Plus, Building2, Users, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types'
import CreateCompanyModal from '@/components/superadmin/CreateCompanyModal'
import CompanyUsersPanel from '@/components/superadmin/CompanyUsersPanel'

const PLAN_BADGE: Record<string, string> = {
  trial:      'bg-[#F59E0B]/10 text-[#F59E0B]',
  pro:        'bg-[#10B981]/10 text-[#10B981]',
  enterprise: 'bg-[#1E3A5F]/10 text-[#1E3A5F]',
}

interface CompanyWithCount extends Company {
  user_count: number
}

export default function SuperAdmin() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([])
  const [selected, setSelected] = useState<Company | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data: cos } = await supabase.from('companies').select('*').order('created_at')
    if (!cos) { setLoading(false); return }

    const withCounts = await Promise.all(
      (cos as Company[]).map(async co => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', co.id)
        return { ...co, user_count: count ?? 0 }
      })
    )
    setCompanies(withCounts)
    if (!selected) setSelected(withCounts[0] ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteCompany(co: CompanyWithCount) {
    if (!confirm(`Eliminare "${co.name}" e tutti i suoi dati? Questa azione è irreversibile.`)) return
    await supabase.from('companies').delete().eq('id', co.id)
    setCompanies(prev => prev.filter(c => c.id !== co.id))
    if (selected?.id === co.id) setSelected(null)
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#1A202C]">Super Admin</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Gestione aziende e accessi</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] transition-colors"
        >
          <Plus size={15} />
          Nuova azienda
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Lista aziende */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
            <Building2 size={14} className="text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1A202C]">Aziende</span>
            <span className="ml-auto text-xs text-[#64748B]">{companies.length}</span>
          </div>

          {loading && (
            <div className="px-4 py-8 text-center text-sm text-[#64748B]">Caricamento...</div>
          )}

          <div className="divide-y divide-[#F1F5F9]">
            {companies.map(co => (
              <button
                key={co.id}
                onClick={() => setSelected(co)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors ${
                  selected?.id === co.id ? 'bg-[#EFF6FF] border-l-2 border-[#3B82F6]' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[#1E3A5F]">
                    {co.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A202C] truncate">{co.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${PLAN_BADGE[co.plan] ?? ''}`}>
                      {co.plan}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-[#64748B]">
                      <Users size={10} /> {co.user_count}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteCompany(co) }}
                  className="w-6 h-6 flex items-center justify-center rounded text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors shrink-0 mt-1"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Panel utenti dell'azienda selezionata */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] min-h-[400px] overflow-hidden">
          {selected ? (
            <CompanyUsersPanel key={selected.id} company={selected} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-[#64748B]">
              <Building2 size={32} className="opacity-30 mb-3" />
              <p className="text-sm">Seleziona un'azienda</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onCreated={co => {
            setShowCreate(false)
            const withCount = { ...co, user_count: 0 }
            setCompanies(prev => [...prev, withCount])
            setSelected(co)
          }}
        />
      )}
    </div>
  )
}
