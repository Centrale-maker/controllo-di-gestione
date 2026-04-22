import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { fmtAxisEur, type MonthlyPoint } from '@/lib/analytics'
import type { FilterState } from '@/types'

interface Props {
  data: MonthlyPoint[]
  onDrilldown?: (patch: Partial<FilterState>) => void
}

export default function CashflowChart({ data, onDrilldown }: Props) {
  if (data.length === 0) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-[#64748B]">Nessun dato</div>
  }

  function handleBarClick(data: unknown) {
    const entry = data as MonthlyPoint
    if (!onDrilldown || !entry.key) return
    const [year, month] = entry.key.split('-').map(Number)
    const from = new Date(year, month - 1, 1)
    const to = new Date(year, month, 0)  // ultimo giorno del mese
    onDrilldown({ dateRange: { from, to } })
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        style={{ cursor: onDrilldown ? 'pointer' : 'default' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="mese" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
        <YAxis tickFormatter={fmtAxisEur} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          formatter={(v, name) => [formatCurrency(Number(v ?? 0)), String(name)]}
          labelStyle={{ fontWeight: 600, color: '#1A202C' }}
          contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="imponibile" name="Imponibile" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={40} onClick={handleBarClick} />
        <Bar dataKey="iva" name="IVA" fill="#06B6D4" radius={[3, 3, 0, 0]} maxBarSize={40} onClick={handleBarClick} />
      </BarChart>
    </ResponsiveContainer>
  )
}
