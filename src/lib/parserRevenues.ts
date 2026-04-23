import * as XLSX from 'xlsx'
import type { RevenueInsert } from '@/types'

const HEADER_MAP: Record<string, string> = {
  'data':                'data',
  'prox scadenza':       'prox_scadenza',
  'documento':           'documento',
  'numero':              'numero',
  'serie':               'serie',
  'saldato':             'saldato',
  'centro ricavo':       'centro_ricavo',
  'cliente':             'cliente',
  'comune':              'comune',
  'provincia':           'provincia',
  'cap':                 'cap',
  'paese':               'paese',
  'p.iva':               'partita_iva',
  'cf':                  'codice_fiscale',
  'oggetto (interno)':   'oggetto_interno',
  'oggetto (visibile)':  'oggetto_visibile',
  'valuta orig.':        'valuta',
  'imponibile':          'imponibile',
  'iva':                 'iva',
  'cassa':               'cassa',
  'altra cassa':         'altra_cassa',
  'rivalsa':             'rivalsa',
  'rit. acconto':        'rit_acconto',
  'rit. prev.':          'rit_prev',
  'lordo':               'lordo',
  'contrassegnato':      'contrassegnato',
}

function parseCentroRicavo(raw: string | null): { cr_tipo: string | null; cr_cliente: string | null; cr_id: string | null } {
  if (!raw) return { cr_tipo: null, cr_cliente: null, cr_id: null }
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
  return {
    cr_tipo:    parts[0] ?? null,
    cr_cliente: parts[1] ?? null,
    cr_id:      parts[2] ?? null,
  }
}

function toDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) {
    const adjusted = new Date(v.getTime() + 12 * 60 * 60 * 1000)
    return adjusted.toISOString().slice(0, 10)
  }
  if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v)
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  if (typeof v === 'string') {
    const s = v.trim()
    const itMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (itMatch) {
      const [, d, m, y] = itMatch
      const year = y.length === 2 ? parseInt(y) + 2000 : parseInt(y)
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  }
  return null
}

function toBoolSI(v: unknown): boolean {
  return typeof v === 'string' && v.trim().toUpperCase() === 'SI'
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

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const matches = (rows[i] as unknown[]).filter(h => {
      const norm = typeof h === 'string' ? h.trim().toLowerCase() : ''
      return norm !== '' && HEADER_MAP[norm] !== undefined
    })
    if (matches.length >= 2) return i
  }
  throw new Error('Intestazione colonne non trovata nelle prime 10 righe')
}

function buildRow(idx: Map<string, number>, row: unknown[]): RevenueInsert | null {
  const g = (f: string): unknown => {
    const i = idx.get(f)
    return i !== undefined ? row[i] : null
  }

  const data = toDate(g('data'))
  if (!data) return null

  const numero = toStr(g('numero'))
  if (!numero) return null

  const centro_ricavo = toStr(g('centro_ricavo'))
  const { cr_tipo, cr_cliente, cr_id } = parseCentroRicavo(centro_ricavo)

  return {
    upload_id:        null,
    data,
    prox_scadenza:    toDate(g('prox_scadenza')),
    documento:        toStr(g('documento')),
    numero,
    serie:            toStr(g('serie')),
    saldato:          toBoolSI(g('saldato')),
    centro_ricavo,
    cr_tipo,
    cr_cliente,
    cr_id,
    cliente:          toStr(g('cliente')),
    comune:           toStr(g('comune')),
    provincia:        toStr(g('provincia')),
    cap:              toStr(g('cap')),
    paese:            toStr(g('paese')),
    partita_iva:      toStr(g('partita_iva')),
    codice_fiscale:   toStr(g('codice_fiscale')),
    oggetto_interno:  toStr(g('oggetto_interno')),
    oggetto_visibile: toStr(g('oggetto_visibile')),
    imponibile:       toNum(g('imponibile')),
    iva:              toNum(g('iva')),
    cassa:            toNum(g('cassa')),
    altra_cassa:      toNum(g('altra_cassa')),
    rivalsa:          toNum(g('rivalsa')),
    rit_acconto:      toNum(g('rit_acconto')),
    rit_prev:         toNum(g('rit_prev')),
    lordo:            toNum(g('lordo')),
    contrassegnato:   toBoolSI(g('contrassegnato')),
  }
}

export async function parseRevenuesExcel(file: File): Promise<RevenueInsert[]> {
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
    .filter((r): r is RevenueInsert => r !== null)
}
