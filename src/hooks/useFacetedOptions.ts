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
}

export interface FacetedOptions {
  ccTipo: string[]
  ccSede: string[]
  ccCliente: string[]
  categoria: string[]
  fornitore: string[]
  paese: string[]
  targhe: string[]
}

type ScalarKey = keyof Omit<FacetRow, 'targhe'>

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

// ─── Cascade reset ───────────────────────────────────────────────────────────

/**
 * Calcola le modifiche da applicare ai filtri downstream quando cambia
 * un filtro upstream. La gerarchia è determinata da activeDimIds (ordine
 * di aggiunta nella DragFilterBar); se omesso usa l'ordine di default.
 */
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

  // Targa è l'ultimo livello
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
      .select('cc_tipo, cc_sede, cc_cliente, categoria, fornitore, paese, targhe')
      .then(({ data }) => setAllRows((data ?? []) as FacetRow[]))
  }, [])

  const options = useMemo((): FacetedOptions => {
    const chain = buildChain(activeDimIds ?? DEFAULT_ORDER)
    const inChain = new Set(chain.map(c => c.filter))

    const dimOptions: Partial<Record<CascadeKey, string[]>> = {}
    let filtered = allRows

    for (const { filter, rowKey } of chain) {
      dimOptions[filter] = distinct(filtered, rowKey)
      filtered = applyFilter(filtered, rowKey, filters[filter] as string[])
    }

    // Dimensioni non nella chain: mostra tutti i valori disponibili senza cascata
    for (const key of Object.keys(DIM_TO_ROW) as CascadeKey[]) {
      if (!inChain.has(key)) {
        dimOptions[key] = distinct(allRows, DIM_TO_ROW[key])
      }
    }

    return {
      ccTipo:    dimOptions.ccTipo    ?? [],
      ccSede:    dimOptions.ccSede    ?? [],
      ccCliente: dimOptions.ccCliente ?? [],
      categoria: dimOptions.categoria ?? [],
      fornitore: dimOptions.fornitore ?? [],
      paese:     dimOptions.paese     ?? [],
      targhe:    distinctTarghe(filtered),
    }
  }, [allRows, filters.ccTipo, filters.ccSede, filters.ccCliente, filters.categoria, filters.fornitore, filters.paese, activeDimIds])

  return { options, allRows }
}
