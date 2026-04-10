import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FilterState, Purchase } from '@/types'

export function usePurchases(filters: FilterState) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = JSON.stringify(filters)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        let query = supabase.from('purchases').select('*')

        if (filters.dateRange.from) {
          query = query.gte('data', filters.dateRange.from.toISOString().slice(0, 10))
        }
        if (filters.dateRange.to) {
          query = query.lte('data', filters.dateRange.to.toISOString().slice(0, 10))
        }
        if (filters.scadenzaRange.from) {
          query = query.gte('prox_scadenza', filters.scadenzaRange.from.toISOString().slice(0, 10))
        }
        if (filters.scadenzaRange.to) {
          query = query.lte('prox_scadenza', filters.scadenzaRange.to.toISOString().slice(0, 10))
        }
        if (filters.centroCosto.length > 0) {
          query = query.in('centro_costo', filters.centroCosto)
        }
        if (filters.ccTipo.length > 0) {
          query = query.in('cc_tipo', filters.ccTipo)
        }
        if (filters.ccSede.length > 0) {
          query = query.in('cc_sede', filters.ccSede)
        }
        if (filters.ccCliente.length > 0) {
          query = query.in('cc_cliente', filters.ccCliente)
        }
        if (filters.categoria.length > 0) {
          query = query.in('categoria', filters.categoria)
        }
        if (filters.fornitore.length > 0) {
          query = query.in('fornitore', filters.fornitore)
        }
        if (filters.rinnovi) {
          query = query.eq('rinnovi', filters.rinnovi)
        }
        if (filters.targa.length > 0) {
          // ov = overlaps: restituisce righe il cui array targhe ha almeno una targa in comune con il filtro
          query = query.filter('targhe', 'ov', `{${filters.targa.join(',')}}`)
        }
        if (filters.paese.length > 0) {
          query = query.in('paese', filters.paese)
        }
        if (filters.soloScaduti) {
          const today = new Date().toISOString().slice(0, 10)
          query = query.lt('prox_scadenza', today).not('prox_scadenza', 'is', null)
        }
        if (filters.ftElettronica !== null) {
          query = query.eq('ft_elettronica', filters.ftElettronica)
        }
        if (filters.imponibileRange.min !== null) {
          query = query.gte('imponibile', filters.imponibileRange.min)
        }
        if (filters.imponibileRange.max !== null) {
          query = query.lte('imponibile', filters.imponibileRange.max)
        }
        if (filters.searchText.trim()) {
          query = query.or(
            `fornitore.ilike.%${filters.searchText}%,descrizione.ilike.%${filters.searchText}%`
          )
        }

        const { data, error: fetchError } = await query.order('data', { ascending: false })
        if (fetchError) throw new Error(fetchError.message)
        if (!cancelled) setPurchases((data ?? []) as Purchase[])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore nel caricamento')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  async function updateRinnovi(id: string, value: 'ricorrente' | 'una tantum' | null) {
    const previous = purchases.find(p => p.id === id)?.rinnovi ?? null
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, rinnovi: value } : p))
    const { error } = await supabase
      .from('purchases')
      .update({ rinnovi: value })
      .eq('id', id)
    if (error) {
      setPurchases(prev => prev.map(p => p.id === id ? { ...p, rinnovi: previous } : p))
      throw new Error(error.message)
    }
  }

  async function updateRow(
    id: string,
    patch: Partial<Pick<Purchase, 'cc_tipo' | 'cc_sede' | 'cc_cliente' | 'categoria' | 'targhe'>>
  ) {
    const previous = purchases.find(p => p.id === id)
    if (!previous) return
    // optimistic update
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    const { error } = await supabase.from('purchases').update(patch).eq('id', id)
    if (error) {
      // revert
      setPurchases(prev => prev.map(p => p.id === id ? previous : p))
      throw new Error(error.message)
    }
  }

  return { purchases, loading, error, updateRinnovi, updateRow }
}
