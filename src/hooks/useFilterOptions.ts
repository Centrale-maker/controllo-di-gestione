import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface FilterOptions {
  centroCosto: string[]
  categoria: string[]
  fornitore: string[]
  paese: string[]
}

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>({
    centroCosto: [], categoria: [], fornitore: [], paese: [],
  })

  useEffect(() => {
    async function load() {
      try {
        const [cc, cat, forn, paese] = await Promise.all([
          supabase.from('purchases').select('centro_costo').not('centro_costo', 'is', null),
          supabase.from('purchases').select('categoria').not('categoria', 'is', null),
          supabase.from('purchases').select('fornitore').not('fornitore', 'is', null),
          supabase.from('purchases').select('paese').not('paese', 'is', null),
        ])
        setOptions({
          centroCosto: [...new Set((cc.data ?? []).map(r => r.centro_costo as string))].sort(),
          categoria: [...new Set((cat.data ?? []).map(r => r.categoria as string))].sort(),
          fornitore: [...new Set((forn.data ?? []).map(r => r.fornitore as string))].sort(),
          paese: [...new Set((paese.data ?? []).map(r => r.paese as string))].sort(),
        })
      } catch {
        // silenzioso — i filtri resteranno vuoti
      }
    }
    load()
  }, [])

  return options
}
