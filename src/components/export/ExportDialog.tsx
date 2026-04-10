import { useState } from 'react'
import { X, Download, FileSpreadsheet } from 'lucide-react'
import { EXPORT_COLUMNS, exportToExcel } from '@/lib/exportExcel'
import type { Purchase } from '@/types'

interface Props {
  open:               boolean
  onClose:            () => void
  purchases:          Purchase[]
  activeFiltersCount: number
}

const GROUPS = Array.from(new Set(EXPORT_COLUMNS.map(c => c.group)))
const DEFAULT_KEYS = new Set(EXPORT_COLUMNS.filter(c => c.defaultChecked).map(c => c.key))

// ─── Checkbox visuale ─────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onClick }: {
  checked: boolean; indeterminate?: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        checked || indeterminate
          ? 'bg-[#3B82F6] border-[#3B82F6]'
          : 'border-[#CBD5E0] hover:border-[#3B82F6]'
      }`}
    >
      {checked && <span className="text-white text-[9px] leading-none font-bold">✓</span>}
      {!checked && indeterminate && <span className="text-white text-[10px] leading-none font-bold">–</span>}
    </button>
  )
}

// ─── Gruppo colonne ──────────────────────────────────────────────────────────
function ColGroup({ group, selected, onToggleGroup, onToggleCol }: {
  group: string
  selected: Set<string>
  onToggleGroup: (g: string) => void
  onToggleCol: (k: string) => void
}) {
  const groupCols  = EXPORT_COLUMNS.filter(c => c.group === group)
  const allChecked = groupCols.every(c => selected.has(c.key))
  const someChecked = groupCols.some(c => selected.has(c.key))

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          checked={allChecked}
          indeterminate={!allChecked && someChecked}
          onClick={() => onToggleGroup(group)}
        />
        <span className="text-[11px] font-semibold text-[#1E3A5F] uppercase tracking-wider">{group}</span>
      </div>
      <div className="ml-6 grid grid-cols-2 gap-y-1.5 gap-x-4">
        {groupCols.map(col => (
          <label key={col.key} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={selected.has(col.key)}
              onClick={() => onToggleCol(col.key)}
            />
            <span className="text-sm text-[#1A202C] select-none">{col.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Dialog principale ────────────────────────────────────────────────────────
export default function ExportDialog({ open, onClose, purchases, activeFiltersCount }: Props) {
  const [selected, setSelected]   = useState<Set<string>>(DEFAULT_KEYS)
  const [exporting, setExporting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  if (!open) return null

  function toggleCol(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleGroup(group: string) {
    const groupCols = EXPORT_COLUMNS.filter(c => c.group === group)
    const allChecked = groupCols.every(c => selected.has(c.key))
    setSelected(prev => {
      const next = new Set(prev)
      groupCols.forEach(c => allChecked ? next.delete(c.key) : next.add(c.key))
      return next
    })
  }

  async function handleExport() {
    setError(null)
    setExporting(true)
    try {
      const orderedKeys = EXPORT_COLUMNS.filter(c => selected.has(c.key)).map(c => c.key)
      const subtitle = activeFiltersCount > 0
        ? `${activeFiltersCount} filtri attivi`
        : 'Tutti i dati'
      await exportToExcel(purchases, orderedKeys, subtitle)
      onClose()
    } catch (e) {
      setError('Errore durante l\'esportazione. Riprova.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Pannello */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E3A5F] flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1A202C]">Esporta in Excel</h2>
              <p className="text-xs text-[#64748B]">
                {purchases.length.toLocaleString('it-IT')} fatture
                {activeFiltersCount > 0 && ` · ${activeFiltersCount} filtri attivi`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]">
            <X size={18} />
          </button>
        </div>

        {/* Selezione colonne */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <p className="text-sm text-[#64748B]">Seleziona le colonne da includere nel report:</p>

          {GROUPS.map(group => (
            <ColGroup
              key={group}
              group={group}
              selected={selected}
              onToggleGroup={toggleGroup}
              onToggleCol={toggleCol}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0]">
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#64748B]">
              {selected.size} {selected.size === 1 ? 'colonna' : 'colonne'} selezionate
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Annulla
              </button>
              <button
                onClick={handleExport}
                disabled={selected.size === 0 || exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={15} />
                {exporting ? 'Esportazione…' : 'Esporta'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
