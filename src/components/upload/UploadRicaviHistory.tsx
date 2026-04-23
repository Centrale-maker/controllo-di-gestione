import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Upload } from '@/types'

interface Props {
  refreshKey?: number
}

export default function UploadRicaviHistory({ refreshKey = 0 }: Props) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('uploads')
          .select('*')
          .eq('tipo', 'ricavi')
          .order('uploaded_at', { ascending: false })
          .limit(10)
        if (error) throw error
        setUploads((data ?? []) as Upload[])
      } catch {
        // errore silenzioso
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  async function handleDelete(u: Upload) {
    if (!confirm(`Eliminare l'import "${u.filename}" (${u.row_count} righe)?\n\nTutti i ricavi associati verranno cancellati.`)) return
    setDeletingId(u.id)
    try {
      const { error: revErr } = await supabase.from('revenues').delete().eq('upload_id', u.id)
      if (revErr) throw new Error(revErr.message)
      const { error: upErr } = await supabase.from('uploads').delete().eq('id', u.id)
      if (upErr) throw new Error(upErr.message)
      setUploads(prev => prev.filter(x => x.id !== u.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore durante la cancellazione.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-[#64748B]" />
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#64748B]">
        <FileSpreadsheet size={32} className="opacity-40" />
        <p className="text-sm">Nessun upload ancora</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {uploads.map(u => (
        <div key={u.id} className="flex items-center gap-3 bg-white rounded-lg border border-[#E2E8F0] px-4 py-3">
          {u.status === 'success'    && <CheckCircle size={18} className="text-[#10B981] shrink-0" />}
          {u.status === 'error'      && <XCircle size={18} className="text-[#EF4444] shrink-0" />}
          {u.status === 'processing' && <Loader2 size={18} className="animate-spin text-[#F59E0B] shrink-0" />}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#1A202C] truncate">{u.filename}</p>
            <p className="text-xs text-[#64748B]">{formatDate(u.uploaded_at)}</p>
          </div>

          {u.status === 'success' && (
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-[#1A202C]">{u.row_count} righe</p>
              <p className="text-xs text-[#64748B]">+{u.rows_added} ~{u.rows_updated}</p>
            </div>
          )}
          {u.status === 'error' && <span className="text-xs text-[#EF4444] shrink-0">Errore</span>}

          <button
            onClick={() => handleDelete(u)}
            disabled={deletingId === u.id}
            title="Elimina import"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors disabled:opacity-40 shrink-0"
          >
            {deletingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      ))}
    </div>
  )
}
