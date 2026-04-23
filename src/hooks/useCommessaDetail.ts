import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Purchase, Revenue } from '@/types'

interface CommessaDetail {
  purchases: Purchase[]
  revenues: Revenue[]
}

export function useCommessaDetail(id: string | null) {
  const [detail, setDetail] = useState<CommessaDetail>({ purchases: [], revenues: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setDetail({ purchases: [], revenues: [] }); return }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const [{ data: pur, error: pErr }, { data: rev, error: rErr }] = await Promise.all([
          supabase
            .from('purchases')
            .select('*')
            .eq('cc_sede', id)
            .order('data', { ascending: true }),
          supabase
            .from('revenues')
            .select('*')
            .eq('cr_id', id)
            .order('data', { ascending: true }),
        ])
        if (pErr) throw new Error(pErr.message)
        if (rErr) throw new Error(rErr.message)
        if (!cancelled) setDetail({ purchases: (pur ?? []) as Purchase[], revenues: (rev ?? []) as Revenue[] })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  return { detail, loading, error }
}
