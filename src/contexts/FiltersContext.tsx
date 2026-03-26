import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { defaultFilterState, type FilterState } from '@/types'

interface FiltersContextValue {
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  activeCount: number
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilterState)

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFiltersState(defaultFilterState), [])

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'dateRange' || key === 'scadenzaRange' || key === 'imponibileRange' || key === 'ivaRange') {
      return Object.values(val as object).some(v => v !== null)
    }
    if (Array.isArray(val)) return val.length > 0
    if (key === 'searchText') return val !== ''
    return val !== null && val !== false
  }).length

  return (
    <FiltersContext.Provider value={{ filters, setFilter, resetFilters, activeCount }}>
      {children}
    </FiltersContext.Provider>
  )
}

export function useFiltersContext(): FiltersContextValue {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error('useFiltersContext deve essere usato dentro FiltersProvider')
  return ctx
}
