import { X } from 'lucide-react'
import type { FilterState } from '@/types'
import type { FacetRow, CascadeKey } from '@/hooks/useFacetedOptions'
import { cascadeReset } from '@/hooks/useFacetedOptions'

interface Chip {
  key: string
  label: string
  onRemove: () => void
}

interface Props {
  filters: FilterState
  allRows: FacetRow[]
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  patchFilters: (patch: Partial<FilterState>) => void
  activeDimIds?: string[]
}

const CASCADE_KEYS = new Set<string>(['ccTipo', 'ccSede', 'ccCliente', 'categoria', 'fornitore', 'paese'])

const ARRAY_FILTERS: Array<[keyof FilterState, string]> = [
  ['ccCliente', 'Cliente'],
  ['ccSede',    'Sede'],
  ['ccTipo',    'Centro di costo'],
  ['categoria', 'Categoria'],
  ['fornitore', 'Fornitore'],
  ['paese',     'Paese'],
  ['targa',     'Targa'],
]

export default function FilterChips({ filters, allRows, setFilter, patchFilters, activeDimIds }: Props) {
  const chips: Chip[] = []

  for (const [key, label] of ARRAY_FILTERS) {
    const vals = filters[key] as string[]
    for (const val of vals) {
      chips.push({
        key: `${String(key)}-${val}`,
        label: `${label}: ${val}`,
        onRemove: () => {
          const next = vals.filter(v => v !== val)
          if (CASCADE_KEYS.has(String(key))) {
            patchFilters(cascadeReset(allRows, key as CascadeKey, next, filters, activeDimIds))
          } else {
            setFilter(key, next as FilterState[typeof key])
          }
        },
      })
    }
  }

  const { from, to } = filters.dateRange
  if (from || to) {
    const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const label = from && to ? `${fmt(from)} — ${fmt(to)}` : from ? `Dal ${fmt(from)}` : `Al ${fmt(to!)}`
    chips.push({
      key: 'dateRange',
      label: `Periodo: ${label}`,
      onRemove: () => setFilter('dateRange', { from: null, to: null }),
    })
  }

  if (filters.rinnovi !== null) {
    chips.push({
      key: 'rinnovi',
      label: `Tipo costo: ${filters.rinnovi}`,
      onRemove: () => setFilter('rinnovi', null),
    })
  }

  if (filters.rimborso !== null) {
    chips.push({
      key: 'rimborso',
      label: `Rimborso: ${filters.rimborso}`,
      onRemove: () => setFilter('rimborso', null),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E3A5F] font-medium"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}
    </div>
  )
}
