import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExpenseQuota, Purchase, QuotaStato } from '@/types'

export type QuotaWithPurchase = ExpenseQuota & { purchase: Purchase }

// ─── useCalendarQuotas ────────────────────────────────────────────────────────
// Carica tutte le quote in un range di mesi (tipicamente -1/+1 rispetto al
// mese visualizzato) e le raggruppa per periodo (chiave "YYYY-MM-01").

export function useCalendarQuotas(from: string, to: string) {
  const [quotasByDay, setQuotasByDay] = useState<Map<string, QuotaWithPurchase[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('expense_quotas')
        .select('*, purchase:purchases(*)')
        .gte('periodo', from)
        .lte('periodo', to)
        .order('periodo')
      if (err) throw err

      const map = new Map<string, QuotaWithPurchase[]>()
      for (const q of (data ?? []) as QuotaWithPurchase[]) {
        const list = map.get(q.periodo) ?? []
        list.push(q)
        map.set(q.periodo, list)
      }
      setQuotasByDay(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore calendario')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { void fetch() }, [fetch])

  const updateQuotaStato = useCallback(
    async (quotaId: string, nuovoStato: QuotaStato): Promise<boolean> => {
      // Optimistic update
      setQuotasByDay(prev => {
        const next = new Map(prev)
        for (const [day, list] of next) {
          const updated = list.map(q =>
            q.id === quotaId
              ? {
                  ...q,
                  stato: nuovoStato,
                  data_rimborso: nuovoStato === 'rimborsata'
                    ? new Date().toISOString().slice(0, 10)
                    : null,
                }
              : q
          )
          next.set(day, updated)
        }
        return next
      })

      const { error: err } = await supabase
        .from('expense_quotas')
        .update({
          stato: nuovoStato,
          data_rimborso: nuovoStato === 'rimborsata'
            ? new Date().toISOString().slice(0, 10)
            : null,
        })
        .eq('id', quotaId)

      if (err) { void fetch(); return false }
      return true
    },
    [fetch]
  )

  return { quotasByDay, loading, error, refresh: fetch, updateQuotaStato }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

export function addMonthsToIso(iso: string, n: number): string {
  const [y, m] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}
