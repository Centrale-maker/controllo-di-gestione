import { useRef, useEffect } from 'react'
import CheckList from './CheckList'
import type { FilterState } from '@/types'
import type { FacetedOptions, FacetRow, CascadeKey } from '@/hooks/useFacetedOptions'
import { cascadeReset } from '@/hooks/useFacetedOptions'
import type { FilterDimension } from './filterDimensions'

interface Props {
  dim: FilterDimension
  filters: FilterState
  options: FacetedOptions
  allRows: FacetRow[]
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  patchFilters: (patch: Partial<FilterState>) => void
  onClose: () => void
  activeDimIds?: string[]
}

function getOpts(dimId: string, options: FacetedOptions): string[] {
  switch (dimId) {
    case 'ccCliente': return options.ccCliente
    case 'ccSede':    return options.ccSede
    case 'ccTipo':    return options.ccTipo
    case 'categoria': return options.categoria
    case 'fornitore': return options.fornitore
    case 'paese':     return options.paese
    default:          return []
  }
}

function getSelected(dimId: string, filters: FilterState): string[] {
  switch (dimId) {
    case 'ccCliente': return filters.ccCliente
    case 'ccSede':    return filters.ccSede
    case 'ccTipo':    return filters.ccTipo
    case 'categoria': return filters.categoria
    case 'fornitore': return filters.fornitore
    case 'paese':     return filters.paese
    default:          return []
  }
}

function applyMultiselect(dimId: string, v: string[], allRows: FacetRow[], filters: FilterState,
  _setFilter: Props['setFilter'], patchFilters: Props['patchFilters'], activeDimIds?: string[]) {
  switch (dimId) {
    case 'ccCliente': patchFilters(cascadeReset(allRows, 'ccCliente' as CascadeKey, v, filters, activeDimIds)); break
    case 'ccSede':    patchFilters(cascadeReset(allRows, 'ccSede'    as CascadeKey, v, filters, activeDimIds)); break
    case 'ccTipo':    patchFilters(cascadeReset(allRows, 'ccTipo'    as CascadeKey, v, filters, activeDimIds)); break
    case 'categoria': patchFilters(cascadeReset(allRows, 'categoria' as CascadeKey, v, filters, activeDimIds)); break
    case 'fornitore': patchFilters(cascadeReset(allRows, 'fornitore' as CascadeKey, v, filters, activeDimIds)); break
    case 'paese':     patchFilters(cascadeReset(allRows, 'paese'     as CascadeKey, v, filters, activeDimIds)); break
  }
}

export default function FilterValuePopover({ dim, filters, options, allRows, setFilter, patchFilters, onClose, activeDimIds }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-[#E2E8F0] shadow-lg p-3 min-w-[200px] max-h-[280px] overflow-y-auto"
    >
      <p className="text-xs font-semibold mb-2" style={{ color: dim.color }}>{dim.label}</p>

      {dim.type === 'multiselect' && (
        <CheckList
          label=""
          options={getOpts(dim.id, options)}
          selected={getSelected(dim.id, filters)}
          onChange={v => applyMultiselect(dim.id, v, allRows, filters, setFilter, patchFilters, activeDimIds)}
        />
      )}

      {dim.type === 'radio-rinnovi' && (
        <div className="flex flex-col gap-1">
          {([null, 'ricorrente', 'una tantum'] as const).map(val => (
            <label key={String(val)} className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-[#F8FAFC]">
              <input type="radio" checked={filters.rinnovi === val} onChange={() => setFilter('rinnovi', val)} className="accent-[#1E3A5F]" />
              <span className="text-xs">{val === null ? 'Tutti' : val === 'ricorrente' ? 'Ricorrente' : 'Una tantum'}</span>
            </label>
          ))}
        </div>
      )}

      {dim.type === 'radio-rimborso' && (
        <div className="flex flex-col gap-1">
          {([null, 'rimborsata', 'non rimborsata'] as const).map(val => (
            <label key={String(val)} className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-[#F8FAFC]">
              <input type="radio" checked={filters.rimborso === val} onChange={() => setFilter('rimborso', val)} className="accent-[#1E3A5F]" />
              <span className="text-xs">{val === null ? 'Tutti' : val === 'rimborsata' ? 'Rimborsata' : 'Non rimborsata'}</span>
            </label>
          ))}
        </div>
      )}

      {dim.type === 'daterange' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Dal</label>
            <input type="date"
              value={filters.dateRange.from?.toISOString().slice(0, 10) ?? ''}
              onChange={e => setFilter('dateRange', { ...filters.dateRange, from: e.target.value ? new Date(e.target.value + 'T00:00:00') : null })}
              className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Al</label>
            <input type="date"
              value={filters.dateRange.to?.toISOString().slice(0, 10) ?? ''}
              onChange={e => setFilter('dateRange', { ...filters.dateRange, to: e.target.value ? new Date(e.target.value + 'T00:00:00') : null })}
              className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
