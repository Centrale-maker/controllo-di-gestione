import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { FilterOptions } from '@/hooks/useFilterOptions'
import DataTable from './DataTable'
import DataCards from './DataCards'
import RowEditModal from './RowEditModal'
import type { RowPatch } from './RowEditModal'
import type { Purchase } from '@/types'

interface Props {
  purchases:       Purchase[]
  loading:         boolean
  error:           string | null
  options:         FilterOptions
  onRinnoviChange: (id: string, value: 'ricorrente' | 'una tantum' | null) => Promise<void>
  onRowUpdate:     (id: string, patch: RowPatch) => Promise<void>
}

export default function DataView({ purchases, loading, error, options, onRinnoviChange, onRowUpdate }: Props) {
  const isMobile = useIsMobile()
  const [editingRow, setEditingRow] = useState<Purchase | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#64748B]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#EF4444]/30 px-4 py-8 text-center">
        <p className="text-sm text-[#EF4444]">{error}</p>
      </div>
    )
  }

  return (
    <>
      {isMobile
        ? <DataCards purchases={purchases} onRinnoviChange={onRinnoviChange} onEditRow={setEditingRow} />
        : <DataTable purchases={purchases} onRinnoviChange={onRinnoviChange} onEditRow={setEditingRow} />
      }
      <RowEditModal
        purchase={editingRow}
        options={options}
        onSave={onRowUpdate}
        onClose={() => setEditingRow(null)}
      />
    </>
  )
}
