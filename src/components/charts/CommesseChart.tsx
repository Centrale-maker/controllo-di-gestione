import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Commessa } from '@/types'
import { formatCurrency } from '@/lib/utils'

const PAGE_SIZE = 10

interface Props {
  data: Commessa[]
  page: number
  onPageChange: (p: number) => void
  onBarClick: (id: string) => void
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const ricavi = payload.find(p => p.name === 'Ricavi')?.value ?? 0
  const costi  = payload.find(p => p.name === 'Costi')?.value ?? 0
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#1A202C] mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
      {ricavi > 0 && (
        <p className={`mt-1 pt-1 border-t border-[#E2E8F0] font-medium ${ricavi - costi >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          Margine: {formatCurrency(ricavi - costi)}
        </p>
      )}
      <p className="text-[10px] text-[#94A3B8] mt-1">Clicca per il dettaglio</p>
    </div>
  )
}

export default function CommesseChart({ data, page, onPageChange, onBarClick }: Props) {
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const slice = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const chartData = slice.map(c => ({
    id: c.id,
    name: c.id,
    Ricavi: c.ricavi,
    Costi: c.costi,
    margine: c.margine,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-[#64748B]">
        Nessuna commessa da visualizzare
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleClick(barData: any) {
    const id = barData?.activePayload?.[0]?.payload?.id as string | undefined
    if (id) onBarClick(id)
  }

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748B' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Ricavi" fill="#10B981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Costi"  fill="#EF4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Paginazione grafico */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-[#64748B]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.length)} di {data.length} commesse
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
