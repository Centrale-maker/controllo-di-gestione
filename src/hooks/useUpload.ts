import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { parseExcel, type CcMappingMap } from '@/lib/parser'
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
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>(INITIAL)

  function reset() {
    setState(INITIAL)
  }

  async function handleFile(file: File) {
    if (!user) return
    setState({ status: 'parsing', progress: 0, filename: file.name, result: null, error: null })

    let uploadId = ''

    try {
      // 1. Crea record upload in stato 'processing'
      const { data: uploadRow, error: insertError } = await supabase
        .from('uploads')
        .insert({ uploaded_by: user.id, filename: file.name, status: 'processing' })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)
      uploadId = uploadRow.id as string

      // 2. Carica cc_mapping da Supabase
      const { data: mappingRows } = await supabase
        .from('cc_mapping')
        .select('raw_value, cc_tipo, cc_sede, cc_cliente')
      const ccMapping: CcMappingMap = new Map(
        (mappingRows ?? []).map(r => [
          r.raw_value,
          { cc_tipo: r.cc_tipo, cc_sede: r.cc_sede, cc_cliente: r.cc_cliente },
        ])
      )

      // 3. Parse del file Excel
      const purchases = await parseExcel(file, ccMapping)

      // 4. Upsert con progress
      setState(s => ({ ...s, status: 'uploading' }))
      const result = await upsertPurchases(purchases, uploadId, pct => {
        setState(s => ({ ...s, progress: pct }))
      })

      // 5. Aggiorna record upload con risultati
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
