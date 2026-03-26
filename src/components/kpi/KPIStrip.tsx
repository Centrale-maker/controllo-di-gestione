import KPICard from './KPICard'
import { formatCurrency } from '@/lib/utils'
import type { Purchase } from '@/types'

interface Props {
  purchases: Purchase[]
}

export default function KPIStrip({ purchases }: Props) {
  const totImponibile = purchases.reduce((s, p) => s + Number(p.imponibile), 0)
  const totIva = purchases.reduce((s, p) => s + Number(p.iva), 0)
  const totRitenute = purchases.reduce((s, p) => s + Number(p.rit_acconto) + Number(p.rit_prev), 0)
  const fornitori = new Set(purchases.map(p => p.fornitore).filter(Boolean)).size

  type KpiDef = { label: string; value: string; accent?: 'default' | 'warning' | 'danger' }

  const kpis: KpiDef[] = [
    { label: 'Totale Lordo', value: formatCurrency(totImponibile + totIva) },
    { label: 'Imponibile', value: formatCurrency(totImponibile) },
    { label: 'IVA', value: formatCurrency(totIva) },
    { label: 'Ritenute', value: formatCurrency(totRitenute) },
    { label: 'N° Fatture', value: purchases.length.toLocaleString('it-IT') },
    { label: 'Fornitori', value: fornitori.toLocaleString('it-IT') },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-x-visible lg:grid lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map(kpi => (
        <div
          key={kpi.label}
          className="snap-start shrink-0 w-[200px] lg:w-auto"
        >
          <KPICard label={kpi.label} value={kpi.value} accent={kpi.accent} />
        </div>
      ))}
    </div>
  )
}
