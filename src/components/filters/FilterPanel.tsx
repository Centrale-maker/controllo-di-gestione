import { RotateCcw } from 'lucide-react'
import CheckList from './CheckList'
import type { FilterState } from '@/types'
import type { FilterOptions } from '@/hooks/useFilterOptions'

interface Props {
  filters: FilterState
  options: FilterOptions
  activeCount: number
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
}

export default function FilterPanel({ filters, options, activeCount, setFilter, resetFilters }: Props) {
  const fromStr = filters.dateRange.from ? filters.dateRange.from.toISOString().slice(0, 10) : ''
  const toStr = filters.dateRange.to ? filters.dateRange.to.toISOString().slice(0, 10) : ''

  function setDateFrom(val: string) {
    setFilter('dateRange', { ...filters.dateRange, from: val ? new Date(val + 'T00:00:00') : null })
  }
  function setDateTo(val: string) {
    setFilter('dateRange', { ...filters.dateRange, to: val ? new Date(val + 'T00:00:00') : null })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#1A202C]">Filtri</h3>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1A202C]"
          >
            <RotateCcw size={12} />
            Reset tutti
          </button>
        )}
      </div>

      {/* Periodo */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#1A202C] uppercase tracking-wide">Periodo</span>
        <div className="space-y-1.5">
          <input
            type="date"
            value={fromStr}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            placeholder="Dal"
          />
          <input
            type="date"
            value={toStr}
            onChange={e => setDateTo(e.target.value)}
            className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            placeholder="Al"
          />
        </div>
      </div>

      {/* Rinnovi */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#1A202C] uppercase tracking-wide">Tipo costo</span>
        <div className="flex flex-col gap-1">
          {([null, 'ricorrente', 'una tantum'] as const).map(val => (
            <label key={String(val)} className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-[#F8FAFC]">
              <input
                type="radio"
                checked={filters.rinnovi === val}
                onChange={() => setFilter('rinnovi', val)}
                className="accent-[#1E3A5F]"
              />
              <span className="text-xs text-[#1A202C]">
                {val === null ? 'Tutti' : val === 'ricorrente' ? 'Ricorrente' : 'Una tantum'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* Centro di costo — strutturato */}
      {options.ccTipo.length > 0 && (
        <CheckList
          label="Tipo CC"
          options={options.ccTipo}
          selected={filters.ccTipo}
          onChange={v => setFilter('ccTipo', v)}
        />
      )}

      {options.ccSede.length > 0 && (
        <>
          <div className="h-px bg-[#E2E8F0]" />
          <CheckList
            label="Sede"
            options={options.ccSede}
            selected={filters.ccSede}
            onChange={v => setFilter('ccSede', v)}
          />
        </>
      )}

      {options.ccCliente.length > 0 && (
        <>
          <div className="h-px bg-[#E2E8F0]" />
          <CheckList
            label="Cliente"
            options={options.ccCliente}
            selected={filters.ccCliente}
            onChange={v => setFilter('ccCliente', v)}
          />
        </>
      )}

      <div className="h-px bg-[#E2E8F0]" />

      {options.categoria.length > 0 && (
        <CheckList
          label="Categoria"
          options={options.categoria}
          selected={filters.categoria}
          onChange={v => setFilter('categoria', v)}
        />
      )}

      <div className="h-px bg-[#E2E8F0]" />

      {options.fornitore.length > 0 && (
        <CheckList
          label="Fornitore"
          options={options.fornitore}
          selected={filters.fornitore}
          onChange={v => setFilter('fornitore', v)}
        />
      )}

      <div className="h-px bg-[#E2E8F0]" />

      {options.paese.length > 0 && (
        <CheckList
          label="Paese"
          options={options.paese}
          selected={filters.paese}
          onChange={v => setFilter('paese', v)}
        />
      )}
    </div>
  )
}
