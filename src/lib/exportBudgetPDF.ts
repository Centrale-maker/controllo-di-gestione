import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BudgetDetailData } from '@/hooks/useBudgetDetail'

const BLUE  = [30, 58, 95]   as [number, number, number]
const LBLUE = [239, 246, 255] as [number, number, number]
const GRAY  = [100, 116, 139] as [number, number, number]
const LGRAY = [248, 250, 252] as [number, number, number]
const TEXT  = [26, 32, 44]   as [number, number, number]

const PW = 210, PH = 297, ML = 15, MR = 15, MT = 25, MB = 25
const CW = PW - ML - MR

const fmt = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

function addPageChrome(doc: jsPDF, company: string, page: number, total: number) {
  doc.setPage(page)
  doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(...BLUE)
  doc.text(company, ML, 10)
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GRAY)
  doc.text(`Pagina ${page} di ${total}`, PW - MR, 10, { align: 'right' })
  doc.setDrawColor(...BLUE).setLineWidth(0.4).line(ML, 12, PW - MR, 12)
  doc.setDrawColor(226, 232, 240).setLineWidth(0.3).line(ML, PH - MB + 5, PW - MR, PH - MB + 5)
  doc.setFontSize(7.5).setFont('helvetica', 'italic').setTextColor(...GRAY)
  doc.text('Documento generato da Financial Dashboard', ML, PH - MB + 9)
}

export function exportBudgetPDF(detail: BudgetDetailData, companyName: string) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  let y = MT

  // ── Intestazione ──────────────────────────────────────────────────
  doc.setFillColor(...BLUE).rect(ML, y, CW, 20, 'F')
  doc.setTextColor(255, 255, 255).setFontSize(18).setFont('helvetica', 'bold')
  doc.text('PREVENTIVO', ML + 6, y + 9)
  doc.setFontSize(9).setFont('helvetica', 'normal')
  doc.text(`Rif. ${detail.codice}`, ML + 6, y + 16)
  doc.text(
    new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
    PW - MR - 3, y + 16, { align: 'right' }
  )
  y += 24

  // ── Box cliente ───────────────────────────────────────────────────
  doc.setFillColor(...LBLUE).roundedRect(ML, y, CW, 22, 2, 2, 'F')
  doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(...GRAY)
  doc.text('SPETTABILE', ML + 5, y + 6)
  doc.setFontSize(13).setFont('helvetica', 'bold').setTextColor(...TEXT)
  doc.text(detail.cliente, ML + 5, y + 14)
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(...GRAY)
  doc.text(`Oggetto: ${detail.nome}`, ML + 5, y + 20)
  y += 28

  // ── Voci per categoria ────────────────────────────────────────────
  for (const centro of detail.centri) {
    const voci = centro.voci.filter(v => Number(v.prezzo_vendita) > 0 || v.descrizione.trim())
    if (voci.length === 0) continue

    const subtotale = voci.reduce((s, v) => s + Number(v.prezzo_vendita), 0)

    if (y > PH - MB - 35) { doc.addPage(); y = MT }

    // Header categoria
    doc.setFillColor(...BLUE).rect(ML, y, CW, 9, 'F')
    doc.setTextColor(255, 255, 255).setFontSize(9).setFont('helvetica', 'bold')
    doc.text(centro.nome.toUpperCase(), ML + 4, y + 6)
    doc.text(fmt(subtotale), PW - MR - 3, y + 6, { align: 'right' })
    y += 9

    autoTable(doc, {
      startY: y,
      head: [['Descrizione', 'Importo']],
      body: voci.map(v => [v.descrizione || '—', fmt(Number(v.prezzo_vendita))]),
      theme: 'plain',
      margin: { left: ML, right: MR },
      tableWidth: CW,
      showHead: 'firstPage',
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        textColor: TEXT,
        lineColor: [226, 232, 240] as [number, number, number],
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      headStyles: { fillColor: LGRAY, textColor: GRAY, fontSize: 7.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: CW - 42 },
        1: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Totali ────────────────────────────────────────────────────────
  if (y > PH - MB - 55) { doc.addPage(); y = MT }

  doc.setDrawColor(...BLUE).setLineWidth(0.5).line(ML, y, PW - MR, y)
  y += 8

  // Subtotali per categoria
  for (const centro of detail.centri) {
    const sub = centro.voci.reduce((s, v) => s + Number(v.prezzo_vendita), 0)
    if (sub === 0) continue
    doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(...GRAY)
    doc.text(`Subtotale ${centro.nome}`, ML + 4, y)
    doc.text(fmt(sub), PW - MR - 3, y, { align: 'right' })
    y += 6
  }
  y += 4

  // Box totale finale
  doc.setFillColor(...BLUE).rect(ML, y, CW, 14, 'F')
  doc.setTextColor(255, 255, 255).setFontSize(12).setFont('helvetica', 'bold')
  doc.text('TOTALE PREVENTIVO', ML + 6, y + 9)
  doc.text(fmt(detail.totale_bloccato ?? 0), PW - MR - 4, y + 9, { align: 'right' })
  y += 20

  // Note e firma
  doc.setFontSize(8).setFont('helvetica', 'italic').setTextColor(...GRAY)
  doc.text('I prezzi si intendono IVA esclusa, salvo diversa indicazione.', ML, y); y += 5
  doc.text('Validità offerta: 30 giorni dalla data di emissione.', ML, y); y += 14

  if (y < PH - MB - 15) {
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRAY)
    doc.text('Data e firma per accettazione', PW - MR - 3, y, { align: 'right' }); y += 12
    doc.setDrawColor(...GRAY).setLineWidth(0.3).line(PW - MR - 70, y, PW - MR, y)
  }

  // ── Header/footer su tutte le pagine ─────────────────────────────
  const nPages = doc.getNumberOfPages()
  for (let i = 1; i <= nPages; i++) addPageChrome(doc, companyName, i, nPages)

  doc.save(`Preventivo_${detail.codice}_${detail.cliente.replace(/\s+/g, '_')}.pdf`)
}
