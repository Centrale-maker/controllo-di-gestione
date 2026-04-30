import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, Search } from 'lucide-react'
import { useBudgets } from '@/hooks/useBudgets'
import BudgetCard from '@/components/budget/BudgetCard'
import NewBudgetDialog from '@/components/budget/NewBudgetDialog'

export default function Budget() {
  const { budgets, loading, error } = useBudgets()
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = budgets.filter(b =>
    !search ||
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    b.cliente.toLowerCase().includes(search.toLowerCase()) ||
    b.codice.toLowerCase().includes(search.toLowerCase())
  )

  function handleCreated(id: string) {
    setShowNew(false)
    navigate(`/budget/${id}`)
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1A202C]">Budget</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Preventivi e pianificazione costi/ricavi</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-[#1E3A5F] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2E5F8A] transition-colors shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nuovo Budget</span>
          <span className="sm:hidden">Nuovo</span>
        </button>
      </div>

      {/* Ricerca */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per cliente, nome evento o codice..."
          className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-white"
        />
      </div>

      {/* Stato */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#94A3B8]" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-4">
            <Plus size={24} className="text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#1A202C]">
            {search ? 'Nessun budget trovato' : 'Nessun budget ancora'}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {search ? 'Prova con un termine diverso' : 'Crea il primo preventivo per iniziare'}
          </p>
          {!search && (
            <button
              onClick={() => setShowNew(true)}
              className="mt-4 flex items-center gap-2 bg-[#1E3A5F] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2E5F8A]"
            >
              <Plus size={15} /> Crea il primo budget
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(b => <BudgetCard key={b.id} b={b} />)}
        </div>
      )}

      {showNew && (
        <NewBudgetDialog
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
