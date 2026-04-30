import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useClientiOptions() {
  const { company } = useAuth()
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (!company?.id) return
    async function load() {
      const [{ data: fromBudgets }, { data: fromRevenues }] = await Promise.all([
        supabase.from('budgets').select('cliente').eq('company_id', company!.id),
        supabase.from('revenues').select('cliente').eq('company_id', company!.id).not('cliente', 'is', null),
      ])
      const set = new Set<string>()
      for (const r of fromBudgets ?? []) if (r.cliente) set.add(r.cliente)
      for (const r of fromRevenues ?? []) if (r.cliente) set.add(r.cliente)
      setOptions([...set].sort())
    }
    load()
  }, [company?.id])

  return options
}
