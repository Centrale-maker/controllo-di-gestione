import { useMemo, useState } from 'react'
import { useCommesse } from '@/hooks/useCommesse'
import CommesseChart from '@/components/charts/CommesseChart'
import CommessaDetailModal from '@/components/charts/CommessaDetailModal'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Search, X } from 'lucide-react'
import type { Commessa } from '@/types'

// ─── Icone margine ────────────────────────────────────────────────────────────

function MargineIcon({ perc }: { perc: number }) {
  if (perc > 15) return <TrendingUp size={14} className="text-[#10B981]" />
  if (perc < 0)  return <TrendingDown size={14} className="text-[#EF4444]" />
  return <Minus size={14} className="text-[#F59E0B]" />
}

function MargineCell({ perc }: { perc: number }) {
  const color = perc > 15 ? 'text-[#10B981]' : perc < 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'
  return (
    <span className={`flex items-center gap-1 font-medium ${color}`}>
      <MargineIcon perc={perc} />
      {perc.toFixed(1)}%
    </span>
  )
}

// ─── Filtro pills ─────────────────────────────────────────────────────────────

function FilterPills({
  label,
  options,
  selected,
  onChange,
  color = '#1E3A5F',
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  color?: string
}) {
  if (options.length === 0) return null

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[#64748B] shrink-0">{label}:</span>
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'text-white border-transparent'
                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
            }`}
            style={active ? { backgroundColor: color, borderColor: color } : {}}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── Mostra toggle ────────────────────────────────────────────────────────────

type Mostra = 'tutti' | 'con_ricavi' | 'solo_costi'

function MostraToggle({ value, onChange }: { value: Mostra; onChange: (v: Mostra) => void }) {
  const opts: { key: Mostra; label: string }[] = [
    { key: 'tutti',      label: 'Tutti' },
    { key: 'con_ricavi', label: 'Con ricavi' },
    { key: 'solo_costi', label: 'Solo costi' },
  ]
  return (
    <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === o.key ? 'bg-white text-[#1A202C] shadow-sm' : 'text-[#64748B] hover:text-[#1A202C]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Applica filtri ───────────────────────────────────────────────────────────

function applyFilters(
  commesse: Commessa[],
  search: string,
  crTipo: string[],
  ccTipo: string[],
  clienti: string[],
  mostra: Mostra,
): Commessa[] {
  return commesse.filter(c => {
    if (mostra === 'con_ricavi' && c.ricavi === 0) return false
    if (mostra === 'solo_costi' && c.ricavi > 0)  return false
    if (crTipo.length > 0 && (!c.crTipo || !crTipo.includes(c.crTipo))) return false
    if (ccTipo.length > 0 && (!c.ccTipo || !ccTipo.includes(c.ccTipo))) return false
    if (clienti.length > 0 && (!c.cliente || !clienti.includes(c.cliente))) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const match =
        c.id.toLowerCase().includes(q) ||
        c.nome.toLowerCase().includes(q) ||
        (c.cliente?.toLowerCase().includes(q) ?? false) ||
        (c.crTipo?.toLowerCase().includes(q) ?? false) ||
        (c.ccTipo?.toLowerCase().includes(q) ?? false)
      if (!match) return false
    }
    return true
  })
}

// ─── Vista principale ─────────────────────────────────────────────────────────

export default function CommesseView() {
  const { commesse, options, loading, error } = useCommesse()

  const [search, setSearch]       = useState('')
  const [crTipo, setCrTipo]       = useState<string[]>([])
  const [ccTipo, setCcTipo]       = useState<string[]>([])
  const [clienti, setClienti]     = useState<string[]>([])
  const [mostra, setMostra]       = useState<Mostra>('tutti')
  const [chartPage, setChartPage] = useState(0)
  const [detailId, setDetailId]   = useState<string | null>(null)

  const filtered = useMemo(
    () => applyFilters(commesse, search, crTipo, ccTipo, clienti, mostra),
    [commesse, search, crTipo, ccTipo, clienti, mostra],
  )

  const activeCount = crTipo.length + ccTipo.length + clienti.length + (search ? 1 : 0) + (mostra !== 'tutti' ? 1 : 0)

  function resetAll() {
    setSearch('')
    setCrTipo([])
    setCcTipo([])
    setClienti([])
    setMostra('tutti')
    setChartPage(0)
  }

  const totRicavi  = filtered.reduce((s, c) => s + c.ricavi, 0)
  const totCosti   = filtered.reduce((s, c) => s + c.costi, 0)
  const totMargine = totRicavi - totCosti
  const totPerc    = totRicavi > 0 ? (totMargine / totRicavi) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) return <p className="text-sm text-[#EF4444] p-4">{error}</p>

  return (
    <div className="space-y-4">

      {/* ── Barra filtri ── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
        {/* Riga 1: search + mostra + reset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per ID, nome, cliente…"
              className="w-full pl-8 pr-3 h-9 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                <X size={13} />
              </button>
            )}
          </div>
          <MostraToggle value={mostra} onChange={setMostra} />
          {activeCount > 0 && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#EF4444] transition-colors"
            >
              <X size={13} /> Azzera ({activeCount})
            </button>
          )}
        </div>

        {/* Riga 2: pills centro di ricavo */}
        <FilterPills
          label="Centro ricavo"
          options={options.crTipo}
          selected={crTipo}
          onChange={setCrTipo}
          color="#10B981"
        />

        {/* Riga 3: pills centro di costo */}
        <FilterPills
          label="Centro costo"
          options={options.ccTipo}
          selected={ccTipo}
          onChange={setCcTipo}
          color="#1E3A5F"
        />

        {/* Riga 4: pills cliente */}
        <FilterPills
          label="Cliente"
          options={options.clienti}
          selected={clienti}
          onChange={setClienti}
          color="#3B82F6"
        />
      </div>

      {/* ── KPI sui dati filtrati ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Totale ricavi',  value: formatCurrency(totRicavi),  color: 'text-[#10B981]' },
          { label: 'Totale costi',   value: formatCurrency(totCosti),   color: 'text-[#EF4444]' },
          { label: 'Margine lordo',  value: formatCurrency(totMargine), color: totMargine >= 0 ? 'text-[#1A202C]' : 'text-[#EF4444]' },
          { label: 'Margine %',      value: `${totPerc.toFixed(1)}%`,   color: totPerc > 15 ? 'text-[#10B981]' : 'text-[#F59E0B]' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
            <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">{k.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && commesse.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <p className="text-sm text-[#64748B]">Nessuna commessa trovata.</p>
          <p className="text-xs text-[#64748B] mt-1">
            Importa le fatture attive da <strong>Upload Ricavi</strong> e assicurati che l&apos;ID univoco
            nel campo &quot;Centro ricavo&quot; corrisponda a quello del &quot;Centro costo&quot; delle passive.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
          <p className="text-sm text-[#64748B]">Nessun risultato per i filtri selezionati.</p>
          <button onClick={resetAll} className="mt-2 text-xs text-[#1E3A5F] underline">Azzera filtri</button>
        </div>
      ) : (
        <>
          {/* Grafico */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1A202C]">Ricavi vs Costi per commessa</h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Clicca su una colonna per il dettaglio dare/avere</p>
              </div>
              <span className="text-xs text-[#64748B]">{filtered.length} commesse</span>
            </div>
            <CommesseChart
              data={filtered}
              page={chartPage}
              onPageChange={setChartPage}
              onBarClick={setDetailId}
            />
          </div>

          {/* Tabella */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Progetto / Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide hidden md:table-cell">Centro ricavo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide hidden md:table-cell">Centro costo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ricavi</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Costi</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Margine</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide hidden lg:table-cell">%</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => setDetailId(c.id)}
                      className={`border-b border-[#F1F5F9] hover:bg-[#EFF6FF] cursor-pointer transition-colors ${i % 2 !== 0 ? 'bg-[#FAFBFC]' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-[#EFF6FF] text-[#1E40AF] rounded px-1.5 py-0.5">{c.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A202C]">{c.nome}</p>
                        {c.cliente && c.cliente !== c.nome && (
                          <p className="text-xs text-[#64748B]">{c.cliente}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {c.crTipo
                          ? <span className="text-xs bg-[#ECFDF5] text-[#065F46] rounded-full px-2 py-0.5">{c.crTipo}</span>
                          : <span className="text-[#94A3B8] text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {c.ccTipo
                          ? <span className="text-xs bg-[#EFF6FF] text-[#1E40AF] rounded-full px-2 py-0.5">{c.ccTipo}</span>
                          : <span className="text-[#94A3B8] text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#10B981]">
                        {c.ricavi > 0 ? formatCurrency(c.ricavi) : <span className="text-[#94A3B8]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#EF4444]">
                        {formatCurrency(c.costi)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {c.ricavi > 0
                          ? <span className={c.margine >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>{formatCurrency(c.margine)}</span>
                          : <span className="text-[#94A3B8]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {c.ricavi > 0 ? <MargineCell perc={c.marginePerc} /> : <span className="text-[#94A3B8]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <CommessaDetailModal
        commessaId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
