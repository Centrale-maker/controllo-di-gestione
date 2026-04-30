import { TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BudgetDetailData } from '@/hooks/useBudgetDetail'

function Delta({ stimato, reale }: { stimato: number; reale: number }) {
  if (reale === 0 && stimato === 0) return <span className="text-[#94A3B8]">—</span>
  const delta = reale - stimato
  const ok = delta <= 0
  const Icon = delta === 0 ? Minus : ok ? TrendingDown : TrendingUp
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon size={12} />
      {delta > 0 ? '+' : ''}{formatCurrency(delta)}
    </span>
  )
}

function ProgressBar({ stimato, reale }: { stimato: number; reale: number }) {
  if (stimato === 0) return null
  const pct = Math.min((reale / stimato) * 100, 120)
  const over = pct > 100
  return (
    <div className="mt-1.5 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-emerald-400'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

export default function ConsuntivoTab({ detail }: { detail: BudgetDetailData }) {
  const { consuntivo } = detail

  if (!consuntivo.has_data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <AlertCircle size={32} className="text-[#94A3B8] mb-3" />
        <p className="text-sm font-medium text-[#1A202C]">Nessuna fattura collegata</p>
        <p className="text-xs text-[#64748B] mt-1 max-w-xs">
          Importa fatture passive o attive con codice <strong className="font-mono">{detail.codice}</strong> nel centro di costo per vedere il consuntivo.
        </p>
      </div>
    )
  }

  const totCostiStimati  = consuntivo.centri.reduce((s, c) => s + c.costi_stimati, 0)
  const totCostiReali    = consuntivo.costi_reali_totale
  const totRicaviStimati = consuntivo.centri.reduce((s, c) => s + c.ricavi_stimati, 0)

  return (
    <div className="space-y-6">
      {/* Costi per categoria */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#1A202C]">Costi per categoria</h3>
        </div>
        <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 bg-[#FAFBFC] border-b border-[#F1F5F9]">
          {['Categoria', 'Stimato', 'Reale', 'Scostamento'].map(h => (
            <p key={h} className="text-[10px] uppercase tracking-wide font-semibold text-[#94A3B8]">{h}</p>
          ))}
        </div>
        {consuntivo.centri.map(c => (
          <div key={c.nome} className="px-4 py-3 border-b border-[#F8FAFC] last:border-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[#1A202C]">{c.nome}</p>
                {c.solo_reale && (
                  <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full font-medium">
                    Non in budget
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] text-[#94A3B8] md:hidden">Stimato</p>
                <p className="text-sm text-[#64748B]">
                  {c.costi_stimati > 0 ? formatCurrency(c.costi_stimati) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#94A3B8] md:hidden">Reale</p>
                <p className="text-sm font-semibold text-[#1A202C]">{formatCurrency(c.costi_reali)}</p>
                {c.costi_stimati > 0 && <ProgressBar stimato={c.costi_stimati} reale={c.costi_reali} />}
              </div>
              <div>
                <p className="text-[10px] text-[#94A3B8] md:hidden">Scostamento</p>
                {c.costi_stimati > 0
                  ? <Delta stimato={c.costi_stimati} reale={c.costi_reali} />
                  : <span className="text-xs text-orange-500 font-medium">Non previsto</span>
                }
              </div>
            </div>
          </div>
        ))}
        {/* Totale */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <p className="text-xs font-bold text-[#1A202C] uppercase tracking-wide">Totale</p>
            <p className="text-sm font-semibold text-[#64748B]">{formatCurrency(totCostiStimati)}</p>
            <p className="text-sm font-bold text-[#1A202C]">{formatCurrency(totCostiReali)}</p>
            <Delta stimato={totCostiStimati} reale={totCostiReali} />
          </div>
        </div>
      </div>

      {/* Ricavi totali */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#1A202C]">Ricavi totali</h3>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Stimati</p>
              <p className="text-base font-bold text-[#64748B] mt-0.5">{formatCurrency(totRicaviStimati)}</p>
            </div>
            {detail.preventivo_bloccato && (
              <div>
                <p className="text-[10px] text-amber-500 uppercase tracking-wide">Preventivo bloccato</p>
                <p className="text-base font-bold text-amber-600 mt-0.5">{formatCurrency(detail.totale_bloccato ?? 0)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Fatturati</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">{formatCurrency(consuntivo.ricavi_reali)}</p>
              <ProgressBar stimato={detail.preventivo_bloccato ? (detail.totale_bloccato ?? 0) : totRicaviStimati} reale={consuntivo.ricavi_reali} />
            </div>
            <div>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Scostamento</p>
              <Delta
                stimato={detail.preventivo_bloccato ? (detail.totale_bloccato ?? 0) : totRicaviStimati}
                reale={consuntivo.ricavi_reali}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
