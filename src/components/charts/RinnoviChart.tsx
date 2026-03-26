import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RinnoviPoint } from '@/lib/analytics'

interface Props { data: RinnoviPoint[] }

const COLORS: Record<string, string> = {
  'Ricorrente': '#3B82F6',
  'Una tantum': '#10B981',
  'Non classificato': '#E2E8F0',
}

export default function RinnoviChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-[#64748B]">Nessun dato</div>
  }

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="42%"
          outerRadius="65%"
          paddingAngle={3}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.name] ?? '#8B5CF6'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => {
            const n = Number(v ?? 0)
            return [`${formatCurrency(n)} (${((n / total) * 100).toFixed(1)}%)`, String(name)]
          }}
          contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
