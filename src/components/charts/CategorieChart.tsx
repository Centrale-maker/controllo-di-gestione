import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { CHART_COLORS, type ByLabel } from '@/lib/analytics'

interface Props { data: ByLabel[] }

export default function CategorieChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-[#64748B]">Nessun dato</div>
  }

  const total = data.reduce((s, d) => s + d.valore, 0)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="valore"
          nameKey="label"
          cx="50%"
          cy="45%"
          innerRadius="50%"
          outerRadius="72%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => {
            const n = Number(v ?? 0)
            return [`${formatCurrency(n)} (${((n / total) * 100).toFixed(1)}%)`, String(name)]
          }}
          contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, lineHeight: '1.6' }}
          formatter={(value: string) => value.length > 20 ? value.slice(0, 18) + '…' : value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
