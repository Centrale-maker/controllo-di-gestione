import { useState } from 'react'
import { X, Download, AlertCircle } from 'lucide-react'
import { useExpenseQuotasMultiMonth } from '@/hooks/useExpenseQuotas'
import { exportRimborsi } from '@/lib/exportRimborsi'

interface Props {
  currentPeriodo: string   // "YYYY-MM-01"
  onClose: () => void
}

function addMonths(iso: string, n: number): string {
  const [y, m] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function fmtMese(iso: string): string {
  const [y, m] = iso.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

// Genera un array di mesi tra from e to (inclusi)
function monthRange(from: string, to: string): string[] {
  const months: string[] = []
  let cur = from
  while (cur <= to) {
    months.push(cur)
    cur = addMonths(cur, 1)
  }
  return months
}

// ─── RimborsiExportDialog ─────────────────────────────────────────────────────

export function RimborsiExportDialog({ currentPeriodo, onClose }: Props) {
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [from, setFrom] = useState(currentPeriodo)
  const [to, setTo] = useState(currentPeriodo)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const effectiveFrom = mode === 'single' ? currentPeriodo : from
  const effectiveTo   = mode === 'single' ? currentPeriodo : (to >= from ? to : from)

  const { quotas, directPurchases, loading } = useExpenseQuotasMultiMonth(effectiveFrom, effectiveTo)

  const months = monthRange(effectiveFrom, effectiveTo)
  const totVoci = quotas.length + directPurchases.length

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      await exportRimborsi(quotas, directPurchases, effectiveFrom, effectiveTo)
      onClose()
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Errore esportazione')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-0 md:px-4">
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1A202C]">Esporta Rimborsi</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg">
            <X size={18} className="text-[#64748B]" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Modalità */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Mese corrente
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                mode === 'range'
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Periodo personalizzato
            </button>
          </div>

          {mode === 'single' && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-[#1A202C] capitalize">{fmtMese(currentPeriodo)}</p>
            </div>
          )}

          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Da</label>
                <input
                  type="month"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
                  value={from.slice(0, 7)}
                  onChange={e => setFrom(e.target.value + '-01')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">A</label>
                <input
                  type="month"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
                  value={to.slice(0, 7)}
                  onChange={e => setTo(e.target.value + '-01')}
                  min={from.slice(0, 7)}
                />
              </div>
            </div>
          )}

          {/* Anteprima */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 space-y-1">
            {loading ? (
              <p className="text-sm text-[#64748B]">Caricamento anteprima…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[#1E3A5F]">
                  {months.length} {months.length === 1 ? 'mese' : 'mesi'} · {totVoci} voci
                </p>
                <p className="text-xs text-[#64748B]">
                  {quotas.length} quote piani + {directPurchases.length} rimborsi diretti
                </p>
              </>
            )}
          </div>

          {exportError && (
            <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-red-50 rounded-xl px-3 py-2">
              <AlertCircle size={15} />
              {exportError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading || totVoci === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium disabled:opacity-40"
          >
            <Download size={15} />
            {exporting ? 'Esportando…' : 'Esporta Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}
