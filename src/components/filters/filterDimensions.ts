export type DimType = 'multiselect' | 'radio-rinnovi' | 'radio-rimborso' | 'daterange'

export interface FilterDimension {
  id: string
  label: string
  color: string
  bgLight: string
  borderLight: string
  type: DimType
}

export const FILTER_DIMENSIONS: FilterDimension[] = [
  { id: 'ccCliente',  label: 'Cliente',         color: '#3B82F6', bgLight: '#EFF6FF', borderLight: '#BFDBFE', type: 'multiselect' },
  { id: 'ccSede',     label: 'Sede',            color: '#8B5CF6', bgLight: '#F5F3FF', borderLight: '#DDD6FE', type: 'multiselect' },
  { id: 'ccTipo',     label: 'Centro di costo', color: '#06B6D4', bgLight: '#ECFEFF', borderLight: '#A5F3FC', type: 'multiselect' },
  { id: 'categoria',  label: 'Categoria',       color: '#F59E0B', bgLight: '#FFFBEB', borderLight: '#FDE68A', type: 'multiselect' },
  { id: 'fornitore',  label: 'Fornitore',       color: '#10B981', bgLight: '#ECFDF5', borderLight: '#A7F3D0', type: 'multiselect' },
  { id: 'paese',      label: 'Paese',           color: '#84CC16', bgLight: '#F7FEE7', borderLight: '#D9F99D', type: 'multiselect' },
  { id: 'targa',      label: 'Targa',           color: '#EC4899', bgLight: '#FDF2F8', borderLight: '#FBCFE8', type: 'multiselect' },
  { id: 'rinnovi',    label: 'Tipo costo',      color: '#EAB308', bgLight: '#FEFCE8', borderLight: '#FEF08A', type: 'radio-rinnovi' },
  { id: 'rimborso',   label: 'Rimborso',        color: '#EF4444', bgLight: '#FEF2F2', borderLight: '#FECACA', type: 'radio-rimborso' },
  { id: 'dateRange',  label: 'Periodo',         color: '#64748B', bgLight: '#F8FAFC', borderLight: '#CBD5E1', type: 'daterange' },
]

export function dimById(id: string): FilterDimension | undefined {
  return FILTER_DIMENSIONS.find(d => d.id === id)
}

export const CASCADE_DIM_IDS = new Set(['ccCliente', 'ccSede', 'ccTipo', 'categoria', 'fornitore', 'paese'])

export function summaryLabel(vals: string[]): string {
  if (vals.length === 0) return 'Tutti'
  if (vals.length === 1) return vals[0]
  return `${vals.length} selezionati`
}

export function chipLabel(dimId: string, filters: import('@/types').FilterState): string {
  switch (dimId) {
    case 'ccCliente': return summaryLabel(filters.ccCliente)
    case 'ccSede':    return summaryLabel(filters.ccSede)
    case 'ccTipo':    return summaryLabel(filters.ccTipo)
    case 'categoria': return summaryLabel(filters.categoria)
    case 'fornitore': return summaryLabel(filters.fornitore)
    case 'paese':     return summaryLabel(filters.paese)
    case 'targa':     return summaryLabel(filters.targa)
    case 'rinnovi':   return filters.rinnovi ?? 'Tutti'
    case 'rimborso':  return filters.rimborso ?? 'Tutti'
    case 'dateRange': {
      const { from, to } = filters.dateRange
      if (!from && !to) return 'Tutti'
      const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      if (from && to) return `${fmt(from)} – ${fmt(to)}`
      return from ? `Dal ${fmt(from)}` : `Al ${fmt(to!)}`
    }
    default: return 'Tutti'
  }
}

export function initialActiveDims(filters: import('@/types').FilterState): string[] {
  const active: string[] = []
  if (filters.ccCliente.length > 0)  active.push('ccCliente')
  if (filters.ccSede.length > 0)     active.push('ccSede')
  if (filters.ccTipo.length > 0)     active.push('ccTipo')
  if (filters.categoria.length > 0)  active.push('categoria')
  if (filters.fornitore.length > 0)  active.push('fornitore')
  if (filters.paese.length > 0)      active.push('paese')
  if (filters.targa.length > 0)      active.push('targa')
  if (filters.rinnovi !== null)       active.push('rinnovi')
  if (filters.rimborso !== null)      active.push('rimborso')
  if (filters.dateRange.from !== null || filters.dateRange.to !== null) active.push('dateRange')
  return active
}
