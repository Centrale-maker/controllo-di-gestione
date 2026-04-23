import { supabase } from '@/lib/supabase'
import type { Revenue, RevenueInsert } from '@/types'

const CHUNK_SIZE = 200

export interface UpsertRevenuesResult {
  added: number
  updated: number
  unchanged: number
}

function hasChanged(existing: Revenue, incoming: RevenueInsert): boolean {
  return !(
    existing.prox_scadenza    === incoming.prox_scadenza &&
    existing.documento        === incoming.documento &&
    existing.serie            === incoming.serie &&
    existing.saldato          === incoming.saldato &&
    existing.centro_ricavo    === incoming.centro_ricavo &&
    existing.cr_tipo          === incoming.cr_tipo &&
    existing.cr_cliente       === incoming.cr_cliente &&
    existing.cr_id            === incoming.cr_id &&
    existing.cliente          === incoming.cliente &&
    existing.comune           === incoming.comune &&
    existing.provincia        === incoming.provincia &&
    existing.paese            === incoming.paese &&
    existing.oggetto_interno  === incoming.oggetto_interno &&
    existing.oggetto_visibile === incoming.oggetto_visibile &&
    Number(existing.imponibile)  === incoming.imponibile &&
    Number(existing.iva)         === incoming.iva &&
    Number(existing.lordo)       === incoming.lordo &&
    existing.contrassegnato   === incoming.contrassegnato
  )
}

export async function upsertRevenues(
  revenues: RevenueInsert[],
  uploadId: string,
  companyId: string,
  onProgress?: (pct: number) => void
): Promise<UpsertRevenuesResult> {
  if (revenues.length === 0) return { added: 0, updated: 0, unchanged: 0 }

  const numeri = [...new Set(revenues.map(r => r.numero))]
  const { data: existing, error: fetchError } = await supabase
    .from('revenues')
    .select('*')
    .in('numero', numeri)

  if (fetchError) throw new Error(fetchError.message)

  const existingMap = new Map<string, Revenue>()
  for (const row of existing ?? []) {
    existingMap.set(`${row.numero}|${row.data}`, row as Revenue)
  }

  let added = 0, updated = 0, unchanged = 0
  for (const r of revenues) {
    const ex = existingMap.get(`${r.numero}|${r.data}`)
    if (!ex) added++
    else if (hasChanged(ex, r)) updated++
    else unchanged++
  }

  const rows = revenues.map(r => ({ ...r, upload_id: uploadId, company_id: companyId }))
  const chunks = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE))

  for (let i = 0; i < chunks.length; i++) {
    const { error } = await supabase
      .from('revenues')
      .upsert(chunks[i], { onConflict: 'company_id,numero,data', ignoreDuplicates: false })
    if (error) throw new Error(error.message)
    onProgress?.(Math.round(((i + 1) / chunks.length) * 100))
  }

  return { added, updated, unchanged }
}
