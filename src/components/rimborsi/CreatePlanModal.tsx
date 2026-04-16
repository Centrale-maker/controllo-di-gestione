import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, AlertCircle, AlertTriangle, Percent, Euro } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useExpensePlans, type SedeCliente } from '@/hooks/useExpensePlans'
import type { ExpenseQuota, Purchase } from '@/types'

// ─── Tipi ─────────────────────────────────────────────────────────────────────

export interface EditModeProps {
  planId: string
  nRimborsate: number
  firstPeriodQuotas: ExpenseQuota[]
  initialPurchaseId: string
  initialImporto: number
  initialNPeriodi: number
  initialDataInizio: string
  initialNote: string | null
}

interface Props {
  purchases: Purchase[]
  sedeOptions: string[]
  clienteOptions: string[]
  onCreated: () => void
  onClose: () => void
  editMode?: EditModeProps
}

type SplitMode = 'percent' | 'amount'

// ─── AmountField ──────────────────────────────────────────────────────────────
// Input testo per importi in euro che:
// - mostra la stringa grezza (niente round-trip % → €)
// - accetta virgola come separatore decimale (tastiera italiana)
// - aggiorna il parent solo onBlur

function AmountField({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: number
  onCommit: (amt: number) => void
  placeholder?: string
  className?: string
}) {
  const [raw, setRaw] = useState(() => value > 0 ? fmtAmt(value) : '')
  const externalRef = useRef(value)

  // Sincronizza dal parent solo quando il valore cambia esternamente
  // (es. redistribuzione dopo add/remove sede), non durante la digitazione
  useEffect(() => {
    if (externalRef.current !== value) {
      externalRef.current = value
      setRaw(value > 0 ? fmtAmt(value) : '')
    }
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder ?? '0'}
      value={raw}
      onChange={e => setRaw(e.target.value)}
      onBlur={() => {
        const amt = parseAmt(raw)
        externalRef.current = amt   // evita il re-sync dal useEffect
        onCommit(amt)
        setRaw(amt > 0 ? fmtAmt(amt) : '')
      }}
    />
  )
}

// ─── CreatePlanModal ──────────────────────────────────────────────────────────

export function CreatePlanModal({
  purchases, sedeOptions, clienteOptions, onCreated, onClose, editMode,
}: Props) {
  const { createPlanWithQuotas, editPlanWithQuotas, loading, error } = useExpensePlans()
  const isEdit = !!editMode

  const [purchaseId, setPurchaseId] = useState<string>(
    editMode?.initialPurchaseId ?? purchases[0]?.id ?? ''
  )
  const [importo, setImporto] = useState<string>(
    editMode ? String(editMode.initialImporto) : ''
  )
  const [nPeriodi, setNPeriodi] = useState<number>(editMode?.initialNPeriodi ?? 1)
  const [dataInizio, setDataInizio] = useState<string>(
    editMode?.initialDataInizio ?? firstOfCurrentMonth()
  )
  const [note, setNote] = useState<string>(editMode?.initialNote ?? '')
  const [sedi, setSedi] = useState<SedeCliente[]>(
    editMode
      ? quotasToSedi(editMode.firstPeriodQuotas, editMode.initialImporto / editMode.initialNPeriodi)
      : []
  )
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [splitMode, setSplitMode] = useState<SplitMode>('percent')

  const importoNum = parseAmt(importo)
  const importoPerPeriodo = importoNum > 0 && nPeriodi > 0 ? round2(importoNum / nPeriodi) : 0

  // ── Importi e residuo ──────────────────────────────────────────────────────

  function amountToPerc(amount: number, base: number): number {
    if (base <= 0) return 0
    return round2((amount / base) * 100)
  }

  function percToAmount(perc: number, base: number): number {
    return round2(base * perc / 100)
  }

  const totaleSediPerc = sedi.reduce((s, x) => s + x.percentuale, 0)
  const residuoSedi = round2(importoPerPeriodo - percToAmount(totaleSediPerc, importoPerPeriodo))

  // ── Gestione purchase ──────────────────────────────────────────────────────

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
    const percBase = Math.floor(100 / nSedi)
    const resto = 100 - percBase * nSedi
    setSedi(prev => [
      ...prev.map((s, i) => ({ ...s, percentuale: percBase + (i === 0 ? resto : 0) })),
      { sede: nuovaSede, percentuale: percBase, clienti: [] },
    ])
  }

  function removeSede(idx: number) {
    setSedi(ridistribuisci(sedi.filter((_, i) => i !== idx)))
  }

  function updateSedeField(idx: number, field: keyof Omit<SedeCliente, 'clienti'>, value: string | number) {
    setSedi(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  // In modalità €: importo sede → percentuale
  function commitSedeAmount(idx: number, amt: number) {
    const perc = amountToPerc(amt, importoPerPeriodo)
    setSedi(prev => prev.map((s, i) => i === idx ? { ...s, percentuale: perc } : s))
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
      return { ...s, clienti: ridistribuisciCl(s.clienti.filter((_, ci) => ci !== clIdx)) }
    }))
  }

  function updateClienteField(sedeIdx: number, clIdx: number, field: string, value: string | number) {
    setSedi(prev => prev.map((s, i) => {
      if (i !== sedeIdx) return s
      return { ...s, clienti: s.clienti.map((c, ci) => ci === clIdx ? { ...c, [field]: value } : c) }
    }))
  }

  // In modalità €: importo cliente → % relativa alla sede
  function commitClienteAmount(sedeIdx: number, clIdx: number, amt: number) {
    const importoSede = percToAmount(sedi[sedeIdx].percentuale, importoPerPeriodo)
    const perc = amountToPerc(amt, importoSede)
    setSedi(prev => prev.map((s, i) => {
      if (i !== sedeIdx) return s
      return { ...s, clienti: s.clienti.map((c, ci) => ci === clIdx ? { ...c, percentuale: perc } : c) }
    }))
  }

  // ── Validazione ────────────────────────────────────────────────────────────

  const totaleSedi = sedi.reduce((s, x) => s + x.percentuale, 0)
  const sediValide = splitMode === 'amount'
    ? sedi.length === 0 || totaleSedi > 0
    : sedi.length === 0 || totaleSedi === 100

  const clientiValidi = sedi.every(s => {
    if (s.clienti.length === 0) return true
    const tot = s.clienti.reduce((sum, c) => sum + c.percentuale, 0)
    return splitMode === 'amount' ? tot > 0 : tot === 100
  })

  const needsConfirm = isEdit && (editMode?.nRimborsate ?? 0) > 0 && !confirmOverwrite
  const canSubmit =
    purchaseId && importoNum > 0 && nPeriodi >= 1 && dataInizio &&
    sediValide && clientiValidi && !loading && !needsConfirm

  const preview = buildPreview(importoNum, nPeriodi, sedi)

  // ── Submit — assegna residuo al primo split se in modalità € ───────────────

  async function handleSubmit() {
    if (!canSubmit) return

    let sediFinali = sedi

    if (splitMode === 'amount' && sedi.length > 0 && residuoSedi !== 0) {
      const percResiduo = amountToPerc(residuoSedi, importoPerPeriodo)
      sediFinali = sedi.map((s, i) =>
        i === 0 ? { ...s, percentuale: round2(s.percentuale + percResiduo) } : s
      )
      if (sediFinali[0].clienti.length > 0) {
        const totCl = sediFinali[0].clienti.reduce((s, c) => s + c.percentuale, 0)
        const residuoClPerc = 100 - totCl
        if (residuoClPerc !== 0) {
          sediFinali = sediFinali.map((s, i) =>
            i === 0 ? {
              ...s,
              clienti: s.clienti.map((c, ci) =>
                ci === 0 ? { ...c, percentuale: round2(c.percentuale + residuoClPerc) } : c
              ),
            } : s
          )
        }
      }
    }

    if (splitMode === 'percent') {
      sediFinali = sedi.map(s => {
        if (s.clienti.length === 0) return s
        const totCl = s.clienti.reduce((sum, c) => sum + c.percentuale, 0)
        if (totCl === 100) return s
        const diff = 100 - totCl
        return {
          ...s,
          clienti: s.clienti.map((c, ci) =>
            ci === 0 ? { ...c, percentuale: round2(c.percentuale + diff) } : c
          ),
        }
      })
    }

    const input = {
      purchase_id: purchaseId,
      importo_totale: importoNum,
      n_periodi: nPeriodi,
      data_inizio: dataInizio,
      note: note.trim() || undefined,
      sedi: sediFinali,
    }

    let ok = false
    if (isEdit && editMode) {
      ok = await editPlanWithQuotas(editMode.planId, input)
    } else {
      const result = await createPlanWithQuotas(input)
      ok = !!result
    }

    if (ok) { onCreated(); onClose() }
  }

  const selectedPurchase = purchases.find(p => p.id === purchaseId)
  const nRimb = editMode?.nRimborsate ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-0 md:px-4">
      <div className="bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1A202C]">
            {isEdit ? 'Modifica Piano di Rimborso' : 'Crea Piano di Rimborso'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg">
            <X size={18} className="text-[#64748B]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Warning quote già rimborsate */}
          {isEdit && nRimb > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-800">
                  Questo piano ha {nRimb} {nRimb === 1 ? 'quota già rimborsata' : 'quote già rimborsate'}
                </p>
              </div>
              <p className="text-xs text-amber-700">
                Le quote rimborsate rimarranno invariate. Verranno rigenerate solo quelle ancora da rimborsare.
              </p>
              {!confirmOverwrite
                ? <button type="button" onClick={() => setConfirmOverwrite(true)}
                    className="text-xs font-semibold text-amber-800 underline">
                    Ho capito, procedi con la modifica
                  </button>
                : <p className="text-xs font-semibold text-amber-800">✓ Confermato</p>
              }
            </div>
          )}

          {/* Selezione spesa */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">Spesa</label>
            <select
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#1A202C] bg-white disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
              value={purchaseId}
              onChange={e => onPurchaseChange(e.target.value)}
              disabled={isEdit}
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
                type="text"
                inputMode="decimal"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm"
                placeholder="0"
                value={importo}
                onChange={e => setImporto(e.target.value)}
                onBlur={() => {
                  const n = parseAmt(importo)
                  if (n > 0) setImporto(fmtAmt(n))
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">N° periodi (mesi)</label>
              <input
                type="number" min="1" max="60"
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
            {/* Header sezione con toggle % / € */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#64748B]">Suddivisione per sede (opzionale)</span>
              <div className="flex items-center gap-2">
                {/* Toggle modalità */}
                <div className="flex items-center bg-[#F1F5F9] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setSplitMode('percent')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      splitMode === 'percent'
                        ? 'bg-white text-[#1A202C] shadow-sm'
                        : 'text-[#64748B] hover:text-[#1A202C]'
                    }`}
                  >
                    <Percent size={11} /> %
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('amount')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      splitMode === 'amount'
                        ? 'bg-white text-[#1A202C] shadow-sm'
                        : 'text-[#64748B] hover:text-[#1A202C]'
                    }`}
                  >
                    <Euro size={11} /> €
                  </button>
                </div>
                <button
                  type="button" onClick={addSede}
                  disabled={sedi.length >= sedeOptions.length}
                  className="text-xs text-[#3B82F6] flex items-center gap-1 disabled:opacity-40"
                >
                  <Plus size={13} /> Aggiungi sede
                </button>
              </div>
            </div>

            {/* Banner totale/residuo in modalità € */}
            {splitMode === 'amount' && sedi.length > 0 && importoPerPeriodo > 0 && (
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 text-xs font-medium ${
                residuoSedi === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#EFF6FF] text-[#1E3A5F] border border-[#BFDBFE]'
              }`}>
                <span>Totale per periodo: <strong>{formatCurrency(importoPerPeriodo)}</strong></span>
                <span>
                  {residuoSedi === 0
                    ? '✓ Completato'
                    : <>Residuo: <strong>{formatCurrency(Math.abs(residuoSedi))}</strong>
                        {residuoSedi > 0 && <span className="opacity-70 ml-1">→ andrà al primo split</span>}
                      </>
                  }
                </span>
              </div>
            )}

            {sedi.length === 0 && (
              <p className="text-xs text-[#64748B] italic">Nessuna suddivisione — quota intera per periodo</p>
            )}

            <div className="space-y-3">
              {sedi.map((sede, sIdx) => {
                const importoSede = percToAmount(sede.percentuale, importoPerPeriodo)
                const totCl = sede.clienti.reduce((s, c) => s + c.percentuale, 0)
                const residuoCl = round2(importoSede - sede.clienti.reduce((s, c) => s + percToAmount(c.percentuale, importoSede), 0))

                return (
                  <div key={sIdx} className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Sede select */}
                      <select
                        className="flex-1 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm bg-white"
                        value={sede.sede}
                        onChange={e => updateSedeField(sIdx, 'sede', e.target.value)}
                      >
                        {sedeOptions.map(s => (
                          <option key={s} value={s}
                            disabled={sedi.some((x, xi) => xi !== sIdx && x.sede === s)}
                          >{s}</option>
                        ))}
                      </select>

                      {/* Input % o € */}
                      {splitMode === 'percent' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number" min="0" max="100"
                            className="w-16 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm text-center"
                            value={sede.percentuale}
                            onChange={e => updateSedeField(sIdx, 'percentuale', Math.min(100, parseInt(e.target.value) || 0))}
                          />
                          <span className="text-xs text-[#64748B]">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#64748B]">€</span>
                          <AmountField
                            value={importoSede}
                            onCommit={amt => commitSedeAmount(sIdx, amt)}
                            className="w-24 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm text-right"
                          />
                        </div>
                      )}

                      <span className="text-xs font-medium text-[#1E3A5F] w-20 text-right shrink-0">
                        {formatCurrency(importoSede)}/mese
                      </span>
                      <button type="button" onClick={() => removeSede(sIdx)}
                        className="p-1 text-[#EF4444] hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Clienti */}
                    <div className="pl-3 space-y-1.5">

                      {/* Residuo clienti in modalità € */}
                      {splitMode === 'amount' && sede.clienti.length > 0 && importoSede > 0 && (
                        <div className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium ${
                          residuoCl === 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          <span>Sede {sede.sede}: {formatCurrency(importoSede)}</span>
                          <span>
                            {residuoCl === 0 ? '✓' : `Residuo: ${formatCurrency(Math.abs(residuoCl))} → primo cliente`}
                          </span>
                        </div>
                      )}

                      {sede.clienti.map((cl, clIdx) => {
                        const importoCl = percToAmount(cl.percentuale, importoSede)
                        return (
                          <div key={clIdx} className="flex items-center gap-2">
                            <select
                              className="flex-1 border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs bg-white"
                              value={cl.cliente}
                              onChange={e => updateClienteField(sIdx, clIdx, 'cliente', e.target.value)}
                            >
                              {clienteOptions.map(c => (
                                <option key={c} value={c}
                                  disabled={sede.clienti.some((x, xi) => xi !== clIdx && x.cliente === c)}
                                >{c}</option>
                              ))}
                            </select>

                            {splitMode === 'percent' ? (
                              <>
                                <input
                                  type="number" min="0" max="100"
                                  className="w-14 border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-center"
                                  value={cl.percentuale}
                                  onChange={e => updateClienteField(sIdx, clIdx, 'percentuale', Math.min(100, parseInt(e.target.value) || 0))}
                                />
                                <span className="text-xs text-[#64748B]">%</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-[#64748B]">€</span>
                                <AmountField
                                  value={importoCl}
                                  onCommit={amt => commitClienteAmount(sIdx, clIdx, amt)}
                                  className="w-20 border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-right"
                                />
                              </>
                            )}

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

                      {splitMode === 'percent' && sede.clienti.length > 0 && totCl !== 100 && (
                        <p className="text-xs text-[#EF4444]">Totale clienti: {totCl}% (deve essere 100%)</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {splitMode === 'percent' && sedi.length > 0 && totaleSedi !== 100 && (
              <p className="text-xs text-[#EF4444] mt-1">Totale sedi: {totaleSedi}% (deve essere 100%)</p>
            )}
          </div>

          {/* Preview */}
          {importoNum > 0 && (
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
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]">
            Annulla
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-2.5 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium disabled:opacity-40">
            {loading
              ? (isEdit ? 'Salvataggio…' : 'Creazione…')
              : isEdit ? 'Salva Modifiche' : `Crea Piano (${preview.length} quote)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parsa un importo accettando sia punto che virgola come separatore decimale */
function parseAmt(raw: string): number {
  if (!raw) return 0
  // Rimuove spazi e gestisce il formato europeo (1.234,56) e anglosassone (1,234.56)
  const cleaned = raw.trim()
  // Se c'è sia punto che virgola, il separatore migliaia precede il decimale
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Determina quale è il separatore decimale (l'ultimo dei due)
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastComma > lastDot) {
      // formato europeo: 1.234,56
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
    } else {
      // formato anglosassone: 1,234.56
      return parseFloat(cleaned.replace(/,/g, '')) || 0
    }
  }
  // Solo virgola → separatore decimale europeo
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.')) || 0
  }
  return parseFloat(cleaned) || 0
}

/** Formatta un numero per la visualizzazione nell'input (no migliaia, max 2 decimali) */
function fmtAmt(n: number): string {
  if (n === 0) return ''
  // Usa punto come separatore decimale nell'input (HTML standard)
  const r = round2(n)
  return String(r)
}

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

function quotasToSedi(firstPeriodQuotas: ExpenseQuota[], importoPerPeriodo: number): SedeCliente[] {
  if (firstPeriodQuotas.length === 0) return []
  if (firstPeriodQuotas.every(q => !q.sede)) return []

  const sedeMap = new Map<string, { totImporto: number; clienti: { cliente: string; importo: number }[] }>()
  for (const q of firstPeriodQuotas) {
    const sedeName = q.sede ?? '__nessuna__'
    const existing = sedeMap.get(sedeName) ?? { totImporto: 0, clienti: [] }
    existing.totImporto += q.importo
    if (q.cliente) existing.clienti.push({ cliente: q.cliente, importo: q.importo })
    sedeMap.set(sedeName, existing)
  }

  return [...sedeMap.entries()].map(([sedeName, data]) => {
    const percSede = importoPerPeriodo > 0 ? Math.round(data.totImporto / importoPerPeriodo * 100) : 50
    const clienti = data.clienti.map(cl => ({
      cliente: cl.cliente,
      percentuale: data.totImporto > 0 ? Math.round(cl.importo / data.totImporto * 100) : 50,
    }))
    return { sede: sedeName === '__nessuna__' ? '' : sedeName, percentuale: percSede, clienti }
  })
}

function buildPreview(importoTotale: number, nPeriodi: number, sedi: SedeCliente[]): { label: string; importo: number }[] {
  const perPeriodo = round2(importoTotale / nPeriodi)
  const rows: { label: string; importo: number }[] = []

  if (sedi.length === 0) {
    for (let i = 0; i < nPeriodi; i++) rows.push({ label: `Mese ${i + 1}`, importo: perPeriodo })
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
