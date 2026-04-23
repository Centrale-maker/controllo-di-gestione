import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { parseExcel } from '@/lib/parser'
import { upsertPurchases, type UpsertResult } from '@/lib/upsert'
import { useAuth } from '@/hooks/useAuth'

export type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'done' | 'error'

interface UploadState {
  status: UploadStatus
  progress: number
  filename: string
  result: UpsertResult | null
  error: string | null
}

const INITIAL: UploadState = {
  status: 'idle',
  progress: 0,
  filename: '',
  result: null,
  error: null,
}

export function useUpload() {
  const { user, profile } = useAuth()
  const [state, setState] = useState<UploadState>(INITIAL)

  function reset() {
    setState(INITIAL)
  }

  async function handleFile(file: File) {
    if (!user || !profile?.company_id) {
      setState(s => ({ ...s, status: 'error', filename: file.name, error: 'Profilo utente non configurato correttamente. Contatta l\'amministratore.' }))
      return
    }
    const companyId = profile.company_id
    setState({ status: 'parsing', progress: 0, filename: file.name, result: null, error: null })

    let uploadId = ''

    try {
      // 1. Crea record upload in stato 'processing'
      const { data: uploadRow, error: insertError } = await supabase
        .from('uploads')
        .insert({ uploaded_by: user.id, filename: file.name, status: 'processing', company_id: companyId })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)
      uploadId = uploadRow.id as string

      // 2. Parse del file Excel
      const purchases = await parseExcel(file)

      // 3. Upsert con progress
      setState(s => ({ ...s, status: 'uploading' }))
      const result = await upsertPurchases(purchases, uploadId, companyId, pct => {
        setState(s => ({ ...s, progress: pct }))
      })

      // 4. Aggiorna record upload con risultati
      await supabase
        .from('uploads')
        .update({
          status: 'success',
          row_count: purchases.length,
          rows_added: result.added,
          rows_updated: result.updated,
          rows_unchanged: result.unchanged,
        })
        .eq('id', uploadId)

      setState(s => ({ ...s, status: 'done', progress: 100, result }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'

      if (uploadId) {
        await supabase
          .from('uploads')
          .update({ status: 'error', error_message: message })
          .eq('id', uploadId)
      }

      setState(s => ({ ...s, status: 'error', error: message }))
    }
  }

  return { state, handleFile, reset }
}
