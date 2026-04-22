import { useState } from 'react'
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { X, GripVertical, RotateCcw } from 'lucide-react'
import {
  FILTER_DIMENSIONS, dimById, CASCADE_DIM_IDS,
  chipLabel, initialActiveDims, type FilterDimension,
} from './filterDimensions'
import FilterValuePopover from './FilterValuePopover'
import type { FilterState } from '@/types'
import type { FacetedOptions, FacetRow, CascadeKey } from '@/hooks/useFacetedOptions'
import { cascadeReset } from '@/hooks/useFacetedOptions'

interface Props {
  filters: FilterState
  options: FacetedOptions
  allRows: FacetRow[]
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  patchFilters: (patch: Partial<FilterState>) => void
  resetFilters: () => void
}

function PalettePill({ dim }: { dim: FilterDimension }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${dim.id}`, data: { dimId: dim.id },
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-grab select-none transition-opacity ${isDragging ? 'opacity-30' : 'hover:opacity-75'}`}
      style={{ background: dim.bgLight, border: `1px solid ${dim.borderLight}`, color: dim.color }}
    >
      <GripVertical size={10} className="opacity-40 shrink-0" />
      {dim.label}
    </div>
  )
}

function DropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'active-zone' })
  return (
    <div ref={setNodeRef}
      className={`flex-1 flex flex-wrap items-center gap-2 min-h-[42px] px-3 py-2 rounded-xl border-2 border-dashed transition-colors ${
        isOver ? 'border-[#3B82F6] bg-[#EFF6FF]' : 'border-[#E2E8F0]'
      }`}
    >
      {children}
    </div>
  )
}

function resetDim(dimId: string, setFilter: Props['setFilter'], patchFilters: Props['patchFilters'], allRows: FacetRow[], filters: FilterState) {
  if (CASCADE_DIM_IDS.has(dimId)) {
    patchFilters(cascadeReset(allRows, dimId as CascadeKey, [], filters))
  } else if (dimId === 'targa')     { setFilter('targa', []) }
  else if (dimId === 'rinnovi')     { setFilter('rinnovi', null) }
  else if (dimId === 'rimborso')    { setFilter('rimborso', null) }
  else if (dimId === 'dateRange')   { setFilter('dateRange', { from: null, to: null }) }
}

export default function DragFilterBar({ filters, options, allRows, setFilter, patchFilters, resetFilters }: Props) {
  const [activeDimIds, setActiveDimIds] = useState<string[]>(() => initialActiveDims(filters))
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [draggingDimId, setDraggingDimId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const visibleDims = FILTER_DIMENSIONS.filter(d => d.id !== 'targa' || options.targhe.length > 0)
  const paletteDims = visibleDims.filter(d => !activeDimIds.includes(d.id))
  const activeChips = activeDimIds.map(id => dimById(id)).filter((d): d is FilterDimension => !!d)
  const activeCount = activeDimIds.length

  function addDim(dimId: string) {
    if (!activeDimIds.includes(dimId)) {
      setActiveDimIds(prev => [...prev, dimId])
      setOpenPopoverId(dimId)
    }
  }

  function removeDim(dimId: string) {
    setActiveDimIds(prev => prev.filter(id => id !== dimId))
    if (openPopoverId === dimId) setOpenPopoverId(null)
    resetDim(dimId, setFilter, patchFilters, allRows, filters)
  }

  function handleReset() {
    setActiveDimIds([])
    setOpenPopoverId(null)
    resetFilters()
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggingDimId(null)
    if (e.over?.id === 'active-zone') {
      const dimId = (e.active.data.current as { dimId: string })?.dimId
      if (dimId) addDim(dimId)
    }
  }

  return (
    <div className="border-b border-[#E2E8F0] bg-white px-6 py-3">
      <DndContext
        sensors={sensors}
        onDragStart={e => setDraggingDimId((e.active.data.current as { dimId: string })?.dimId ?? null)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-4">

          {/* Palette dimensioni */}
          <div className="shrink-0 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Dimensioni</p>
            <div className="flex flex-wrap gap-1.5 max-w-[260px]">
              {paletteDims.map(dim => (
                <div key={dim.id} onClick={() => addDim(dim.id)}>
                  <PalettePill dim={dim} />
                </div>
              ))}
              {paletteDims.length === 0 && (
                <span className="text-xs text-[#94A3B8] italic">Tutti i filtri attivi</span>
              )}
            </div>
          </div>

          {/* Separatore */}
          <div className="w-px self-stretch bg-[#E2E8F0] shrink-0 my-0.5" />

          {/* Zona filtri attivi */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Filtri attivi</p>
              {activeCount > 0 && (
                <button onClick={handleReset}
                  className="flex items-center gap-1 text-[10px] text-[#64748B] hover:text-[#1A202C]"
                >
                  <RotateCcw size={10} />Reset
                </button>
              )}
            </div>
            <DropZone>
              {activeChips.length === 0 && (
                <span className="text-xs text-[#94A3B8] select-none">
                  Trascina o clicca una dimensione per aggiungere un filtro…
                </span>
              )}
              {activeChips.map(dim => (
                <div key={dim.id} className="relative">
                  <button
                    onClick={() => setOpenPopoverId(openPopoverId === dim.id ? null : dim.id)}
                    className="flex items-center gap-1.5 pl-2.5 pr-7 py-1.5 rounded-full text-xs font-medium transition-shadow hover:shadow-md"
                    style={{ background: dim.bgLight, border: `1.5px solid ${dim.color}`, color: dim.color }}
                  >
                    <span className="font-semibold">{dim.label}:</span>
                    <span className="max-w-[120px] truncate">{chipLabel(dim.id, filters)}</span>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); removeDim(dim.id) }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10"
                    style={{ color: dim.color }}
                  >
                    <X size={10} />
                  </button>
                  {openPopoverId === dim.id && (
                    <FilterValuePopover
                      dim={dim} filters={filters} options={options} allRows={allRows}
                      setFilter={setFilter} patchFilters={patchFilters}
                      onClose={() => setOpenPopoverId(null)}
                    />
                  )}
                </div>
              ))}
            </DropZone>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {draggingDimId && (() => {
            const dim = dimById(draggingDimId)
            if (!dim) return null
            return (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium shadow-lg cursor-grabbing"
                style={{ background: dim.bgLight, border: `1px solid ${dim.borderLight}`, color: dim.color }}
              >
                {dim.label}
              </div>
            )
          })()}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
