import { useState } from 'react'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useExpensePlans, type SedeCliente } from '@/hooks/useExpensePlans'
import type { Purchase } from '@/types'

interface Props {
  purchases: Purchase[]          // lista spese selezionabili
  sedeOptions: string[]          // sedi disponibili (da cc_sede)
  clienteOptions: string[]       // clienti disponibili (da cc_cliente)
  onCreated: () => void
  onClose: () => void
}

// ─── CreatePlanModal ──────────────────────────────────────────────────────────

export function CreatePlanModal({ purchases, sedeOptions, clienteOptions, onCreated, onClose }: Props) {
  const { createPlanWithQuotas, loading, error } = useExpensePlans()

  const [purchaseId, setPurchaseId] = useState<string>(purchases[0]?.id ?? '')
  const [importo, setImporto] = useState<string>('')
  const [nPeriodi, setNPeriodi] = useState<number>(1)
  const [dataInizio, setDataInizio] = useState<string>(firstOfCurrentMonth())
  const [note, setNote] = useState<string>('')
  const [sedi, setSedi] = useState<SedeCliente[]>([])

  // Quando cambia la purchase, precompila l'importo con l'imponibile
  function onPurchaseChange(id: string) {
    setPurchaseId(id)
    const p = purchases.find(p => p.id === id)
    if (p) setImporto(String(p.imponibile))
  }

  // ── Gestione sedi ──────────────────────────────────────────────────────────

  function addSede() {
    const sedeLibere = sedeOptions.filter(s => !sedi.find(x => x.sede === s))
    const nuovaSede = sedeLibere[0] ?? ''
    const nSedi = sedi.length + 1
    // Redistribuisce percentuali uniformemente
    const percBase = Math.floor(100 / nSedi)
    const resto = 100 - percBase * nSedi
    setSedi(prev => [
      ...prev.map((s, i) => ({ ...s, percentuale: percBase + (i === 0 ? resto : 0) })),
      { sede: nuovaSede, percentuale: percBase, clienti: [] },
    ])
  }

  function removeSede(idx: number) {
    const nuove = sedi.filter((_, i) => i !== idx)
    setSedi(ridistribuisci(nuove))
  }

  function updateSede(idx: number, field: keyof Omit<SedeCliente, 'clienti'>, value: string | number) {
    setSedi(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  function addCliente(sedeIdx: number) {
    const usati = sedi[sedeIdx].clienti.map(c => c.cliente)
    const liberi = clienteOptions.filter(c => !usati.includes(c))
    const nuovoCliente = liberi[0] ?? ''
    setSedi(prev => prev.map((s, i) => {
      if (i !== sedeIdx) return s
      const nCl = s.clienti.length + 1
      const percBase = Math.floor(100 / nCl)
      const resto = 100 - percBase * nCl
      return {
        ...s,
        clienti: [
          ...s.clienti.map((c, ci) => ({ ...c, percentuale: percBase + (ci === 0 ? resto : 0) })),
          { cliente: nuovoCliente, percentuale: percBase },
        ],
      }
    }))
  }

  function removeCliente(sedeIdx: number, clIdx: number) {
    setSedi(prev => prev.map((s, i) => {
      if (i !== sedeIdx) return s
      const nuovi = s.clienti.filter((_, ci) => ci !== clIdx)
      return { ...s, clienti: ridistribuisciCl(nuovi) }
    }))
  }

  function updateCliente(sedeIdx: number, clIdx: number, field: string, value: string | number) {
    setSedi(prev => prev.map((s, i) => {
      if (i !== sedeIdx) return s
      return { ...s, clienti: s.clienti.map((c, ci) => ci === clIdx ? { ...c, [field]: value } : c) }
    }))
  }

  // ── Validazione ─────────────────────────────────────────────────────────────

  const totaleSedi = sedi.reduce((s, x) => s + x.percentuale, 0)
  const sediValide = sedi.length === 0 || totaleSedi === 100
  const clientiValidi = sedi.every(s => {
    if (s.clienti.length === 0) return true
    return s.clienti.reduce((sum, c) => sum + c.percentuale, 0) === 100
  })
  const importoNum = parseFloat(importo.replace(',', '.'))
  const canSubmit =
    purchaseId &&
    !isNaN(importoNum) && importoNum > 0 &&
    nPeriodi >= 1 &&
    dataInizio &&
    sediValide &&
    clientiValidi &&
    !loading

  // ── Preview quote ────────────────────────────────────────────────────────────

  const preview = buildPreview(importoNum || 0, nPeriodi, sedi)

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!canSubmit) return
    const result = await createPlanWithQuotas({
      purchase_id: purchaseId,
      importo_totale: importoNum,
      n_periodi: nPeriodi,
      data_inizio: dataInizio,
      note: note.trim() || undefined,
      sedi,
    })
    if (result) {
      onCreated()
      onClose()
    }
  }

  const selectedPurchase = purchases.find(p => p.id === purchaseId)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-0 md:px-4">
      <div className="bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1A202C]">Crea Piano di Rimborso</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg">
            <X size={18} className="text-[#64748B]" />
          </button>
        </div>

        {/* Body scrollabile */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Selezione spesa */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">Spesa</label>
            <select
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#1A202C] bg-white"
              value={purchaseId}
              onChange={e => onPurchaseChange(e.target.value)}
            >
              {purchases.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fornitore} — {p.descrizione?.slice(0, 40)} — {formatCurrency(p.imponibile)}
                </option>
              ))}
            </select>
            {selectedPurchase && (
              <p className="text-xs text-[#64748B] mt-1">
                Data: {selectedPurchase.data} · Imponibile: {formatCurrency(selectedPurchase.imponibile)}
              </p>
            )}
          </div>

          {/* Importo + periodi + data inizio */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Importo da splittare (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm"
                value={importo}
                onChange={e => setImporto(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">N° periodi (mesi)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm"
                value={nPeriodi}
                onChange={e => setNPeriodi(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-[#64748B] mb-1">Mese di inizio</label>
              <input
                type="month"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm"
                value={dataInizio.slice(0, 7)}
                onChange={e => setDataInizio(e.target.value + '-01')}
              />
            </div>
          </div>

          {/* Suddivisione sedi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#64748B]">Suddivisione per sede (opzionale)</span>
              <button
                type="button"
                onClick={addSede}
                disabled={sedi.length >= sedeOptions.length}
                className="text-xs text-[#3B82F6] flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={13} /> Aggiungi sede
              </button>
            </div>

            {sedi.length === 0 && (
              <p className="text-xs text-[#64748B] italic">Nessuna suddivisione — quota intera per periodo</p>
            )}

            <div className="space-y-3">
              {sedi.map((sede, sIdx) => {
                const importoSede = !isNaN(importoNum) ? round2(importoNum / nPeriodi * (sede.percentuale / 100)) : 0
                const totCl = sede.clienti.reduce((s, c) => s + c.percentuale, 0)

                return (
                  <div key={sIdx} className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Sede select */}
                      <select
                        className="flex-1 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm bg-white"
                        value={sede.sede}
                        onChange={e => updateSede(sIdx, 'sede', e.target.value)}
                      >
                        {sedeOptions.map(s => (
                          <option key={s} value={s}
                            disabled={sedi.some((x, xi) => xi !== sIdx && x.sede === s)}
                          >{s}</option>
                        ))}
                      </select>
                      {/* Percentuale */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="0" max="100"
                          className="w-16 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm text-center"
                          value={sede.percentuale}
                          onChange={e => updateSede(sIdx, 'percentuale', Math.min(100, parseInt(e.target.value) || 0))}
                        />
                        <span className="text-xs text-[#64748B]">%</span>
                      </div>
                      <span className="text-xs font-medium text-[#1E3A5F] w-20 text-right">
                        {formatCurrency(importoSede)}/mese
                      </span>
                      <button type="button" onClick={() => removeSede(sIdx)}
                        className="p-1 text-[#EF4444] hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Clienti */}
                    <div className="pl-3 space-y-1.5">
                      {sede.clienti.map((cl, clIdx) => {
                        const importoCl = round2(importoSede * (cl.percentuale / 100))
                        return (
                          <div key={clIdx} className="flex items-center gap-2">
                            <select
                              className="flex-1 border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs bg-white"
                              value={cl.cliente}
                              onChange={e => updateCliente(sIdx, clIdx, 'cliente', e.target.value)}
                            >
                              {clienteOptions.map(c => (
                                <option key={c} value={c}
                                  disabled={sede.clienti.some((x, xi) => xi !== clIdx && x.cliente === c)}
                                >{c}</option>
                              ))}
                            </select>
                            <input
                              type="number" min="0" max="100"
                              className="w-14 border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-center"
                              value={cl.percentuale}
                              onChange={e => updateCliente(sIdx, clIdx, 'percentuale', Math.min(100, parseInt(e.target.value) || 0))}
                            />
                            <span className="text-xs text-[#64748B]">%</span>
                            <span className="text-xs font-medium text-[#1E3A5F] w-16 text-right">
                              {formatCurrency(importoCl)}
                            </span>
                            <button type="button" onClick={() => removeCliente(sIdx, clIdx)}
                              className="p-1 text-[#EF4444] hover:bg-red-50 rounded-lg">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )
                      })}

                      <button type="button" onClick={() => addCliente(sIdx)}
                        disabled={sede.clienti.length >= clienteOptions.length}
                        className="text-xs text-[#3B82F6] flex items-center gap-1 disabled:opacity-40 mt-1">
                        <Plus size={12} /> Aggiungi cliente
                      </button>

                      {sede.clienti.length > 0 && totCl !== 100 && (
                        <p className="text-xs text-[#EF4444]">Totale clienti: {totCl}% (deve essere 100%)</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {sedi.length > 0 && !sediValide && (
              <p className="text-xs text-[#EF4444] mt-1">Totale sedi: {totaleSedi}% (deve essere 100%)</p>
            )}
          </div>

          {/* Preview */}
          {!isNaN(importoNum) && importoNum > 0 && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3">
              <p className="text-xs font-semibold text-[#1E3A5F] mb-2">
                Preview — {preview.length} quote generate ({nPeriodi} {nPeriodi === 1 ? 'mese' : 'mesi'})
              </p>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {preview.slice(0, 3).map((row, i) => (
                  <div key={i} className="flex justify-between text-xs text-[#1E3A5F]">
                    <span>{row.label}</span>
                    <span className="font-medium">{formatCurrency(row.importo)}</span>
                  </div>
                ))}
                {preview.length > 3 && (
                  <p className="text-xs text-[#64748B] italic">...e altre {preview.length - 3} quote</p>
                )}
              </div>
              <p className="text-xs text-[#1E3A5F] font-semibold mt-2 border-t border-[#BFDBFE] pt-2">
                Totale: {formatCurrency(preview.reduce((s, r) => s + r.importo, 0))}
              </p>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">Note (opzionale)</label>
            <textarea
              rows={2}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm resize-none"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={15} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium disabled:opacity-40"
          >
            {loading ? 'Creazione…' : `Crea Piano (${preview.length} quote)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number) { return Math.round(n * 100) / 100 }

function firstOfCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function ridistribuisci(sedi: SedeCliente[]): SedeCliente[] {
  if (sedi.length === 0) return []
  const percBase = Math.floor(100 / sedi.length)
  const resto = 100 - percBase * sedi.length
  return sedi.map((s, i) => ({ ...s, percentuale: percBase + (i === 0 ? resto : 0) }))
}

function ridistribuisciCl(clienti: { cliente: string; percentuale: number }[]) {
  if (clienti.length === 0) return []
  const percBase = Math.floor(100 / clienti.length)
  const resto = 100 - percBase * clienti.length
  return clienti.map((c, i) => ({ ...c, percentuale: percBase + (i === 0 ? resto : 0) }))
}

function buildPreview(importoTotale: number, nPeriodi: number, sedi: SedeCliente[]): { label: string; importo: number }[] {
  const perPeriodo = round2(importoTotale / nPeriodi)
  const rows: { label: string; importo: number }[] = []

  if (sedi.length === 0) {
    for (let i = 0; i < nPeriodi; i++) {
      rows.push({ label: `Mese ${i + 1}`, importo: perPeriodo })
    }
    return rows
  }

  for (let i = 0; i < nPeriodi; i++) {
    for (const sede of sedi) {
      const impSede = round2(perPeriodo * (sede.percentuale / 100))
      if (sede.clienti.length === 0) {
        rows.push({ label: `Mese ${i + 1} · ${sede.sede}`, importo: impSede })
      } else {
        for (const cl of sede.clienti) {
          rows.push({ label: `Mese ${i + 1} · ${sede.sede} · ${cl.cliente}`, importo: round2(impSede * (cl.percentuale / 100)) })
        }
      }
    }
  }
  return rows
}
