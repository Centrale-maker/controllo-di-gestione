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

// ─── Cascade chain ───────────────────────────────────────────────────────────

export type CascadeKey = 'ccTipo' | 'ccSede' | 'ccCliente' | 'categoria' | 'fornitore' | 'paese'

const CHAIN: Array<{ filter: CascadeKey; rowKey: ScalarKey }> = [
  { filter: 'ccCliente', rowKey: 'cc_cliente' },
  { filter: 'ccSede',    rowKey: 'cc_sede'    },
  { filter: 'ccTipo',    rowKey: 'cc_tipo'    },
  { filter: 'categoria', rowKey: 'categoria'  },
  { filter: 'fornitore', rowKey: 'fornitore'  },
  { filter: 'paese',     rowKey: 'paese'      },
]

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
 * un filtro upstream. Rimuove automaticamente le selezioni non più valide.
 */
export function cascadeReset(
  allRows: FacetRow[],
  changedKey: CascadeKey,
  newValue: string[],
  currentFilters: FilterState,
): Partial<FilterState> {
  const patch: Partial<FilterState> = { [changedKey]: newValue }
  const startIdx = CHAIN.findIndex(c => c.filter === changedKey)

  let filtered = applyFilter(allRows, CHAIN[startIdx].rowKey, newValue)

  for (let i = startIdx + 1; i < CHAIN.length; i++) {
    const { filter, rowKey } = CHAIN[i]
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

export function useFacetedOptions(filters: FilterState): {
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
    const ccCliente = distinct(allRows, 'cc_cliente')

    const a1        = applyFilter(allRows, 'cc_cliente', filters.ccCliente)
    const ccSede    = distinct(a1, 'cc_sede')

    const a2        = applyFilter(a1, 'cc_sede',         filters.ccSede)
    const ccTipo    = distinct(a2, 'cc_tipo')

    const a3        = applyFilter(a2, 'cc_tipo',         filters.ccTipo)
    const categoria = distinct(a3, 'categoria')

    const a4        = applyFilter(a3, 'categoria',       filters.categoria)
    const fornitore = distinct(a4, 'fornitore')

    const a5        = applyFilter(a4, 'fornitore',       filters.fornitore)
    const paese     = distinct(a5, 'paese')

    const a6        = applyFilter(a5, 'paese',           filters.paese)
    const targhe    = distinctTarghe(a6)

    return { ccTipo, ccSede, ccCliente, categoria, fornitore, paese, targhe }
  }, [allRows, filters.ccTipo, filters.ccSede, filters.ccCliente, filters.categoria, filters.fornitore, filters.paese])

  return { options, allRows }
}
