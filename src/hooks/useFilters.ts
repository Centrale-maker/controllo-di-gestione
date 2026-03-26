import { useState, useCallback } from 'react'
import { defaultFilterState, type FilterState } from '@/types'

export function useFilters() {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilterState)

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilterState)
  }, [])

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'dateRange' || key === 'scadenzaRange' || key === 'imponibileRange' || key === 'ivaRange') {
      const range = val as { from: unknown; to: unknown } | { min: unknown; max: unknown }
      return Object.values(range).some(v => v !== null)
    }
    if (Array.isArray(val)) return val.length > 0
    if (key === 'searchText') return val !== ''
    return val !== null && val !== false
  }).length

  return { filters, setFilter, resetFilters, activeCount }
}
