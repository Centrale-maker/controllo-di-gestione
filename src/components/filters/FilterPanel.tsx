import { RotateCcw } from 'lucide-react'
import CheckList from './CheckList'
import type { FilterState } from '@/types'
import type { FacetedOptions, FacetRow, CascadeKey } from '@/hooks/useFacetedOptions'
import { cascadeReset } from '@/hooks/useFacetedOptions'

interface Props {
  filters: FilterState
  options: FacetedOptions
  allRows: FacetRow[]
  activeCount: number
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  patchFilters: (patch: Partial<FilterState>) => void
  resetFilters: () => void
}

export default function FilterPanel({
  filters, options, allRows, activeCount, setFilter, patchFilters, resetFilters,
}: Props) {
  const fromStr = filters.dateRange.from ? filters.dateRange.from.toISOString().slice(0, 10) : ''
  const toStr   = filters.dateRange.to   ? filters.dateRange.to.toISOString().slice(0, 10)   : ''

  function setDateFrom(val: string) {
    setFilter('dateRange', { ...filters.dateRange, from: val ? new Date(val + 'T00:00:00') : null })
  }
  function setDateTo(val: string) {
    setFilter('dateRange', { ...filters.dateRange, to: val ? new Date(val + 'T00:00:00') : null })
  }

  // Cascade: quando cambia un filtro upstream, pulisce i downstream non più validi
  function cc(key: CascadeKey, v: string[]) {
    patchFilters(cascadeReset(allRows, key, v, filters))
  }

  return (
    <div className="space-y-5">
      {activeCount > 0 && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1A202C]"
        >
          <RotateCcw size={12} />
          Reset tutti
        </button>
      )}

      {/* Periodo */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#1A202C] uppercase tracking-wide">Periodo</span>
        <div className="space-y-1.5">
          <input
            type="date" value={fromStr} onChange={e => setDateFrom(e.target.value)}
            className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
          />
          <input
            type="date" value={toStr} onChange={e => setDateTo(e.target.value)}
            className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
          />
        </div>
      </div>

      {/* Tipo costo */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#1A202C] uppercase tracking-wide">Tipo costo</span>
        <div className="flex flex-col gap-1">
          {([null, 'ricorrente', 'una tantum'] as const).map(val => (
            <label key={String(val)} className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-[#F8FAFC]">
              <input type="radio" checked={filters.rinnovi === val} onChange={() => setFilter('rinnovi', val)} className="accent-[#1E3A5F]" />
              <span className="text-xs text-[#1A202C]">
                {val === null ? 'Tutti' : val === 'ricorrente' ? 'Ricorrente' : 'Una tantum'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rimborso */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#1A202C] uppercase tracking-wide">Rimborso</span>
        <div className="flex flex-col gap-1">
          {([null, 'rimborsata', 'non rimborsata'] as const).map(val => (
            <label key={String(val)} className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-[#F8FAFC]">
              <input type="radio" checked={filters.rimborso === val} onChange={() => setFilter('rimborso', val)} className="accent-[#1E3A5F]" />
              <span className="text-xs text-[#1A202C]">
                {val === null ? 'Tutti' : val === 'rimborsata' ? 'Rimborsata' : 'Non rimborsata'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* Centro di costo — cascata: Cliente → Sede → Tipo CC */}
      {options.ccCliente.length > 0 && (
        <CheckList label="Cliente" options={options.ccCliente} selected={filters.ccCliente}
          onChange={v => cc('ccCliente', v)} />
      )}

      {options.ccSede.length > 0 && (
        <>
          <div className="h-px bg-[#E2E8F0]" />
          <CheckList label="Sede" options={options.ccSede} selected={filters.ccSede}
            onChange={v => cc('ccSede', v)} />
        </>
      )}

      {options.ccTipo.length > 0 && (
        <>
          <div className="h-px bg-[#E2E8F0]" />
          <CheckList label="Centro di costo" options={options.ccTipo} selected={filters.ccTipo}
            onChange={v => cc('ccTipo', v)} />
        </>
      )}

      <div className="h-px bg-[#E2E8F0]" />

      {/* Categoria — cascata dopo Cliente */}
      {options.categoria.length > 0 && (
        <CheckList label="Categoria" options={options.categoria} selected={filters.categoria}
          onChange={v => cc('categoria', v)} />
      )}

      <div className="h-px bg-[#E2E8F0]" />

      {/* Fornitore — cascata dopo Categoria */}
      {options.fornitore.length > 0 && (
        <CheckList label="Fornitore" options={options.fornitore} selected={filters.fornitore}
          onChange={v => cc('fornitore', v)} />
      )}

      <div className="h-px bg-[#E2E8F0]" />

      {/* Paese — cascata dopo Fornitore */}
      {options.paese.length > 0 && (
        <CheckList label="Paese" options={options.paese} selected={filters.paese}
          onChange={v => cc('paese', v)} />
      )}

      {/* Targa — cascata dopo Paese */}
      {options.targhe.length > 0 && (
        <>
          <div className="h-px bg-[#E2E8F0]" />
          <CheckList label="Targa" options={options.targhe} selected={filters.targa}
            onChange={v => setFilter('targa', v)} />
        </>
      )}
    </div>
  )
}
