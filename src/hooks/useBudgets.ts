import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Budget } from '@/types'

export interface BudgetSummary extends Budget {
  totale_costi: number
  totale_ricavi: number
  margine: number
  n_centri: number
  n_voci: number
}

export function useBudgets() {
  const { company } = useAuth()
  const [budgets, setBudgets] = useState<BudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!company?.id) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: bs, error: bErr },
        { data: voci, error: vErr },
        { data: centri, error: cErr },
      ] = await Promise.all([
        supabase.from('budgets').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
        supabase.from('budget_voci').select('budget_id, costo_stimato, prezzo_vendita').eq('company_id', company.id),
        supabase.from('budget_centri').select('id, budget_id').eq('company_id', company.id),
      ])
      if (bErr) throw new Error(bErr.message)
      if (vErr) throw new Error(vErr.message)
      if (cErr) throw new Error(cErr.message)

      const vociMap = new Map<string, { costi: number; ricavi: number; count: number }>()
      for (const v of voci ?? []) {
        const e = vociMap.get(v.budget_id) ?? { costi: 0, ricavi: 0, count: 0 }
        e.costi += Number(v.costo_stimato)
        e.ricavi += Number(v.prezzo_vendita)
        e.count++
        vociMap.set(v.budget_id, e)
      }

      const centriMap = new Map<string, number>()
      for (const c of centri ?? []) {
        centriMap.set(c.budget_id, (centriMap.get(c.budget_id) ?? 0) + 1)
      }

      setBudgets(
        (bs ?? []).map(b => {
          const agg = vociMap.get(b.id) ?? { costi: 0, ricavi: 0, count: 0 }
          return {
            ...(b as Budget),
            totale_costi: agg.costi,
            totale_ricavi: agg.ricavi,
            margine: agg.ricavi - agg.costi,
            n_centri: centriMap.get(b.id) ?? 0,
            n_voci: agg.count,
          }
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento budget')
    } finally {
      setLoading(false)
    }
  }, [company?.id])

  useEffect(() => { load() }, [load])

  return { budgets, loading, error, reload: load }
}
