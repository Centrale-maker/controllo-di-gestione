import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { parseRevenuesExcel } from '@/lib/parserRevenues'
import { upsertRevenues, type UpsertRevenuesResult } from '@/lib/upsertRevenues'
import { useAuth } from '@/hooks/useAuth'

export type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'done' | 'error'

interface UploadState {
  status: UploadStatus
  progress: number
  filename: string
  result: UpsertRevenuesResult | null
  error: string | null
}

const INITIAL: UploadState = { status: 'idle', progress: 0, filename: '', result: null, error: null }

export function useUploadRevenues() {
  const { user, profile } = useAuth()
  const [state, setState] = useState<UploadState>(INITIAL)

  function reset() { setState(INITIAL) }

  async function handleFile(file: File) {
    if (!user || !profile?.company_id) {
      setState(s => ({ ...s, status: 'error', filename: file.name, error: 'Profilo utente non configurato correttamente.' }))
      return
    }
    const companyId = profile.company_id
    setState({ status: 'parsing', progress: 0, filename: file.name, result: null, error: null })

    let uploadId = ''
    try {
      const { data: uploadRow, error: insertError } = await supabase
        .from('uploads')
        .insert({ uploaded_by: user.id, filename: file.name, status: 'processing', company_id: companyId, tipo: 'ricavi' })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)
      uploadId = uploadRow.id as string

      const revenues = await parseRevenuesExcel(file)

      setState(s => ({ ...s, status: 'uploading' }))
      const result = await upsertRevenues(revenues, uploadId, companyId, pct => {
        setState(s => ({ ...s, progress: pct }))
      })

      await supabase
        .from('uploads')
        .update({ status: 'success', row_count: revenues.length, rows_added: result.added, rows_updated: result.updated, rows_unchanged: result.unchanged })
        .eq('id', uploadId)

      setState(s => ({ ...s, status: 'done', progress: 100, result }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      if (uploadId) await supabase.from('uploads').update({ status: 'error', error_message: message }).eq('id', uploadId)
      setState(s => ({ ...s, status: 'error', error: message }))
    }
  }

  return { state, handleFile, reset }
}
