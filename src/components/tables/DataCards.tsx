import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Purchase } from '@/types'

interface Props {
  purchases: Purchase[]
}

const INITIAL_COUNT = 30
const LOAD_MORE = 20

export default function DataCards({ purchases }: Props) {
  const [visible, setVisible] = useState(INITIAL_COUNT)

  const slice = purchases.slice(0, visible)

  return (
    <div className="space-y-2">
      {slice.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1A202C] truncate">{p.fornitore || '—'}</p>
              <p className="text-xs text-[#64748B] truncate mt-0.5">{p.descrizione || '—'}</p>
            </div>
            <p className="text-sm font-bold text-[#1A202C] shrink-0 tabular-nums">
              {formatCurrency(Number(p.imponibile))}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-[#64748B]">{formatDate(p.data)}</span>
            {p.categoria && (
              <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
                {p.categoria}
              </span>
            )}
            {p.centro_costo && (
              <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
                {p.centro_costo}
              </span>
            )}
          </div>
        </div>
      ))}

      {visible < purchases.length && (
        <button
          onClick={() => setVisible(v => v + LOAD_MORE)}
          className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
        >
          Carica altri ({purchases.length - visible} rimanenti)
        </button>
      )}

      {purchases.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#64748B]">Nessun risultato</p>
        </div>
      )}
    </div>
  )
}
