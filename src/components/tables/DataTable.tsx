import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import RinnoviPill from './RinnoviPill'
import type { Purchase } from '@/types'

interface Props {
  purchases: Purchase[]
  onRinnoviChange: (id: string, value: 'ricorrente' | 'una tantum' | null) => Promise<void>
}

type SortKey = 'data' | 'fornitore' | 'categoria' | 'centro_costo' | 'imponibile' | 'iva'

interface Col {
  key: SortKey
  label: string
  render: (p: Purchase) => string
  align?: 'right'
}

const COLS: Col[] = [
  { key: 'data', label: 'Data', render: p => formatDate(p.data) },
  { key: 'fornitore', label: 'Fornitore', render: p => p.fornitore },
  { key: 'categoria', label: 'Categoria', render: p => p.categoria ?? '—' },
  { key: 'centro_costo', label: 'Centro Costo', render: p => p.centro_costo ?? '—' },
  { key: 'imponibile', label: 'Imponibile', render: p => formatCurrency(Number(p.imponibile)), align: 'right' },
  { key: 'iva', label: 'IVA', render: p => formatCurrency(Number(p.iva)), align: 'right' },
]

const PAGE_SIZE = 50

export default function DataTable({ purchases, onRinnoviChange }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'data', dir: 'desc' })
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(0)
  }

  async function handleRinnovi(id: string, value: 'ricorrente' | 'una tantum' | null) {
    setSaving(s => new Set(s).add(id))
    try {
      await onRinnoviChange(id, value)
    } finally {
      setSaving(s => { const next = new Set(s); next.delete(id); return next })
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
                  className={`px-4 py-3 font-medium text-[#64748B] cursor-pointer hover:text-[#1A202C] select-none whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sort.key === col.key
                      ? sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      : <ChevronDown size={14} className="opacity-30" />
                    }
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-[#64748B] text-left whitespace-nowrap">
                Tipo costo
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.map(p => (
              <tr key={p.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                {COLS.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[#1A202C] max-w-[200px] truncate ${col.align === 'right' ? 'text-right font-medium' : ''}`}
                  >
                    {col.render(p)}
                  </td>
                ))}
                <td className="px-4 py-2.5">
                  <RinnoviPill
                    value={p.rinnovi ?? null}
                    saving={saving.has(p.id)}
                    onChange={v => handleRinnovi(p.id, v)}
                  />
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
