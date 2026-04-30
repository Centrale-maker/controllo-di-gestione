import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Budget, BudgetCentro, BudgetVoce } from '@/types'

export interface BudgetCentroWithVoci extends BudgetCentro {
  voci: BudgetVoce[]
}

export interface ConsuntivoCentro {
  nome: string
  costi_stimati: number
  ricavi_stimati: number
  costi_reali: number
}

export interface BudgetDetailData extends Budget {
  centri: BudgetCentroWithVoci[]
  consuntivo: {
    centri: ConsuntivoCentro[]
    ricavi_reali: number
    has_data: boolean
  }
}

export function useBudgetDetail(budgetId: string | null) {
  const [detail, setDetail] = useState<BudgetDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!budgetId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [
        { data: budget, error: bErr },
        { data: centri, error: cErr },
        { data: voci, error: vErr },
      ] = await Promise.all([
        supabase.from('budgets').select('*').eq('id', budgetId).single(),
        supabase.from('budget_centri').select('*').eq('budget_id', budgetId).order('sort_order'),
        supabase.from('budget_voci').select('*').eq('budget_id', budgetId).order('sort_order'),
      ])
      if (bErr) throw new Error(bErr.message)
      if (cErr) throw new Error(cErr.message)
      if (vErr) throw new Error(vErr.message)

      const b = budget as Budget
      const [{ data: purchases }, { data: revenues }] = await Promise.all([
        supabase.from('purchases').select('categoria, imponibile').eq('cc_sede', b.codice),
        supabase.from('revenues').select('imponibile').eq('cr_id', b.codice),
      ])

      const costiReali = new Map<string, number>()
      for (const p of purchases ?? []) {
        const k = p.categoria ?? 'Altro'
        costiReali.set(k, (costiReali.get(k) ?? 0) + Number(p.imponibile))
      }
      const ricavi_reali = (revenues ?? []).reduce((s, r) => s + Number(r.imponibile), 0)

      const vociMap = new Map<string, BudgetVoce[]>()
      for (const v of voci ?? []) {
        const arr = vociMap.get(v.budget_centro_id) ?? []
        arr.push(v as BudgetVoce)
        vociMap.set(v.budget_centro_id, arr)
      }

      const centriWithVoci: BudgetCentroWithVoci[] = (centri ?? []).map(c => ({
        ...(c as BudgetCentro),
        voci: vociMap.get(c.id) ?? [],
      }))

      setDetail({
        ...b,
        centri: centriWithVoci,
        consuntivo: {
          centri: centriWithVoci.map(c => ({
            nome: c.nome,
            costi_stimati: c.voci.reduce((s, v) => s + Number(v.costo_stimato), 0),
            ricavi_stimati: c.voci.reduce((s, v) => s + Number(v.prezzo_vendita), 0),
            costi_reali: costiReali.get(c.nome) ?? 0,
          })),
          ricavi_reali,
          has_data: (purchases?.length ?? 0) > 0 || (revenues?.length ?? 0) > 0,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento budget')
    } finally {
      setLoading(false)
    }
  }, [budgetId])

  useEffect(() => { load() }, [load])

  return { detail, loading, error, reload: load }
}
