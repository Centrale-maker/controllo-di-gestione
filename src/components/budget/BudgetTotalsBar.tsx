import { Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BudgetDetailData } from '@/hooks/useBudgetDetail'

interface Props {
  detail: BudgetDetailData
  totaleCosti: number
  totaleRicavi: number
}

export default function BudgetTotalsBar({ detail, totaleCosti, totaleRicavi }: Props) {
  const margine = totaleRicavi - totaleCosti
  const marginePerc = totaleRicavi > 0 ? (margine / totaleRicavi) * 100 : 0
  const bloccato = detail.totale_bloccato ?? 0
  const scostamento = totaleRicavi - bloccato

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-[#1E3A5F] text-white border-t border-white/10 safe-area-pb">
      <div className="flex items-center divide-x divide-white/10 overflow-x-auto px-4 py-3 gap-0">
        <div className="flex flex-col items-start pr-4 shrink-0">
          <span className="text-[10px] text-white/50 uppercase tracking-wide">Totale Costi</span>
          <span className="text-base font-bold text-red-300 mt-0.5">{formatCurrency(totaleCosti)}</span>
        </div>
        <div className="flex flex-col items-start px-4 shrink-0">
          <span className="text-[10px] text-white/50 uppercase tracking-wide">Totale Ricavi</span>
          <span className="text-base font-bold text-emerald-300 mt-0.5">{formatCurrency(totaleRicavi)}</span>
        </div>
        <div className="flex flex-col items-start px-4 shrink-0">
          <span className="text-[10px] text-white/50 uppercase tracking-wide">Margine</span>
          <span className="text-base font-bold mt-0.5">{marginePerc.toFixed(1)}%</span>
        </div>
        {detail.preventivo_bloccato && (
          <div className="flex flex-col items-start px-4 shrink-0">
            <span className="text-[10px] text-amber-300/70 uppercase tracking-wide flex items-center gap-1">
              <Lock size={9} /> Preventivo cliente
            </span>
            <span className="text-base font-bold text-amber-300 mt-0.5">{formatCurrency(bloccato)}</span>
            {scostamento !== 0 && (
              <span className={`text-[10px] mt-0.5 ${scostamento > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {scostamento > 0 ? '+' : ''}{formatCurrency(scostamento)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
