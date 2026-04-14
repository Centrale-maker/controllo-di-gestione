import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import RinnoviPill from './RinnoviPill'
import RimborsoPill from './RimborsoPill'
import type { Purchase } from '@/types'

interface Props {
  purchases:          Purchase[]
  onRinnoviChange:    (id: string, value: 'ricorrente' | 'una tantum' | null) => Promise<void>
  onRimborsoChange:   (id: string, value: 'rimborsata' | 'non rimborsata' | null) => Promise<void>
  onEditRow:          (p: Purchase) => void
  onDeleteRow:        (p: Purchase) => void
  highlightUploadId:  string | null
}

const INITIAL_COUNT = 30
const LOAD_MORE = 20

export default function DataCards({ purchases, onRinnoviChange, onRimborsoChange, onEditRow, onDeleteRow, highlightUploadId }: Props) {
  const [visible, setVisible] = useState(INITIAL_COUNT)
  const [savingRinnovi, setSavingRinnovi]   = useState<Set<string>>(new Set())
  const [savingRimborso, setSavingRimborso] = useState<Set<string>>(new Set())

  const slice = purchases.slice(0, visible)

  async function handleRinnovi(id: string, value: 'ricorrente' | 'una tantum' | null) {
    setSavingRinnovi(s => new Set(s).add(id))
    try {
      await onRinnoviChange(id, value)
    } finally {
      setSavingRinnovi(s => { const next = new Set(s); next.delete(id); return next })
    }
  }

  async function handleRimborso(id: string, value: 'rimborsata' | 'non rimborsata' | null) {
    setSavingRimborso(s => new Set(s).add(id))
    try {
      await onRimborsoChange(id, value)
    } finally {
      setSavingRimborso(s => { const next = new Set(s); next.delete(id); return next })
    }
  }

  return (
    <div className="space-y-2">
      {slice.map(p => (
        <div
          key={p.id}
          className={`rounded-xl border px-4 py-3 transition-colors ${
            highlightUploadId && p.upload_id === highlightUploadId
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1A202C] truncate">{p.fornitore || '—'}</p>
              <p className="text-xs text-[#64748B] truncate mt-0.5">{p.descrizione || '—'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <p className="text-sm font-bold text-[#1A202C] tabular-nums">
                {formatCurrency(Number(p.imponibile))}
              </p>
              <button
                onClick={() => onEditRow(p)}
                className="p-1.5 rounded-md text-[#CBD5E0] hover:text-[#1E3A5F] hover:bg-[#F1F5F9] transition-colors"
                title="Modifica classificazione"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDeleteRow(p)}
                className="p-1.5 rounded-md text-[#CBD5E0] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                title="Elimina riga"
              >
                <Trash2 size={14} />
              </button>
            </div>
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
            <RinnoviPill
              value={p.rinnovi ?? null}
              saving={savingRinnovi.has(p.id)}
              onChange={v => handleRinnovi(p.id, v)}
            />
            <RimborsoPill
              value={p.rimborso ?? null}
              saving={savingRimborso.has(p.id)}
              onChange={v => handleRimborso(p.id, v)}
            />
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
