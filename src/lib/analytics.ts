import type { Purchase } from '@/types'

export interface MonthlyPoint {
  mese: string
  imponibile: number
  iva: number
  totale: number
}

export interface ByLabel {
  label: string
  valore: number
  count: number
}

export interface RinnoviPoint {
  name: string
  value: number
}

export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#1E3A5F', '#EC4899',
  '#F97316', '#84CC16',
]

export function fmtAxisEur(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`
  return `€${v.toFixed(0)}`
}

function round2(n: number) { return Math.round(n * 100) / 100 }

export function getMonthlyCashflow(purchases: Purchase[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>()
  for (const p of purchases) {
    const key = p.data.slice(0, 7)
    const mese = new Intl.DateTimeFormat('it-IT', { month: 'short', year: '2-digit' })
      .format(new Date(p.data + 'T12:00:00'))
    const cur = map.get(key) ?? { mese, imponibile: 0, iva: 0, totale: 0 }
    cur.imponibile = round2(cur.imponibile + Number(p.imponibile))
    cur.iva = round2(cur.iva + Number(p.iva))
    cur.totale = round2(cur.totale + Number(p.imponibile) + Number(p.iva))
    map.set(key, cur)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
}

export function getByField(purchases: Purchase[], field: keyof Purchase, topN = 10): ByLabel[] {
  const map = new Map<string, ByLabel>()
  for (const p of purchases) {
    const key = (p[field] as string | null | boolean) ?? 'N/D'
    const label = String(key)
    const cur = map.get(label) ?? { label, valore: 0, count: 0 }
    cur.valore = round2(cur.valore + Number(p.imponibile))
    cur.count++
    map.set(label, cur)
  }
  const sorted = [...map.values()].sort((a, b) => b.valore - a.valore)
  if (sorted.length <= topN) return sorted

  const top = sorted.slice(0, topN - 1)
  const rest = sorted.slice(topN - 1)
  const altroValore = round2(rest.reduce((s, x) => s + x.valore, 0))
  const altroCount = rest.reduce((s, x) => s + x.count, 0)
  return [...top, { label: 'Altro', valore: altroValore, count: altroCount }]
}

export function getRinnovi(purchases: Purchase[]): RinnoviPoint[] {
  let ricorrente = 0, unaTantum = 0, nessuno = 0
  for (const p of purchases) {
    const v = Number(p.imponibile)
    if (p.rinnovi === 'ricorrente') ricorrente += v
    else if (p.rinnovi === 'una tantum') unaTantum += v
    else nessuno += v
  }
  return [
    { name: 'Ricorrente', value: round2(ricorrente) },
    { name: 'Una tantum', value: round2(unaTantum) },
    { name: 'Non classificato', value: round2(nessuno) },
  ].filter(x => x.value > 0)
}
