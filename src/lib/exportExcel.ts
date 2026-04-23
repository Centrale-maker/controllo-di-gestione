import ExcelJS from 'exceljs'
import type { Purchase } from '@/types'

// ─── Palette colori IGS ───────────────────────────────────────────────────────
const C = {
  igsBlue:      'FF1E3A5F',
  igsLightBlue: 'FF2E5F8A',
  white:        'FFFFFFFF',
  rowAlt:       'FFF8FAFC',
  totalBg:      'FFE2E8F0',
  border:       'FFE2E8F0',
} as const

// ─── Definizione colonne ──────────────────────────────────────────────────────
export interface ExportColDef {
  key:            string
  label:          string
  group:          string
  defaultChecked: boolean
  width:          number
  isCurrency?:    boolean
  isDate?:        boolean
  getValue:       (p: Purchase) => string | number | null
}

export const EXPORT_COLUMNS: ExportColDef[] = [
  // Fattura
  { key: 'data',             label: 'Data',              group: 'Fattura',         defaultChecked: true,  width: 14, isDate: true,    getValue: p => p.data },
  { key: 'nr_acquisto',      label: 'Nr. Acquisto',      group: 'Fattura',         defaultChecked: true,  width: 16,                  getValue: p => p.nr_acquisto },
  { key: 'fornitore',        label: 'Fornitore',         group: 'Fattura',         defaultChecked: true,  width: 28,                  getValue: p => p.fornitore },
  { key: 'descrizione',      label: 'Descrizione',       group: 'Fattura',         defaultChecked: true,  width: 40,                  getValue: p => p.descrizione ?? '' },

  // Classificazione
  { key: 'categoria',        label: 'Categoria',         group: 'Classificazione', defaultChecked: true,  width: 20,                  getValue: p => p.categoria ?? '' },
  { key: 'cc_tipo',          label: 'Centro di costo',   group: 'Classificazione', defaultChecked: true,  width: 16,                  getValue: p => p.cc_tipo ?? '' },
  { key: 'cc_cliente',       label: 'Cliente',           group: 'Classificazione', defaultChecked: true,  width: 14,                  getValue: p => p.cc_cliente ?? '' },
  { key: 'cc_sede',          label: 'ID Univoco',        group: 'Classificazione', defaultChecked: false, width: 16,                  getValue: p => p.cc_sede ?? '' },
  { key: 'centro_costo',     label: 'Centro Costo',      group: 'Classificazione', defaultChecked: false, width: 22,                  getValue: p => p.centro_costo ?? '' },
  { key: 'rinnovi',          label: 'Tipo Costo',        group: 'Classificazione', defaultChecked: true,  width: 16,                  getValue: p => p.rinnovi ?? '' },

  // Importi
  { key: 'imponibile',       label: 'Imponibile (€)',    group: 'Importi',         defaultChecked: true,  width: 16, isCurrency: true, getValue: p => Number(p.imponibile) },
  { key: 'iva',              label: 'IVA (€)',           group: 'Importi',         defaultChecked: true,  width: 14, isCurrency: true, getValue: p => Number(p.iva) },
  { key: 'lordo',            label: 'Totale Lordo (€)',  group: 'Importi',         defaultChecked: true,  width: 18, isCurrency: true, getValue: p => Number(p.imponibile) + Number(p.iva) },
  { key: 'rit_acconto',      label: 'Rit. Acconto (€)', group: 'Importi',         defaultChecked: false, width: 18, isCurrency: true, getValue: p => Number(p.rit_acconto) },
  { key: 'rit_prev',         label: 'Rit. Prev. (€)',   group: 'Importi',         defaultChecked: false, width: 16, isCurrency: true, getValue: p => Number(p.rit_prev) },

  // Scadenze
  { key: 'prox_scadenza',    label: 'Prossima Scadenza', group: 'Scadenze',        defaultChecked: true,  width: 20, isDate: true,    getValue: p => p.prox_scadenza ?? '' },
  { key: 'ft_elettronica',   label: 'FT Elettronica',    group: 'Scadenze',        defaultChecked: false, width: 16,                  getValue: p => p.ft_elettronica ? 'Sì' : 'No' },
  { key: 'data_ricezione_fe',label: 'Data Ricezione FE', group: 'Scadenze',        defaultChecked: false, width: 20, isDate: true,    getValue: p => p.data_ricezione_fe ?? '' },

  // Fornitore
  { key: 'partita_iva',      label: 'Partita IVA',       group: 'Fornitore',       defaultChecked: false, width: 16,                  getValue: p => p.partita_iva ?? '' },
  { key: 'paese',            label: 'Paese',             group: 'Fornitore',       defaultChecked: false, width: 14,                  getValue: p => p.paese ?? '' },
  { key: 'provincia',        label: 'Provincia',         group: 'Fornitore',       defaultChecked: false, width: 12,                  getValue: p => p.provincia ?? '' },
  { key: 'comune',           label: 'Comune',            group: 'Fornitore',       defaultChecked: false, width: 16,                  getValue: p => p.comune ?? '' },

  // Extra
  { key: 'targhe',           label: 'Targhe',            group: 'Extra',           defaultChecked: false, width: 16,                  getValue: p => (p.targhe ?? []).join(', ') },
  { key: 'deducibilita',     label: 'Deducibilità',      group: 'Extra',           defaultChecked: false, width: 14,                  getValue: p => p.deducibilita ? 'Sì' : 'No' },
  { key: 'detraibilita',     label: 'Detraibilità',      group: 'Extra',           defaultChecked: false, width: 14,                  getValue: p => p.detraibilita ? 'Sì' : 'No' },
  { key: 'contrassegnato',   label: 'Contrassegnato',    group: 'Extra',           defaultChecked: false, width: 16,                  getValue: p => p.contrassegnato ? 'Sì' : 'No' },
]

// ─── Stile helper ─────────────────────────────────────────────────────────────
function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function parseIsoDate(iso: string): Date | null {
  const parts = iso.split('-')
  if (parts.length !== 3) return null
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

// ─── Export principale ────────────────────────────────────────────────────────
export async function exportToExcel(
  purchases: Purchase[],
  selectedKeys: string[],
  subtitle: string
): Promise<void> {
  const cols = EXPORT_COLUMNS.filter(c => selectedKeys.includes(c.key))
  const ncols = cols.length

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Adriana Comunicazioni Srl Dashboard'
  wb.created = new Date()

  const ws = wb.addWorksheet('Report Adriana', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { fitToPage: true, fitToWidth: 1, paperSize: 9 /* A4 */ },
  })

  // ── Riga 1: Titolo ──────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, ncols)
  const titleCell = ws.getCell('A1')
  titleCell.value = 'Adriana Comunicazioni Srl — Report Acquisti'
  titleCell.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.white } }
  titleCell.fill  = solidFill(C.igsBlue)
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  // ── Riga 2: Sottotitolo ─────────────────────────────────────────────────────
  ws.mergeCells(2, 1, 2, ncols)
  const subCell = ws.getCell('A2')
  const now = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  subCell.value = `${subtitle}  ·  ${purchases.length.toLocaleString('it-IT')} fatture  ·  Generato il ${now}`
  subCell.font  = { name: 'Calibri', size: 10, color: { argb: C.white } }
  subCell.fill  = solidFill(C.igsLightBlue)
  subCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 18

  // ── Riga 3: separatore vuoto ─────────────────────────────────────────────────
  ws.getRow(3).height = 6

  // ── Riga 4: Intestazioni colonne ─────────────────────────────────────────────
  const headerRow = ws.getRow(4)
  headerRow.height = 22
  cols.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value     = col.label
    cell.font      = { name: 'Calibri', size: 11, bold: true, color: { argb: C.white } }
    cell.fill      = solidFill(C.igsBlue)
    cell.alignment = { horizontal: col.isCurrency ? 'right' : 'left', vertical: 'middle', wrapText: false }
    cell.border    = { bottom: { style: 'thin', color: { argb: C.igsLightBlue } } }
    ws.getColumn(i + 1).width = col.width
  })

  // ── Righe dati ───────────────────────────────────────────────────────────────
  purchases.forEach((p, rowIdx) => {
    const row   = ws.getRow(5 + rowIdx)
    row.height  = 17
    const isAlt = rowIdx % 2 === 1

    cols.forEach((col, colIdx) => {
      const cell   = row.getCell(colIdx + 1)
      const rawVal = col.getValue(p)

      if (col.isCurrency && typeof rawVal === 'number') {
        cell.value  = rawVal
        cell.numFmt = '€ #,##0.00'
        cell.alignment = { horizontal: 'right' }
      } else if (col.isDate && rawVal && typeof rawVal === 'string') {
        const d = parseIsoDate(rawVal)
        cell.value  = d ?? rawVal
        cell.numFmt = 'dd/mm/yyyy'
      } else {
        cell.value = rawVal ?? ''
      }

      cell.font = { name: 'Calibri', size: 10 }
      if (isAlt) cell.fill = solidFill(C.rowAlt)
    })
  })

  // ── Riga totali ──────────────────────────────────────────────────────────────
  const hasCurrency = cols.some(c => c.isCurrency)
  if (hasCurrency) {
    const totalRowIdx = 5 + purchases.length
    const totalRow    = ws.getRow(totalRowIdx)
    totalRow.height   = 22

    cols.forEach((col, colIdx) => {
      const cell = totalRow.getCell(colIdx + 1)
      cell.font  = { name: 'Calibri', size: 11, bold: true }
      cell.fill  = solidFill(C.totalBg)
      cell.border = { top: { style: 'medium', color: { argb: C.igsBlue } } }

      if (colIdx === 0) {
        cell.value = 'TOTALE'
      } else if (col.isCurrency) {
        const sum = purchases.reduce((acc, p) => acc + (Number(col.getValue(p)) || 0), 0)
        cell.value  = sum
        cell.numFmt = '€ #,##0.00'
        cell.alignment = { horizontal: 'right' }
      }
    })
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  const buffer   = await wb.xlsx.writeBuffer()
  const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = `Adriana_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
