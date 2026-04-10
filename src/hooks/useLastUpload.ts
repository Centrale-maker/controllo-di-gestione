import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LastUploadInfo {
  id: string
  rows_added: number
  rows_updated: number
  uploaded_at: string
}

export function useLastUpload() {
  const [lastUpload, setLastUpload] = useState<LastUploadInfo | null>(null)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('uploads')
        .select('id, rows_added, rows_updated, uploaded_at')
        .eq('status', 'success')
        .is('acknowledged_at', null)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLastUpload(data ?? null)
    }
    fetch()
  }, [])

  const acknowledge = useCallback(async () => {
    if (!lastUpload) return
    setLastUpload(null) // optimistic: toglie subito il verde
    await supabase
      .from('uploads')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', lastUpload.id)
  }, [lastUpload])

  return { lastUpload, acknowledge }
}
