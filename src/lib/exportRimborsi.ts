import ExcelJS from 'exceljs'
import type { ExpenseQuota, Purchase } from '@/types'

// ─── Palette colori IGS ───────────────────────────────────────────────────────
const C = {
  igsBlue:  'FF1E3A5F',
  white:    'FFFFFFFF',
  rowAlt:   'FFF8FAFC',
  amber:    'FFFEF3C7',
  emerald:  'FFD1FAE5',
  totalBg:  'FFE2E8F0',
  border:   'FFE2E8F0',
} as const

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fmtMese(iso: string): string {
  const [y, m] = iso.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

export async function exportRimborsi(
  quotas: ExpenseQuota[],
  directPurchases: Purchase[],
  periodoFrom: string,
  periodoTo: string
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Adriana Comunicazioni Srl Dashboard'
  wb.created = new Date()

  const ws = wb.addWorksheet('Rimborsi', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  // ── Intestazione documento ────────────────────────────────────────────────
  const isSingleMonth = periodoFrom === periodoTo
  const titolo = isSingleMonth
    ? `Report Rimborsi — ${fmtMese(periodoFrom)}`
    : `Report Rimborsi — ${fmtMese(periodoFrom)} / ${fmtMese(periodoTo)}`

  const totQuote = quotas.length + directPurchases.length
  const generatedAt = new Date().toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const COLS = 9

  // Riga titolo
  ws.mergeCells(1, 1, 1, COLS)
  const titleCell = ws.getCell('A1')
  titleCell.value = titolo
  titleCell.font = { bold: true, size: 14, color: { argb: C.white } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.igsBlue } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 30

  // Riga sottotitolo
  ws.mergeCells(2, 1, 2, COLS)
  const subCell = ws.getCell('A2')
  subCell.value = `Generato il ${generatedAt} · ${totQuote} voci`
  subCell.font = { size: 10, color: { argb: 'FF64748B' } }
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 18

  // ── Intestazioni colonne ──────────────────────────────────────────────────
  const headers = [
    'Data', 'Fornitore', 'Descrizione', 'Cliente', 'ID Univoco',
    'Periodo', 'Importo €', 'Stato', 'Data Rimborso',
  ]
  const colWidths = [12, 24, 40, 14, 12, 16, 14, 18, 14]

  const headerRow = ws.getRow(3)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: C.white }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.igsBlue } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: C.border } },
      right:  { style: 'thin', color: { argb: 'FF2E5F8A' } },
    }
    ws.getColumn(i + 1).width = colWidths[i]
  })
  headerRow.height = 22

  // ── Righe dati ────────────────────────────────────────────────────────────
  let rowIdx = 4
  let totImporto = 0
  let totRimborsato = 0

  // Quote piani
  for (const q of quotas) {
    const purchase = (q as ExpenseQuota & { purchase?: Purchase }).purchase
    const isRimb = q.stato === 'rimborsata'
    const row = ws.getRow(rowIdx)
    const isAlt = rowIdx % 2 === 0
    const bgColor = isRimb ? C.emerald : (isAlt ? C.rowAlt : C.white)

    const values = [
      purchase?.data ? fmtDate(purchase.data) : '',
      purchase?.fornitore ?? '',
      purchase?.descrizione ?? '',
      q.sede ?? '',
      q.cliente ?? '',
      `${q.quota_index}/${q.quota_totale} — ${fmtMese(q.periodo)}`,
      q.importo,
      isRimb ? 'Rimborsata ✓' : 'Da rimborsare',
      q.data_rimborso ? fmtDate(q.data_rimborso) : '',
    ]

    values.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle', horizontal: i === 6 ? 'right' : 'left', indent: i === 6 ? 0 : 1 }
      cell.border = { bottom: { style: 'hair', color: { argb: C.border } } }
      if (i === 6) {
        cell.numFmt = '€ #,##0.00'
        cell.font = { size: 9, bold: true, color: { argb: isRimb ? 'FF166534' : 'FF92400E' } }
      }
      if (i === 7) {
        cell.font = { size: 9, bold: true, color: { argb: isRimb ? 'FF166534' : 'FF92400E' } }
      }
    })

    row.height = 16
    totImporto += q.importo
    if (isRimb) totRimborsato += q.importo
    rowIdx++
  }

  // Rimborsi diretti
  for (const p of directPurchases) {
    const isRimb = p.rimborso === 'rimborsata'
    const row = ws.getRow(rowIdx)
    const isAlt = rowIdx % 2 === 0
    const bgColor = isRimb ? C.emerald : (isAlt ? C.rowAlt : C.white)

    const values = [
      fmtDate(p.data),
      p.fornitore,
      p.descrizione ?? '',
      p.cc_cliente ?? '',
      p.cc_sede ?? '',
      'Diretto',
      p.imponibile,
      isRimb ? 'Rimborsata ✓' : 'Da rimborsare',
      '',
    ]

    values.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle', horizontal: i === 6 ? 'right' : 'left', indent: i === 6 ? 0 : 1 }
      cell.border = { bottom: { style: 'hair', color: { argb: C.border } } }
      if (i === 6) {
        cell.numFmt = '€ #,##0.00'
        cell.font = { size: 9, bold: true, color: { argb: isRimb ? 'FF166534' : 'FF92400E' } }
      }
      if (i === 7) {
        cell.font = { size: 9, bold: true, color: { argb: isRimb ? 'FF166534' : 'FF92400E' } }
      }
    })

    row.height = 16
    totImporto += p.imponibile
    if (isRimb) totRimborsato += p.imponibile
    rowIdx++
  }

  // ── Riga TOTALE ───────────────────────────────────────────────────────────
  const totRow = ws.getRow(rowIdx)
  const totValues: (string | number)[] = [
    '', '', '', '', '',
    'TOTALE',
    totImporto,
    `${totRimborsato.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} rimborsati`,
    '',
  ]
  totValues.forEach((v, i) => {
    const cell = totRow.getCell(i + 1)
    cell.value = v
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.totalBg } }
    cell.font = { bold: true, size: 10 }
    cell.border = { top: { style: 'medium', color: { argb: C.igsBlue } } }
    cell.alignment = { vertical: 'middle', horizontal: i === 6 ? 'right' : (i === 5 ? 'right' : 'left'), indent: 1 }
    if (i === 6) cell.numFmt = '€ #,##0.00'
  })
  totRow.height = 20

  // ── Download ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const label = isSingleMonth
    ? periodoFrom.slice(0, 7).replace('-', '-')
    : `${periodoFrom.slice(0, 7)}_${periodoTo.slice(0, 7)}`
  a.download = `rimborsi_${label}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
