import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FilterState } from '@/types'

// ─── Tipi ────────────────────────────────────────────────────────────────────

export type FacetRow = {
  cc_tipo: string | null
  cc_sede: string | null
  cc_cliente: string | null
  categoria: string | null
  fornitore: string | null
  paese: string | null
  targhe: string[] | null
  rinnovi: string | null
  rimborso: string | null
  data: string | null
}

export interface FacetedOptions {
  ccTipo: string[]
  ccSede: string[]
  ccCliente: string[]
  categoria: string[]
  fornitore: string[]
  paese: string[]
  targhe: string[]
  hasRinnovi: boolean
  hasRimborso: boolean
}

type ScalarKey = 'cc_tipo' | 'cc_sede' | 'cc_cliente' | 'categoria' | 'fornitore' | 'paese'

// ─── Cascade ─────────────────────────────────────────────────────────────────

export type CascadeKey = 'ccTipo' | 'ccSede' | 'ccCliente' | 'categoria' | 'fornitore' | 'paese'

const DIM_TO_ROW: Record<CascadeKey, ScalarKey> = {
  ccCliente: 'cc_cliente',
  ccSede:    'cc_sede',
  ccTipo:    'cc_tipo',
  categoria: 'categoria',
  fornitore: 'fornitore',
  paese:     'paese',
}

const DEFAULT_ORDER: CascadeKey[] = ['ccCliente', 'ccSede', 'ccTipo', 'categoria', 'fornitore', 'paese']

function buildChain(ids: string[]): Array<{ filter: CascadeKey; rowKey: ScalarKey }> {
  return ids
    .filter((id): id is CascadeKey => id in DIM_TO_ROW)
    .map(id => ({ filter: id as CascadeKey, rowKey: DIM_TO_ROW[id as CascadeKey] }))
}

// ─── Helper puri ─────────────────────────────────────────────────────────────

function distinct(rows: FacetRow[], key: ScalarKey): string[] {
  return [...new Set(rows.map(r => r[key] as string | null).filter((v): v is string => !!v))].sort()
}

function distinctTarghe(rows: FacetRow[]): string[] {
  return [...new Set(rows.flatMap(r => r.targhe ?? []))].sort()
}

function applyFilter(rows: FacetRow[], key: ScalarKey, selected: string[]): FacetRow[] {
  if (selected.length === 0) return rows
  return rows.filter(r => r[key] !== null && selected.includes(r[key] as string))
}

// Applica tutti i filtri non-cascade (rimborso, rinnovi, dateRange, targa)
// alla base di dati prima di calcolare le opzioni cascade.
function applyNonCascadeFilters(rows: FacetRow[], filters: FilterState): FacetRow[] {
  let result = rows

  if (filters.rimborso !== null)
    result = result.filter(r => r.rimborso === filters.rimborso)

  if (filters.rinnovi !== null)
    result = result.filter(r => r.rinnovi === filters.rinnovi)

  if (filters.dateRange.from || filters.dateRange.to) {
    result = result.filter(r => {
      if (!r.data) return false
      const d = new Date(r.data + 'T00:00:00')
      if (filters.dateRange.from && d < filters.dateRange.from) return false
      if (filters.dateRange.to && d > filters.dateRange.to) return false
      return true
    })
  }

  if (filters.targa.length > 0)
    result = result.filter(r => r.targhe !== null && filters.targa.some(t => r.targhe!.includes(t)))

  return result
}

// ─── Cascade reset ───────────────────────────────────────────────────────────

export function cascadeReset(
  allRows: FacetRow[],
  changedKey: CascadeKey,
  newValue: string[],
  currentFilters: FilterState,
  activeDimIds?: string[],
): Partial<FilterState> {
  const chain = buildChain(activeDimIds ?? DEFAULT_ORDER)
  const patch: Partial<FilterState> = { [changedKey]: newValue }
  const startIdx = chain.findIndex(c => c.filter === changedKey)

  if (startIdx === -1) return patch

  let filtered = applyFilter(allRows, chain[startIdx].rowKey, newValue)

  for (let i = startIdx + 1; i < chain.length; i++) {
    const { filter, rowKey } = chain[i]
    const valid = new Set(filtered.map(r => r[rowKey]).filter(Boolean))
    const cleaned = (currentFilters[filter] as string[]).filter(v => valid.has(v))
    patch[filter] = cleaned
    filtered = applyFilter(filtered, rowKey, cleaned)
  }

  const validTarghe = new Set(filtered.flatMap(r => r.targhe ?? []))
  patch.targa = currentFilters.targa.filter(t => validTarghe.has(t))

  return patch
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFacetedOptions(filters: FilterState, activeDimIds?: string[]): {
  options: FacetedOptions
  allRows: FacetRow[]
} {
  const [allRows, setAllRows] = useState<FacetRow[]>([])

  useEffect(() => {
    supabase
      .from('purchases')
      .select('cc_tipo, cc_sede, cc_cliente, categoria, fornitore, paese, targhe, rinnovi, rimborso, data')
      .then(({ data }) => setAllRows((data ?? []) as FacetRow[]))
  }, [])

  const options = useMemo((): FacetedOptions => {
    // Prima applica tutti i filtri non-cascade (rimborso, rinnovi, dateRange, targa)
    const baseRows = applyNonCascadeFilters(allRows, filters)

    const chain = buildChain(activeDimIds ?? DEFAULT_ORDER)
    const inChain = new Set(chain.map(c => c.filter))

    const dimOptions: Partial<Record<CascadeKey, string[]>> = {}
    let filtered = baseRows

    for (const { filter, rowKey } of chain) {
      dimOptions[filter] = distinct(filtered, rowKey)
      filtered = applyFilter(filtered, rowKey, filters[filter] as string[])
    }

    // Dimensioni non nella chain: opzioni calcolate su baseRows (rispetta filtri non-cascade)
    for (const key of Object.keys(DIM_TO_ROW) as CascadeKey[]) {
      if (!inChain.has(key)) {
        dimOptions[key] = distinct(baseRows, DIM_TO_ROW[key])
      }
    }

    return {
      ccTipo:     dimOptions.ccTipo    ?? [],
      ccSede:     dimOptions.ccSede    ?? [],
      ccCliente:  dimOptions.ccCliente ?? [],
      categoria:  dimOptions.categoria ?? [],
      fornitore:  dimOptions.fornitore ?? [],
      paese:      dimOptions.paese     ?? [],
      targhe:     distinctTarghe(filtered),
      hasRinnovi: filtered.some(r => r.rinnovi !== null),
      hasRimborso: filtered.some(r => r.rimborso !== null),
    }
  }, [
    allRows,
    filters.ccTipo, filters.ccSede, filters.ccCliente,
    filters.categoria, filters.fornitore, filters.paese,
    filters.rimborso, filters.rinnovi,
    filters.dateRange, filters.targa,
    activeDimIds,
  ])

  return { options, allRows }
}
