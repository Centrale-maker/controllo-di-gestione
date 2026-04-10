import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface FilterOptions {
  centroCosto: string[]
  ccTipo: string[]
  ccSede: string[]
  ccCliente: string[]
  categoria: string[]
  fornitore: string[]
  paese: string[]
}

function distinct(rows: Record<string, unknown>[], key: string): string[] {
  return [...new Set(rows.map(r => r[key] as string).filter(Boolean))].sort()
}

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>({
    centroCosto: [], ccTipo: [], ccSede: [], ccCliente: [],
    categoria: [], fornitore: [], paese: [],
  })

  useEffect(() => {
    async function load() {
      try {
        const [cc, ccTipo, ccSede, ccCliente, cat, forn, paese] = await Promise.all([
          supabase.from('purchases').select('centro_costo').not('centro_costo', 'is', null),
          supabase.from('purchases').select('cc_tipo').not('cc_tipo', 'is', null),
          supabase.from('purchases').select('cc_sede').not('cc_sede', 'is', null),
          supabase.from('purchases').select('cc_cliente').not('cc_cliente', 'is', null),
          supabase.from('purchases').select('categoria').not('categoria', 'is', null),
          supabase.from('purchases').select('fornitore').not('fornitore', 'is', null),
          supabase.from('purchases').select('paese').not('paese', 'is', null),
        ])
        setOptions({
          centroCosto: distinct(cc.data ?? [], 'centro_costo'),
          ccTipo:      distinct(ccTipo.data ?? [], 'cc_tipo'),
          ccSede:      distinct(ccSede.data ?? [], 'cc_sede'),
          ccCliente:   distinct(ccCliente.data ?? [], 'cc_cliente'),
          categoria:   distinct(cat.data ?? [], 'categoria'),
          fornitore:   distinct(forn.data ?? [], 'fornitore'),
          paese:       distinct(paese.data ?? [], 'paese'),
        })
      } catch {
        // silenzioso — i filtri resteranno vuoti
      }
    }
    load()
  }, [])

  return options
}
