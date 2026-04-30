import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useCategorieOptions() {
  const { company } = useAuth()
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (!company?.id) return
    async function load() {
      const [{ data: fromPurchases }, { data: fromBudget }] = await Promise.all([
        supabase
          .from('purchases')
          .select('categoria')
          .eq('company_id', company!.id)
          .not('categoria', 'is', null),
        supabase
          .from('budget_centri')
          .select('nome')
          .eq('company_id', company!.id),
      ])

      const set = new Set<string>()
      for (const r of fromPurchases ?? []) if (r.categoria) set.add(r.categoria)
      for (const r of fromBudget ?? []) if (r.nome) set.add(r.nome)

      setOptions([...set].sort())
    }
    load()
  }, [company?.id])

  return options
}
