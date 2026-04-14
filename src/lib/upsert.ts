import { supabase } from '@/lib/supabase'
import type { Purchase, PurchaseInsert } from '@/types'

const CHUNK_SIZE = 200

export interface UpsertResult {
  added: number
  updated: number
  unchanged: number
}

function hasChanged(existing: Purchase, incoming: PurchaseInsert): boolean {
  return !(
    existing.prox_scadenza === incoming.prox_scadenza &&
    existing.ft_elettronica === incoming.ft_elettronica &&
    existing.data_ricezione_fe === incoming.data_ricezione_fe &&
    existing.centro_costo === incoming.centro_costo &&
    existing.cc_tipo === incoming.cc_tipo &&
    existing.cc_sede === incoming.cc_sede &&
    existing.cc_cliente === incoming.cc_cliente &&
    existing.categoria === incoming.categoria &&
    existing.fornitore === incoming.fornitore &&
    existing.descrizione === incoming.descrizione &&
    JSON.stringify(existing.targhe ?? null) === JSON.stringify(incoming.targhe ?? null) &&
    existing.rinnovi === incoming.rinnovi &&
    existing.partita_iva === incoming.partita_iva &&
    existing.codice_fiscale === incoming.codice_fiscale &&
    existing.comune === incoming.comune &&
    existing.provincia === incoming.provincia &&
    existing.paese === incoming.paese &&
    Number(existing.imponibile) === incoming.imponibile &&
    Number(existing.iva) === incoming.iva &&
    Number(existing.rit_acconto) === incoming.rit_acconto &&
    Number(existing.rit_prev) === incoming.rit_prev &&
    existing.deducibilita === incoming.deducibilita &&
    existing.detraibilita === incoming.detraibilita &&
    existing.contrassegnato === incoming.contrassegnato
  )
}

export async function upsertPurchases(
  purchases: PurchaseInsert[],
  uploadId: string,
  companyId: string,
  onProgress?: (pct: number) => void
): Promise<UpsertResult> {
  if (purchases.length === 0) return { added: 0, updated: 0, unchanged: 0 }

  // Recupera righe esistenti per confronto (RLS filtra già per company)
  const nrAcquisti = [...new Set(purchases.map(p => p.nr_acquisto))]
  const { data: existing, error: fetchError } = await supabase
    .from('purchases')
    .select('*')
    .in('nr_acquisto', nrAcquisti)

  if (fetchError) throw new Error(fetchError.message)

  const existingMap = new Map<string, Purchase>()
  for (const row of existing ?? []) {
    existingMap.set(`${row.nr_acquisto}|${row.data}`, row as Purchase)
  }

  // Classifica ogni riga
  let added = 0, updated = 0, unchanged = 0
  for (const p of purchases) {
    const ex = existingMap.get(`${p.nr_acquisto}|${p.data}`)
    if (!ex) added++
    else if (hasChanged(ex, p)) updated++
    else unchanged++
  }

  // Upsert a blocchi con progress
  const rows = purchases.map(p => ({ ...p, upload_id: uploadId, company_id: companyId }))
  const chunks: (PurchaseInsert & { upload_id: string; company_id: string })[][] = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE))
  }

  for (let i = 0; i < chunks.length; i++) {
    const { error } = await supabase
      .from('purchases')
      .upsert(chunks[i], { onConflict: 'company_id,nr_acquisto,data', ignoreDuplicates: false })
    if (error) throw new Error(error.message)
    onProgress?.(Math.round(((i + 1) / chunks.length) * 100))
  }

  return { added, updated, unchanged }
}
