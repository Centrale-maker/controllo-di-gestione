import * as XLSX from 'xlsx'
import type { PurchaseInsert } from '@/types'

// ─── Mapping colonne Excel → campo DB ────────────────────────────────────────

const HEADER_MAP: Record<string, string> = {
  'data': 'data',
  'prox scadenza': 'prox_scadenza',
  'nr. acquisto': 'nr_acquisto',
  'ft elettronica': 'ft_elettronica',
  'data ricezione fe': 'data_ricezione_fe',
  'centro costo': 'centro_costo',
  'categoria': 'categoria',
  'fornitore': 'fornitore',
  'descrizione': 'descrizione',
  'rinnovi': 'rinnovi',
  'partita iva': 'partita_iva',
  'codice fiscale': 'codice_fiscale',
  'comune': 'comune',
  'provincia': 'provincia',
  'paese': 'paese',
  'imponibile': 'imponibile',
  'iva': 'iva',
  'rit. acconto': 'rit_acconto',
  'rit. prev.': 'rit_prev',
  'deducibilità': 'deducibilita',
  'detraibilità': 'detraibilita',
  'contrassegnato': 'contrassegnato',
}

// ─── Parsing Centro Costo ────────────────────────────────────────────────────

export interface CcParsed {
  cc_tipo: string | null
  cc_sede: string | null
  cc_cliente: string | null
}

/**
 * Splitta il valore della colonna F su ", " (virgola + spazio).
 * Formato atteso: "CentrodiCosto, Sede, Cliente"
 */
function parseCentroCosto(raw: string | null): CcParsed {
  if (!raw) return { cc_tipo: null, cc_sede: null, cc_cliente: null }
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
  return {
    cc_tipo: parts[0] ?? null,
    cc_sede: parts[1] ?? null,
    cc_cliente: parts[2] ?? null,
  }
}

// ─── Estrazione targhe ───────────────────────────────────────────────────────

const TARGA_RE = /\b([A-Z]{2}\d{3}[A-Z]{2})\b/g

/** Estrae tutte le targhe italiane (MM000NN) da una stringa. Restituisce null se nessuna. */
export function extractTarghe(text: string | null): string[] | null {
  if (!text) return null
  const found = [...text.matchAll(TARGA_RE)].map(m => m[1])
  return found.length > 0 ? [...new Set(found)] : null
}

// ─── Conversioni tipi ────────────────────────────────────────────────────────

function toDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) {
    // SheetJS con cellDates:true restituisce Date in UTC ma i valori Excel sono
    // date locali (mezzanotte). In Italia (UTC+2 estate) "3 aprile" diventa
    // "2026-04-02T22:00:00Z". Aggiungere 12h garantisce la data corretta
    // per qualsiasi timezone europea (offset < ±12h).
    const adjusted = new Date(v.getTime() + 12 * 60 * 60 * 1000)
    return adjusted.toISOString().slice(0, 10)
  }
  return null
}

function toBoolSI(v: unknown): boolean {
  return typeof v === 'string' && v.trim().toUpperCase() === 'SI'
}

function toBool01(v: unknown): boolean {
  if (typeof v === 'number') return v === 1
  if (typeof v === 'boolean') return v
  return false
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0
  return 0
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  const s = String(v).trim()
  return s || null
}

function toRinnovi(v: unknown): 'ricorrente' | 'una tantum' | null {
  const s = toStr(v)?.toLowerCase()
  if (s === 'ricorrente') return 'ricorrente'
  if (s === 'una tantum') return 'una tantum'
  return null
}

// ─── Build riga ──────────────────────────────────────────────────────────────

function buildRow(
  idx: Map<string, number>,
  row: unknown[]
): PurchaseInsert | null {
  const g = (f: string): unknown => {
    const i = idx.get(f)
    return i !== undefined ? row[i] : null
  }

  const nr_acquisto = toStr(g('nr_acquisto'))
  const data = toDate(g('data'))
  if (!nr_acquisto || !data) return null

  const centro_costo = toStr(g('centro_costo'))
  const { cc_tipo, cc_sede, cc_cliente } = parseCentroCosto(centro_costo)

  return {
    upload_id: null,
    data,
    prox_scadenza: toDate(g('prox_scadenza')),
    nr_acquisto,
    ft_elettronica: toBoolSI(g('ft_elettronica')),
    data_ricezione_fe: toDate(g('data_ricezione_fe')),
    centro_costo,
    cc_tipo,
    cc_sede,
    cc_cliente,
    categoria: toStr(g('categoria')),
    fornitore: toStr(g('fornitore')) ?? '',
    descrizione: toStr(g('descrizione')) ?? '',
    targhe: extractTarghe(toStr(g('descrizione'))),
    rinnovi: toRinnovi(g('rinnovi')),
    rimborso: null,
    partita_iva: toStr(g('partita_iva')),
    codice_fiscale: toStr(g('codice_fiscale')),
    comune: toStr(g('comune')),
    provincia: toStr(g('provincia')),
    paese: toStr(g('paese')),
    imponibile: toNum(g('imponibile')),
    iva: toNum(g('iva')),
    rit_acconto: toNum(g('rit_acconto')),
    rit_prev: toNum(g('rit_prev')),
    deducibilita: toBool01(g('deducibilita')),
    detraibilita: toBool01(g('detraibilita')),
    contrassegnato: toBoolSI(g('contrassegnato')),
  }
}

// ─── Auto-detect header row ──────────────────────────────────────────────────

// Cerca la riga header scansionando le prime N righe: è quella che contiene
// almeno 2 colonne riconosciute nella HEADER_MAP.
function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] as unknown[]
    const matches = row.filter(h => {
      const norm = typeof h === 'string' ? h.trim().toLowerCase() : ''
      return norm !== '' && HEADER_MAP[norm] !== undefined
    })
    if (matches.length >= 2) return i
  }
  throw new Error('Intestazione colonne non trovata nelle prime 10 righe')
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/** Parsa un file Excel FattureInCloud e restituisce le righe pronte per l'upsert. */
export async function parseExcel(file: File): Promise<PurchaseInsert[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })

  if (rows.length < 2) throw new Error('File non valido: meno di 2 righe')

  const headerIdx = findHeaderRowIndex(rows)
  const headerRow = rows[headerIdx] as unknown[]

  const fieldIndex = new Map<string, number>()
  headerRow.forEach((h, i) => {
    const norm = typeof h === 'string' ? h.trim().toLowerCase() : ''
    const field = HEADER_MAP[norm]
    if (field) fieldIndex.set(field, i)
  })

  return rows
    .slice(headerIdx + 1)
    .filter(row => (row as unknown[]).some(c => c !== null))
    .map(row => buildRow(fieldIndex, row as unknown[]))
    .filter((p): p is PurchaseInsert => p !== null)
}
