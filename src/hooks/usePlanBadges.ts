import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ─── usePlanBadges ────────────────────────────────────────────────────────────
// Carica per ogni purchase che ha un piano di rimborso:
// quante quote sono rimborsate vs totali (su tutti i periodi).
// Usato dalla Dashboard per mostrare "1 di 6" accanto alla pill rimborso.

export interface PlanBadge {
  rimborsate: number
  totali: number
}

export function usePlanBadges(purchaseIds: string[]) {
  const [badges, setBadges] = useState<Record<string, PlanBadge>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const key = purchaseIds.slice().sort().join(',')

  useEffect(() => {
    if (purchaseIds.length === 0) {
      setBadges({})
      return
    }

    async function load() {
      try {
        const { data, error } = await supabase
          .from('expense_quotas')
          .select('purchase_id, stato')
          .in('purchase_id', purchaseIds)

        if (error || !data) return

        const map: Record<string, PlanBadge> = {}
        for (const row of data as { purchase_id: string; stato: string }[]) {
          if (!map[row.purchase_id]) map[row.purchase_id] = { rimborsate: 0, totali: 0 }
          map[row.purchase_id].totali++
          if (row.stato === 'rimborsata') map[row.purchase_id].rimborsate++
        }
        setBadges(map)
      } catch {
        // silenzioso
      }
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshKey])

  function refresh() { setRefreshKey(k => k + 1) }

  return { badges, refresh }
}
