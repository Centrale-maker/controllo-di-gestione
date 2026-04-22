import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RinnoviPoint } from '@/lib/analytics'
import type { FilterState } from '@/types'

interface Props {
  data: RinnoviPoint[]
  onDrilldown?: (patch: Partial<FilterState>) => void
}

const COLORS: Record<string, string> = {
  'Ricorrente': '#3B82F6',
  'Una tantum': '#10B981',
  'Non classificato': '#E2E8F0',
}

const RINNOVI_MAP: Record<string, FilterState['rinnovi']> = {
  'Ricorrente': 'ricorrente',
  'Una tantum': 'una tantum',
}

export default function RinnoviChart({ data, onDrilldown }: Props) {
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
          onClick={(data) => {
            const entry = data as unknown as RinnoviPoint
            const val = RINNOVI_MAP[entry.name]
            if (!onDrilldown || val === undefined) return
            onDrilldown({ rinnovi: val })
          }}
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={COLORS[entry.name] ?? '#8B5CF6'}
              style={{ cursor: onDrilldown && entry.name !== 'Non classificato' ? 'pointer' : 'default' }}
            />
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
