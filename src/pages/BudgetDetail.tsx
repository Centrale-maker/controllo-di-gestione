import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Lock, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useBudgetDetail } from '@/hooks/useBudgetDetail'
import { formatCurrency, formatDate } from '@/lib/utils'
import BudgetCentroSection from '@/components/budget/BudgetCentroSection'
import BudgetTotalsBar from '@/components/budget/BudgetTotalsBar'
import ConsuntivoTab from '@/components/budget/ConsuntivoTab'

const STATI = ['bozza', 'inviato', 'confermato', 'chiuso'] as const
const STATO_LABEL: Record<string, string> = { bozza: 'Bozza', inviato: 'Inviato', confermato: 'Confermato', chiuso: 'Chiuso' }

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { company } = useAuth()
  const { detail, loading, error, reload } = useBudgetDetail(id ?? null)
  const [tab, setTab] = useState<'preventivo' | 'consuntivo'>('preventivo')
  const [addingCentro, setAddingCentro] = useState(false)
  const [nuovoCentroNome, setNuovoCentroNome] = useState('')
  const [locking, setLocking] = useState(false)
  const [showLockConfirm, setShowLockConfirm] = useState(false)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-[#94A3B8]" />
    </div>
  )
  if (error || !detail) return (
    <div className="p-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
        <AlertCircle size={18} className="text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{error ?? 'Budget non trovato'}</p>
      </div>
    </div>
  )

  const d = detail
  const totaleCosti = d.centri.flatMap(c => c.voci).reduce((s, v) => s + Number(v.costo_stimato), 0)
  const totaleRicavi = d.centri.flatMap(c => c.voci).reduce((s, v) => s + Number(v.prezzo_vendita), 0)

  async function updateStato(stato: string) {
    await supabase.from('budgets').update({ stato, updated_at: new Date().toISOString() }).eq('id', d.id)
    reload()
  }

  async function addCentro() {
    if (!nuovoCentroNome.trim() || !company?.id) return
    setAddingCentro(true)
    await supabase.from('budget_centri').insert({
      budget_id: d.id,
      company_id: company.id,
      nome: nuovoCentroNome.trim(),
      sort_order: d.centri.length,
    })
    setNuovoCentroNome('')
    setAddingCentro(false)
    reload()
  }

  async function lockPreventivo() {
    setLocking(true)
    await supabase.from('budgets').update({
      preventivo_bloccato: true,
      totale_bloccato: totaleRicavi,
      bloccato_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', d.id)
    setShowLockConfirm(false)
    setLocking(false)
    reload()
  }

  return (
    <div className="pb-28">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => navigate('/budget')} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
            <ArrowLeft size={20} />
          </button>
          <span className="font-mono text-sm font-bold text-[#1E3A5F] bg-[#EFF6FF] px-2.5 py-1 rounded-lg">
            {d.codice}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1A202C] truncate">{d.nome}</p>
            <p className="text-xs text-[#64748B] truncate">{d.cliente}</p>
          </div>
          <select
            value={d.stato}
            onChange={e => updateStato(e.target.value)}
            className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] shrink-0"
          >
            {STATI.map(s => <option key={s} value={s}>{STATO_LABEL[s]}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 max-w-4xl mx-auto">
          {(['preventivo', 'consuntivo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-[#1E3A5F] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              {t === 'preventivo' ? 'Preventivo' : 'Consuntivo'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-4xl mx-auto">
        {tab === 'preventivo' && (
          <div className="space-y-3">
            {/* Lock banner */}
            {d.preventivo_bloccato ? (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
                <Lock size={16} className="text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Preventivo comunicato: {formatCurrency(d.totale_bloccato ?? 0)}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">Bloccato il {formatDate(d.bloccato_at)} — i ricavi stimati restano invariati</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <p className="text-xs text-[#64748B]">
                  Blocca il totale ricavi quando invii il preventivo al cliente.
                  Da quel momento resterà fisso anche se modifichi il budget.
                </p>
                <button
                  onClick={() => setShowLockConfirm(true)}
                  disabled={totaleRicavi === 0}
                  className="flex items-center gap-1.5 shrink-0 px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  <Lock size={13} /> Blocca preventivo
                </button>
              </div>
            )}

            {/* Centri */}
            {d.centri.map(c => (
              <BudgetCentroSection key={c.id} centro={c} onRefresh={reload} />
            ))}

            {/* Aggiungi centro */}
            <div className="bg-white rounded-xl border border-dashed border-[#CBD5E1] p-4">
              <p className="text-sm font-medium text-[#1A202C] mb-3">Aggiungi centro di costo</p>
              <div className="flex gap-2">
                <input
                  value={nuovoCentroNome}
                  onChange={e => setNuovoCentroNome(e.target.value)}
                  placeholder="Es. Catering, Allestimento, Logistica..."
                  className="flex-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  onKeyDown={e => e.key === 'Enter' && addCentro()}
                />
                <button
                  onClick={addCentro}
                  disabled={addingCentro || !nuovoCentroNome.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#2E5F8A] disabled:opacity-40"
                >
                  {addingCentro ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'consuntivo' && <ConsuntivoTab detail={detail} />}
      </div>

      {/* Totals bar (solo in preventivo) */}
      {tab === 'preventivo' && (
        <BudgetTotalsBar detail={detail} totaleCosti={totaleCosti} totaleRicavi={totaleRicavi} />
      )}

      {/* Modal conferma lock */}
      {showLockConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-[#1A202C]">Blocca preventivo</p>
                <p className="text-xs text-[#64748B]">Azione irreversibile</p>
              </div>
            </div>
            <p className="text-sm text-[#64748B] mb-2">
              Stai per comunicare al cliente un totale di:
            </p>
            <p className="text-2xl font-bold text-[#1E3A5F] mb-4">{formatCurrency(totaleRicavi)}</p>
            <p className="text-xs text-[#64748B] mb-5">
              Da questo momento il totale ricavi resterà fisso anche se modifichi le voci del budget.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLockConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B]">
                Annulla
              </button>
              <button
                onClick={lockPreventivo}
                disabled={locking}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 flex items-center justify-center gap-2"
              >
                {locking && <Loader2 size={14} className="animate-spin" />}
                Conferma blocco
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
