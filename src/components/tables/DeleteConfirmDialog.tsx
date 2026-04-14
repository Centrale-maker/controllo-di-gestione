import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Purchase } from '@/types'

interface Props {
  purchase: Purchase | null
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

export default function DeleteConfirmDialog({ purchase, onConfirm, onClose }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!purchase) return null

  async function handleConfirm() {
    if (!purchase) return
    setDeleting(true)
    setError(null)
    try {
      await onConfirm(purchase.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!deleting ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-xl rounded-t-xl shadow-xl p-5 z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1A202C]">Elimina riga</h2>
            <p className="text-sm text-[#64748B] mt-0.5">
              Questa operazione è irreversibile.
            </p>
          </div>
        </div>

        {/* Riepilogo riga */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-3 mb-4 space-y-1">
          <p className="text-sm font-medium text-[#1A202C] truncate">{purchase.fornitore}</p>
          {purchase.descrizione && (
            <p className="text-xs text-[#64748B] truncate">{purchase.descrizione}</p>
          )}
          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-xs text-[#64748B]">{formatDate(purchase.data)}</span>
            <span className="text-xs font-semibold text-[#1A202C]">
              {formatCurrency(Number(purchase.imponibile))}
            </span>
            {purchase.nr_acquisto && (
              <span className="text-xs text-[#64748B]">#{purchase.nr_acquisto}</span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#EF4444] mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 h-11 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-11 rounded-lg bg-[#EF4444] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            <Trash2 size={15} />
            {deleting ? 'Eliminazione…' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  )
}
