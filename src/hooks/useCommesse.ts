import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commessa } from '@/types'

export function useCommesse() {
  const [commesse, setCommesse] = useState<Commessa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [{ data: purchases, error: pErr }, { data: revenues, error: rErr }] = await Promise.all([
          supabase.from('purchases').select('cc_sede, cc_cliente, imponibile').not('cc_sede', 'is', null),
          supabase.from('revenues').select('cr_id, cr_cliente, cliente, imponibile'),
        ])

        if (pErr) throw new Error(pErr.message)
        if (rErr) throw new Error(rErr.message)

        // Aggrega costi per ID univoco (cc_sede)
        const costiMap = new Map<string, { nome: string; totale: number; count: number }>()
        for (const p of purchases ?? []) {
          if (!p.cc_sede) continue
          const entry = costiMap.get(p.cc_sede) ?? { nome: p.cc_cliente ?? p.cc_sede, totale: 0, count: 0 }
          entry.totale += Number(p.imponibile)
          entry.count++
          if (!costiMap.has(p.cc_sede)) costiMap.set(p.cc_sede, entry)
          else costiMap.get(p.cc_sede)!.totale = entry.totale, costiMap.get(p.cc_sede)!.count = entry.count
        }

        // Aggrega ricavi per ID univoco (cr_id)
        const ricaviMap = new Map<string, { cliente: string | null; totale: number; count: number }>()
        for (const r of revenues ?? []) {
          if (!r.cr_id) continue
          const entry = ricaviMap.get(r.cr_id) ?? { cliente: r.cr_cliente ?? r.cliente ?? null, totale: 0, count: 0 }
          entry.totale += Number(r.imponibile)
          entry.count++
          if (!ricaviMap.has(r.cr_id)) ricaviMap.set(r.cr_id, entry)
          else ricaviMap.get(r.cr_id)!.totale = entry.totale, ricaviMap.get(r.cr_id)!.count = entry.count
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
            ricavi,
            costi,
            margine,
            marginePerc: ricavi > 0 ? (margine / ricavi) * 100 : 0,
            nFatturePas: costo?.count ?? 0,
            nFattureAtt: ricavo?.count ?? 0,
          })
        }

        result.sort((a, b) => b.ricavi - a.ricavi)

        if (!cancelled) setCommesse(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore caricamento commesse')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { commesse, loading, error }
}
