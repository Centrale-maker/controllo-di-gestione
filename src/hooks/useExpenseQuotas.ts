import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExpenseQuota, Purchase, QuotaStato } from '@/types'

// ─── useExpenseQuotas ─────────────────────────────────────────────────────────
// Carica tutte le quote del mese selezionato + le purchases senza piano
// (rimborso diretto) per lo stesso mese.

export interface QuotasByPurchase {
  purchase: Purchase
  planId: string | null         // null = rimborso diretto (no piano)
  nPeriodi: number | null       // null per rimborso diretto
  quotas: ExpenseQuota[]        // per rimborso diretto: array vuoto
}

export function useExpenseQuotas(periodo: string) {
  // periodo = "YYYY-MM-01"
  const [quotas, setQuotas] = useState<ExpenseQuota[]>([])
  const [directPurchases, setDirectPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Quote del mese (con join purchase e plan)
      const { data: qData, error: qErr } = await supabase
        .from('expense_quotas')
        .select('*, purchase:purchases(*)')
        .eq('periodo', periodo)
        .order('created_at', { ascending: true })
      if (qErr) throw qErr
      const fetchedQuotas = (qData ?? []) as (ExpenseQuota & { purchase: Purchase })[]

      // 2. Purchases del mese senza piano di rimborso
      //    = acquisti con data nel mese che NON hanno quote generate
      const periodoStart = periodo                       // es. "2026-04-01"
      const periodoEnd = lastDayOfMonth(periodo)         // es. "2026-04-30"

      const purchaseIdsWithPlan = [
        ...new Set(fetchedQuotas.map((q) => q.purchase_id)),
      ]

      let purchaseQuery = supabase
        .from('purchases')
        .select('*')
        .gte('data', periodoStart)
        .lte('data', periodoEnd)
        .order('data', { ascending: true })

      // Escludi quelli che hanno già quote
      if (purchaseIdsWithPlan.length > 0) {
        purchaseQuery = purchaseQuery.not(
          'id',
          'in',
          `(${purchaseIdsWithPlan.join(',')})`
        )
      }

      const { data: pData, error: pErr } = await purchaseQuery
      if (pErr) throw pErr

      setQuotas(fetchedQuotas)
      setDirectPurchases((pData ?? []) as Purchase[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento rimborsi')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    void fetch()
  }, [fetch])

  // ── Aggiorna stato quota ────────────────────────────────────────────────────
  const updateQuotaStato = useCallback(
    async (quotaId: string, nuovoStato: QuotaStato): Promise<boolean> => {
      // Optimistic update
      setQuotas((prev) =>
        prev.map((q) =>
          q.id === quotaId
            ? {
                ...q,
                stato: nuovoStato,
                data_rimborso:
                  nuovoStato === 'rimborsata'
                    ? new Date().toISOString().slice(0, 10)
                    : null,
              }
            : q
        )
      )

      const { error: err } = await supabase
        .from('expense_quotas')
        .update({
          stato: nuovoStato,
          data_rimborso:
            nuovoStato === 'rimborsata'
              ? new Date().toISOString().slice(0, 10)
              : null,
        })
        .eq('id', quotaId)

      if (err) {
        // Revert
        void fetch()
        return false
      }
      return true
    },
    [fetch]
  )

  // ── Aggiorna rimborso diretto su purchase ──────────────────────────────────
  const updateDirectRimborso = useCallback(
    async (
      purchaseId: string,
      stato: 'rimborsata' | 'non rimborsata' | null
    ): Promise<boolean> => {
      setDirectPurchases((prev) =>
        prev.map((p) => (p.id === purchaseId ? { ...p, rimborso: stato } : p))
      )

      const { error: err } = await supabase
        .from('purchases')
        .update({ rimborso: stato })
        .eq('id', purchaseId)

      if (err) {
        void fetch()
        return false
      }
      return true
    },
    [fetch]
  )

  // ── Raggruppa quote per purchase ───────────────────────────────────────────
  const groupedByPurchase = buildGrouped(quotas)

  return {
    quotas,
    directPurchases,
    groupedByPurchase,
    loading,
    error,
    refresh: fetch,
    updateQuotaStato,
    updateDirectRimborso,
  }
}

// ─── useExpenseQuotasMultiMonth ───────────────────────────────────────────────
// Versione usata solo per l'export: carica le quote di un range di mesi.

export function useExpenseQuotasMultiMonth(from: string, to: string) {
  const [quotas, setQuotas] = useState<ExpenseQuota[]>([])
  const [directPurchases, setDirectPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: qData, error: qErr } = await supabase
        .from('expense_quotas')
        .select('*, purchase:purchases(*)')
        .gte('periodo', from)
        .lte('periodo', to)
        .order('periodo', { ascending: true })
      if (qErr) throw qErr

      const fetchedQuotas = (qData ?? []) as (ExpenseQuota & { purchase: Purchase })[]
      const purchaseIdsWithPlan = [...new Set(fetchedQuotas.map((q) => q.purchase_id))]

      let pQuery = supabase
        .from('purchases')
        .select('*')
        .gte('data', from)
        .lte('data', lastDayOfMonth(to))
        .order('data')

      if (purchaseIdsWithPlan.length > 0) {
        pQuery = pQuery.not('id', 'in', `(${purchaseIdsWithPlan.join(',')})`)
      }

      const { data: pData, error: pErr } = await pQuery
      if (pErr) throw pErr

      setQuotas(fetchedQuotas)
      setDirectPurchases((pData ?? []) as Purchase[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { quotas, directPurchases, loading, error }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function lastDayOfMonth(isoMonth: string): string {
  const [y, m] = isoMonth.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)) // day 0 del mese successivo = ultimo del mese
  return last.toISOString().slice(0, 10)
}

function buildGrouped(quotas: ExpenseQuota[]): Map<string, ExpenseQuota[]> {
  const map = new Map<string, ExpenseQuota[]>()
  for (const q of quotas) {
    const list = map.get(q.purchase_id) ?? []
    list.push(q)
    map.set(q.purchase_id, list)
  }
  return map
}
