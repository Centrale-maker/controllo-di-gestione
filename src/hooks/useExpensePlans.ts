import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExpensePlan, ExpenseQuota } from '@/types'

// ─── useExpensePlans ──────────────────────────────────────────────────────────
// CRUD piani di rimborso. Espone anche createPlanWithQuotas che inserisce
// atomicamente il piano e tutte le sue quote.

export interface SedeCliente {
  sede: string
  percentuale: number           // 0-100
  clienti: { cliente: string; percentuale: number }[]
}

export interface CreatePlanInput {
  purchase_id: string
  importo_totale: number
  n_periodi: number
  data_inizio: string           // ISO date "YYYY-MM-01"
  note?: string
  sedi: SedeCliente[]           // array vuoto = nessuna suddivisione sede
}

export function useExpensePlans() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Crea piano + quote ────────────────────────────────────────────────────
  const createPlanWithQuotas = useCallback(
    async (input: CreatePlanInput): Promise<{ plan: ExpensePlan; quotas: ExpenseQuota[] } | null> => {
      setLoading(true)
      setError(null)
      try {
        // 1. Recupera company_id dal profilo utente
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .single()
        if (profErr || !profile?.company_id) throw new Error('Impossibile recuperare company_id')
        const companyId = profile.company_id as string

        // 2. Insert piano
        const { data: planData, error: planErr } = await supabase
          .from('expense_plans')
          .insert({
            company_id: companyId,
            purchase_id: input.purchase_id,
            importo_totale: input.importo_totale,
            n_periodi: input.n_periodi,
            data_inizio: input.data_inizio,
            note: input.note ?? null,
          })
          .select()
          .single()
        if (planErr) throw planErr
        const plan = planData as ExpensePlan

        // 3. Genera le quote
        const quotas = buildQuotas(plan, input, companyId)

        // 4. Insert quote
        const { data: quotasData, error: quotasErr } = await supabase
          .from('expense_quotas')
          .insert(quotas)
          .select()
        if (quotasErr) throw quotasErr

        return { plan, quotas: quotasData as ExpenseQuota[] }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore creazione piano')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ── Modifica piano: aggiorna metadati + rigenera quote non rimborsate ────
  const editPlanWithQuotas = useCallback(
    async (planId: string, input: CreatePlanInput): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .single()
        if (profErr || !profile?.company_id) throw new Error('Impossibile recuperare company_id')
        const companyId = profile.company_id as string

        // 1. Elimina SOLO le quote non rimborsate (le rimborsate restano intatte)
        const { error: delErr } = await supabase
          .from('expense_quotas')
          .delete()
          .eq('plan_id', planId)
          .eq('stato', 'da_rimborsare')
        if (delErr) throw delErr

        // 2. Aggiorna il piano
        const { data: planData, error: planErr } = await supabase
          .from('expense_plans')
          .update({
            purchase_id: input.purchase_id,
            importo_totale: input.importo_totale,
            n_periodi: input.n_periodi,
            data_inizio: input.data_inizio,
            note: input.note ?? null,
          })
          .eq('id', planId)
          .select()
          .single()
        if (planErr) throw planErr
        const plan = planData as ExpensePlan

        // 3. Rigenera solo le quote da_rimborsare (salta i periodi già rimborsati)
        const { data: rimborsate } = await supabase
          .from('expense_quotas')
          .select('quota_index')
          .eq('plan_id', planId)
          .eq('stato', 'rimborsata')
        const periodiGiaRimborsati = new Set(
          (rimborsate ?? []).map((r: { quota_index: number }) => r.quota_index)
        )

        const nuoveQuote = buildQuotas(plan, input, companyId)
          .filter(q => !periodiGiaRimborsati.has(q.quota_index))

        if (nuoveQuote.length > 0) {
          const { error: insErr } = await supabase
            .from('expense_quotas')
            .insert(nuoveQuote)
          if (insErr) throw insErr
        }

        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore modifica piano')
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ── Elimina piano (e tutte le sue quote via CASCADE) ─────────────────────
  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('expense_plans')
        .delete()
        .eq('id', planId)
      if (err) throw err
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore eliminazione piano')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, createPlanWithQuotas, editPlanWithQuotas, deletePlan }
}

// ─── Generatore quote ─────────────────────────────────────────────────────────
// Dato un piano e la configurazione sedi/clienti, genera tutte le righe expense_quotas.

function buildQuotas(
  plan: ExpensePlan,
  input: CreatePlanInput,
  companyId: string
): Omit<ExpenseQuota, 'id' | 'created_at' | 'updated_at'>[] {
  const quotas: Omit<ExpenseQuota, 'id' | 'created_at' | 'updated_at'>[] = []
  const importoPerPeriodo = round2(input.importo_totale / input.n_periodi)

  // Calcola le voci per periodo (sede × cliente oppure voce unica)
  const voci = buildVoci(importoPerPeriodo, input.sedi)

  for (let i = 0; i < input.n_periodi; i++) {
    const periodo = addMonths(input.data_inizio, i)

    for (const voce of voci) {
      quotas.push({
        company_id: companyId,
        plan_id: plan.id,
        purchase_id: input.purchase_id,
        periodo,
        sede: voce.sede,
        cliente: voce.cliente,
        importo: voce.importo,
        quota_index: i + 1,
        quota_totale: input.n_periodi,
        stato: 'da_rimborsare',
        data_rimborso: null,
        note: null,
      })
    }
  }

  return quotas
}

interface Voce {
  sede: string | null
  cliente: string | null
  importo: number
}

function buildVoci(importoPerPeriodo: number, sedi: SedeCliente[]): Voce[] {
  if (sedi.length === 0) {
    // Nessuna suddivisione
    return [{ sede: null, cliente: null, importo: importoPerPeriodo }]
  }

  const voci: Voce[] = []

  for (const sede of sedi) {
    const importoSede = round2(importoPerPeriodo * (sede.percentuale / 100))

    if (sede.clienti.length === 0) {
      voci.push({ sede: sede.sede, cliente: null, importo: importoSede })
    } else {
      for (const cl of sede.clienti) {
        const importoCliente = round2(importoSede * (cl.percentuale / 100))
        voci.push({ sede: sede.sede, cliente: cl.cliente, importo: importoCliente })
      }
    }
  }

  return voci
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
