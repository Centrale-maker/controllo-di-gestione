import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'
import type { Commessa } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: Commessa[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#1A202C] mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
      {payload.length === 2 && (
        <p className="mt-1 pt-1 border-t border-[#E2E8F0] font-medium text-[#1A202C]">
          Margine: {formatCurrency(payload[0].value - payload[1].value)}
        </p>
      )}
    </div>
  )
}

export default function CommesseChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-[#64748B]">
        Nessuna commessa da visualizzare
      </div>
    )
  }

  const chartData = data
    .filter(c => c.ricavi > 0 || c.costi > 0)
    .slice(0, 12)
    .map(c => ({
      name: c.id,
      Ricavi: c.ricavi,
      Costi: c.costi,
      margine: c.margine,
      marginePerc: c.marginePerc,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748B' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Ricavi" fill="#10B981" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.margine >= 0 ? '#10B981' : '#10B981'} />
          ))}
        </Bar>
        <Bar dataKey="Costi" fill="#EF4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
