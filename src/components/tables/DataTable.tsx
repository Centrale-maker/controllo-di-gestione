import { useState } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import RinnoviPill from './RinnoviPill'
import RimborsoPill from './RimborsoPill'
import type { Purchase } from '@/types'
import type { PlanBadge } from '@/hooks/usePlanBadges'

interface Props {
  purchases:          Purchase[]
  onRinnoviChange:    (id: string, value: 'ricorrente' | 'una tantum' | null) => Promise<void>
  onRimborsoChange:   (id: string, value: 'rimborsata' | 'non rimborsata' | null) => Promise<void>
  onEditRow:          (p: Purchase) => void
  onDeleteRow:        (p: Purchase) => void
  highlightUploadId:  string | null
  planBadges?:        Record<string, PlanBadge>
}

type SortKey = 'data' | 'fornitore' | 'categoria' | 'centro_costo' | 'imponibile' | 'iva'

interface Col {
  key: SortKey | 'descrizione'
  label: string
  render: (p: Purchase) => string
  align?: 'right'
  sortable?: false
}

const COLS: Col[] = [
  { key: 'data', label: 'Data', render: p => formatDate(p.data) },
  { key: 'fornitore', label: 'Fornitore', render: p => p.fornitore },
  { key: 'descrizione', label: 'Descrizione', render: p => p.descrizione ?? '—', sortable: false },
  { key: 'categoria', label: 'Categoria', render: p => p.categoria ?? '—' },
  { key: 'centro_costo', label: 'Centro Costo', render: p => p.centro_costo ?? '—' },
  { key: 'imponibile', label: 'Imponibile', render: p => formatCurrency(Number(p.imponibile)), align: 'right' },
  { key: 'iva', label: 'IVA', render: p => formatCurrency(Number(p.iva)), align: 'right' },
]

const PAGE_SIZE = 50

export default function DataTable({ purchases, onRinnoviChange, onRimborsoChange, onEditRow, onDeleteRow, highlightUploadId, planBadges }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'data', dir: 'desc' })
  const [page, setPage] = useState(0)
  const [savingRinnovi, setSavingRinnovi]   = useState<Set<string>>(new Set())
  const [savingRimborso, setSavingRimborso] = useState<Set<string>>(new Set())

  function toggleSort(key: SortKey | 'descrizione') {
    if (key === 'descrizione') return
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(0)
  }

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

  const sorted = [...purchases].sort((a, b) => {
    const av = a[sort.key] ?? ''
    const bv = b[sort.key] ?? ''
    const cmp = String(av).localeCompare(String(bv), 'it', { numeric: true })
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const slice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-4 py-3 font-medium text-[#64748B] select-none whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sortable === false ? '' : 'cursor-pointer hover:text-[#1A202C]'}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      sort.key === col.key
                        ? sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        : <ChevronDown size={14} className="opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-[#64748B] text-left whitespace-nowrap">
                Tipo costo
              </th>
              <th className="px-4 py-3 font-medium text-[#64748B] text-left whitespace-nowrap">
                Rimborso
              </th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {slice.map(p => (
              <tr
                key={p.id}
                className={`border-b transition-colors ${
                  highlightUploadId && p.upload_id === highlightUploadId
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100'
                    : 'border-[#F1F5F9] hover:bg-[#F8FAFC]'
                }`}
              >
                {COLS.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[#1A202C] truncate ${col.key === 'descrizione' ? 'max-w-[280px]' : 'max-w-[200px]'} ${col.align === 'right' ? 'text-right font-medium' : ''}`}
                  >
                    {col.render(p)}
                  </td>
                ))}
                <td className="px-4 py-2.5">
                  <RinnoviPill
                    value={p.rinnovi ?? null}
                    saving={savingRinnovi.has(p.id)}
                    onChange={v => handleRinnovi(p.id, v)}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <RimborsoPill
                      value={p.rimborso ?? null}
                      saving={savingRimborso.has(p.id)}
                      onChange={v => handleRimborso(p.id, v)}
                    />
                    {planBadges?.[p.id] && (
                      <span className="text-xs bg-[#EFF6FF] text-[#1E3A5F] border border-[#BFDBFE] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {planBadges[p.id].rimborsate}/{planBadges[p.id].totali}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-0.5">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#64748B]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} di {sorted.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC]"
            >
              Prec
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC]"
            >
              Succ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
