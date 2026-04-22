import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { FacetedOptions } from '@/hooks/useFacetedOptions'
import DataTable from './DataTable'
import DataCards from './DataCards'
import RowEditModal from './RowEditModal'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import { CreatePlanModal } from '@/components/rimborsi/CreatePlanModal'
import type { RowPatch } from './RowEditModal'
import type { Purchase } from '@/types'
import type { PlanBadge } from '@/hooks/usePlanBadges'

interface Props {
  purchases:          Purchase[]
  loading:            boolean
  error:              string | null
  options:            FacetedOptions
  onRinnoviChange:    (id: string, value: 'ricorrente' | 'una tantum' | null) => Promise<void>
  onRimborsoChange:   (id: string, value: 'rimborsata' | 'non rimborsata' | null) => Promise<void>
  onRowUpdate:        (id: string, patch: RowPatch) => Promise<void>
  onDeleteRow:        (id: string) => Promise<void>
  highlightUploadId:  string | null
  planBadges?:        Record<string, PlanBadge>
  onPlanCreated?:     () => void
}

export default function DataView({ purchases, loading, error, options, onRinnoviChange, onRimborsoChange, onRowUpdate, onDeleteRow, highlightUploadId, planBadges, onPlanCreated }: Props) {
  const isMobile = useIsMobile()
  const [editingRow, setEditingRow] = useState<Purchase | null>(null)
  const [deletingRow, setDeletingRow] = useState<Purchase | null>(null)
  const [planningRow, setPlanningRow] = useState<Purchase | null>(null)

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
        ? <DataCards
            purchases={purchases}
            onRinnoviChange={onRinnoviChange}
            onRimborsoChange={onRimborsoChange}
            onEditRow={setEditingRow}
            onDeleteRow={setDeletingRow}
            onCreatePlan={setPlanningRow}
            highlightUploadId={highlightUploadId}
            planBadges={planBadges}
          />
        : <DataTable
            purchases={purchases}
            onRinnoviChange={onRinnoviChange}
            onRimborsoChange={onRimborsoChange}
            onEditRow={setEditingRow}
            onDeleteRow={setDeletingRow}
            onCreatePlan={setPlanningRow}
            highlightUploadId={highlightUploadId}
            planBadges={planBadges}
          />
      }
      <RowEditModal
        purchase={editingRow}
        options={options}
        onSave={onRowUpdate}
        onClose={() => setEditingRow(null)}
      />
      <DeleteConfirmDialog
        purchase={deletingRow}
        onConfirm={onDeleteRow}
        onClose={() => setDeletingRow(null)}
      />
      {planningRow && (
        <CreatePlanModal
          purchases={[planningRow]}
          sedeOptions={options.ccSede}
          clienteOptions={options.ccCliente}
          onCreated={() => { setPlanningRow(null); onPlanCreated?.() }}
          onClose={() => setPlanningRow(null)}
        />
      )}
    </>
  )
}
