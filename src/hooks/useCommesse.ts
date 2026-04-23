import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commessa } from '@/types'

export interface CommesseOptions {
  crTipo: string[]
  ccTipo: string[]
  clienti: string[]
}

export function useCommesse() {
  const [commesse, setCommesse] = useState<Commessa[]>([])
  const [options, setOptions] = useState<CommesseOptions>({ crTipo: [], ccTipo: [], clienti: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [{ data: purchases, error: pErr }, { data: revenues, error: rErr }] = await Promise.all([
          supabase.from('purchases').select('cc_sede, cc_cliente, cc_tipo, imponibile').not('cc_sede', 'is', null),
          supabase.from('revenues').select('cr_id, cr_tipo, cr_cliente, cliente, imponibile'),
        ])

        if (pErr) throw new Error(pErr.message)
        if (rErr) throw new Error(rErr.message)

        // Aggrega costi per ID univoco
        const costiMap = new Map<string, { nome: string; ccTipo: string | null; totale: number; count: number }>()
        for (const p of purchases ?? []) {
          if (!p.cc_sede) continue
          const existing = costiMap.get(p.cc_sede)
          if (existing) {
            existing.totale += Number(p.imponibile)
            existing.count++
          } else {
            costiMap.set(p.cc_sede, {
              nome: p.cc_cliente ?? p.cc_sede,
              ccTipo: p.cc_tipo ?? null,
              totale: Number(p.imponibile),
              count: 1,
            })
          }
        }

        // Aggrega ricavi per ID univoco
        const ricaviMap = new Map<string, { cliente: string | null; crTipo: string | null; totale: number; count: number }>()
        for (const r of revenues ?? []) {
          if (!r.cr_id) continue
          const existing = ricaviMap.get(r.cr_id)
          if (existing) {
            existing.totale += Number(r.imponibile)
            existing.count++
          } else {
            ricaviMap.set(r.cr_id, {
              cliente: r.cr_cliente ?? r.cliente ?? null,
              crTipo: r.cr_tipo ?? null,
              totale: Number(r.imponibile),
              count: 1,
            })
          }
        }

        // Unisci per ID
        const allIds = new Set([...costiMap.keys(), ...ricaviMap.keys()])
        const result: Commessa[] = []

        for (const id of allIds) {
          const costo = costiMap.get(id)
          const ricavo = ricaviMap.get(id)
          const ricavi = ricavo?.totale ?? 0
          const costi = costo?.totale ?? 0
          const margine = ricavi - costi
          result.push({
            id,
            nome: costo?.nome ?? ricavo?.cliente ?? id,
            cliente: ricavo?.cliente ?? null,
            crTipo: ricavo?.crTipo ?? null,
            ccTipo: costo?.ccTipo ?? null,
            ricavi,
            costi,
            margine,
            marginePerc: ricavi > 0 ? (margine / ricavi) * 100 : 0,
            nFatturePas: costo?.count ?? 0,
            nFattureAtt: ricavo?.count ?? 0,
          })
        }

        result.sort((a, b) => b.ricavi - a.ricavi)

        // Opzioni per i filtri
        const crTipoSet = new Set<string>()
        const ccTipoSet = new Set<string>()
        const clientiSet = new Set<string>()
        for (const c of result) {
          if (c.crTipo) crTipoSet.add(c.crTipo)
          if (c.ccTipo) ccTipoSet.add(c.ccTipo)
          if (c.cliente) clientiSet.add(c.cliente)
        }

        if (!cancelled) {
          setCommesse(result)
          setOptions({
            crTipo: [...crTipoSet].sort(),
            ccTipo: [...ccTipoSet].sort(),
            clienti: [...clientiSet].sort(),
          })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore caricamento commesse')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { commesse, options, loading, error }
}
