// Grafico a barre orizzontali riutilizzabile (CentroCosto, Fornitori, Paese)
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { CHART_COLORS, type ByLabel } from '@/lib/analytics'

interface Props {
  data: ByLabel[]
  color?: string
}

export default function HBarChart({ data, color }: Props) {
  if (data.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-[#64748B]">Nessun dato</div>
  }

  const labelWidth = Math.min(140, Math.max(80, Math.max(...data.map(d => d.label.length)) * 7))

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36 + 20)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: '#64748B' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={labelWidth}
          tick={{ fontSize: 11, fill: '#1A202C' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Imponibile']}
          contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="valore" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
