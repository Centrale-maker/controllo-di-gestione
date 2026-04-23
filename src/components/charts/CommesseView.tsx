import { useCommesse } from '@/hooks/useCommesse'
import CommesseChart from '@/components/charts/CommesseChart'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

export default function CommesseView() {
  const { commesse, loading, error } = useCommesse()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-[#EF4444] p-4">{error}</p>
  }

  const withRevenues = commesse.filter(c => c.ricavi > 0 || c.costi > 0)

  const totRicavi  = withRevenues.reduce((s, c) => s + c.ricavi, 0)
  const totCosti   = withRevenues.reduce((s, c) => s + c.costi, 0)
  const totMargine = totRicavi - totCosti
  const totPerc    = totRicavi > 0 ? (totMargine / totRicavi) * 100 : 0

  return (
    <div className="space-y-6">
      {/* KPI totali */}
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

      {withRevenues.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <p className="text-sm text-[#64748B]">Nessuna commessa trovata.</p>
          <p className="text-xs text-[#64748B] mt-1">
            Importa le fatture attive da <strong>Upload Ricavi</strong> e assicurati che l&apos;ID univoco nel campo
            &quot;Centro ricavo&quot; corrisponda a quello del campo &quot;Centro costo&quot; delle fatture passive.
          </p>
        </div>
      ) : (
        <>
          {/* Grafico */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <h3 className="text-sm font-semibold text-[#1A202C] mb-4">Ricavi vs Costi per commessa</h3>
            <CommesseChart data={withRevenues} />
          </div>

          {/* Tabella */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Progetto / Cliente</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ricavi</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Costi</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Margine</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Margine %</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">FT</th>
                  </tr>
                </thead>
                <tbody>
                  {withRevenues.map((c, i) => (
                    <tr key={c.id} className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FAFBFC]'}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-[#EFF6FF] text-[#1E40AF] rounded px-1.5 py-0.5">{c.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A202C]">{c.nome}</p>
                        {c.cliente && c.cliente !== c.nome && (
                          <p className="text-xs text-[#64748B]">{c.cliente}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#10B981]">
                        {c.ricavi > 0 ? formatCurrency(c.ricavi) : <span className="text-[#94A3B8]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#EF4444]">
                        {formatCurrency(c.costi)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {c.ricavi > 0 ? (
                          <span className={c.margine >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                            {formatCurrency(c.margine)}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.ricavi > 0 ? <MargineCell perc={c.marginePerc} /> : <span className="text-[#94A3B8]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#64748B]">
                        {c.nFattureAtt > 0 && <span className="text-[#10B981]">+{c.nFattureAtt}</span>}
                        {c.nFatturePas > 0 && <span className="text-[#EF4444] ml-1">-{c.nFatturePas}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
