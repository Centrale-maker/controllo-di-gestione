import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCalendarQuotas, addMonthsToIso, type QuotaWithPurchase } from '@/hooks/useCalendarQuotas'
import type { QuotaStato } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function toIsoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

function daysInMonth(iso: string): number {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function firstWeekday(iso: string): number {
  // 0=Mon … 6=Sun (Lunedì come primo giorno)
  const [y, m] = iso.split('-').map(Number)
  const day = new Date(y, m - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function isoDay(iso: string, day: number): string {
  return `${iso.slice(0, 7)}-${String(day).padStart(2, '0')}`
}

const DAYS_LABEL = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

// ─── RimborsiCalendar ─────────────────────────────────────────────────────────

interface Props {
  initialPeriodo?: string
}

export function RimborsiCalendar({ initialPeriodo }: Props) {
  const [currentMonth, setCurrentMonth] = useState(
    initialPeriodo ?? toIsoMonth(new Date())
  )
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Carica 3 mesi (prev/curr/next) per navigazione fluida
  const from = useMemo(() => addMonthsToIso(currentMonth, -1), [currentMonth])
  const to   = useMemo(() => addMonthsToIso(currentMonth, 1),  [currentMonth])

  const { quotasByDay, loading, updateQuotaStato } = useCalendarQuotas(from, to)

  const nDays = daysInMonth(currentMonth)
  const startOffset = firstWeekday(currentMonth)

  // Total celle griglia (multiplo di 7)
  const totalCells = Math.ceil((nDays + startOffset) / 7) * 7

  // Quote del giorno selezionato
  const selectedQuotas = selectedDay
    ? (quotasByDay.get(selectedDay) ?? [])
    : []

  function prevMonth() {
    setCurrentMonth(m => addMonthsToIso(m, -1))
    setSelectedDay(null)
  }
  function nextMonth() {
    setCurrentMonth(m => addMonthsToIso(m, 1))
    setSelectedDay(null)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header navigazione ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-semibold text-[#1A202C] capitalize min-w-[180px] text-center">
          {formatMonthYear(currentMonth)}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Griglia calendario ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">

        {/* Header giorni settimana */}
        <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
          {DAYS_LABEL.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-[#64748B]">
              {d}
            </div>
          ))}
        </div>

        {/* Celle giorni */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - startOffset + 1
            const isValid = dayNum >= 1 && dayNum <= nDays
            const dayIso = isValid ? isoDay(currentMonth, dayNum) : null

            // Le quote si trovano sul 1° del mese (periodo)
            const quotasForDay = dayIso
              ? (quotasByDay.get(dayIso) ?? [])
              : []

            const isToday = dayIso === toIsoMonth(new Date()).slice(0, 7) + `-${String(new Date().getDate()).padStart(2, '0')}`
            const isSelected = dayIso === selectedDay

            // Raggruppa per piano per non mostrare troppe righe
            const planGroups = groupByPlan(quotasForDay)

            return (
              <div
                key={i}
                onClick={() => {
                  if (!isValid) return
                  setSelectedDay(isSelected ? null : dayIso)
                }}
                className={[
                  'min-h-[80px] md:min-h-[100px] p-1 border-b border-r border-[#F1F5F9]',
                  'last:border-r-0 [&:nth-child(7n)]:border-r-0',
                  isValid ? 'cursor-pointer hover:bg-[#F8FAFC]' : 'bg-[#FAFAFA]',
                  isSelected ? 'bg-[#EFF6FF] hover:bg-[#EFF6FF]' : '',
                ].join(' ')}
              >
                {isValid && (
                  <>
                    {/* Numero giorno */}
                    <div className="flex justify-end mb-1">
                      <span className={[
                        'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                        isToday
                          ? 'bg-[#1E3A5F] text-white font-bold'
                          : 'text-[#1A202C] font-medium',
                      ].join(' ')}>
                        {dayNum}
                      </span>
                    </div>

                    {/* Chip quote — mostra max 3, poi "+N" */}
                    <div className="space-y-0.5">
                      {planGroups.slice(0, 3).map((group, gi) => {
                        const allRimb = group.quotas.every(q => q.stato === 'rimborsata')
                        const someRimb = group.quotas.some(q => q.stato === 'rimborsata')
                        return (
                          <div
                            key={gi}
                            className={[
                              'px-1.5 py-0.5 rounded text-[10px] font-medium truncate leading-tight',
                              allRimb
                                ? 'bg-emerald-100 text-emerald-800'
                                : someRimb
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800',
                            ].join(' ')}
                            title={`${group.fornitore} — ${formatCurrency(group.totImporto)}`}
                          >
                            <span className="hidden md:inline">{group.fornitore.slice(0, 18)}</span>
                            <span className="md:hidden">{group.fornitore.slice(0, 10)}</span>
                            {' '}
                            <span className="opacity-70">{formatCurrency(group.totImporto)}</span>
                          </div>
                        )
                      })}
                      {planGroups.length > 3 && (
                        <div className="text-[10px] text-[#64748B] px-1.5">
                          +{planGroups.length - 3} altri
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Legenda ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 justify-end text-xs text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          Da rimborsare
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          Parziale
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          Rimborsata
        </span>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {selectedDay && selectedQuotas.length > 0 && (
        <DayDetailPanel
          day={selectedDay}
          quotas={selectedQuotas}
          onToggle={updateQuotaStato}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// ─── DayDetailPanel ───────────────────────────────────────────────────────────

function DayDetailPanel({ day, quotas, onToggle, onClose }: {
  day: string
  quotas: QuotaWithPurchase[]
  onToggle: (id: string, stato: QuotaStato) => Promise<boolean>
  onClose: () => void
}) {
  const [y, m, d] = day.split('-')
  const label = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    .toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const groups = groupByPlan(quotas)

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-[#1A202C] capitalize">{label}</p>
        <button onClick={onClose} className="p-1 hover:bg-[#E2E8F0] rounded-lg">
          <X size={16} className="text-[#64748B]" />
        </button>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {groups.map((group, gi) => (
          <div key={gi} className="px-4 py-3">
            {/* Intestazione piano */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-[#1A202C]">{group.fornitore}</p>
                <p className="text-xs text-[#64748B]">{group.descrizione?.slice(0, 60)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1A202C]">{formatCurrency(group.totImporto)}</p>
                <p className="text-xs text-[#64748B]">
                  quota {group.quotas[0]?.quota_index}/{group.quotas[0]?.quota_totale}
                </p>
              </div>
            </div>

            {/* Singole quote del piano */}
            <div className="space-y-1.5 pl-2">
              {group.quotas.map(q => {
                const isRimb = q.stato === 'rimborsata'
                return (
                  <div key={q.id} className="flex items-center gap-2">
                    {/* Sede + Cliente */}
                    <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                      {q.sede && (
                        <span className="text-xs bg-[#F1F5F9] text-[#475569] px-1.5 py-0.5 rounded font-medium">
                          {q.sede}
                        </span>
                      )}
                      {q.cliente && (
                        <span className="text-xs bg-[#F0FDF4] text-[#166534] px-1.5 py-0.5 rounded font-medium">
                          {q.cliente}
                        </span>
                      )}
                      {!q.sede && !q.cliente && (
                        <span className="text-xs text-[#64748B]">Quota intera</span>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-[#1A202C] tabular-nums">
                      {formatCurrency(q.importo)}
                    </span>

                    {/* Pill toggle */}
                    <button
                      onClick={() => onToggle(q.id, isRimb ? 'da_rimborsare' : 'rimborsata')}
                      className={[
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors',
                        isRimb
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                      ].join(' ')}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isRimb ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isRimb ? 'Rimborsata' : 'Da rimborsare'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── helper groupByPlan ───────────────────────────────────────────────────────

interface PlanGroup {
  planId: string
  fornitore: string
  descrizione: string | undefined
  quotas: QuotaWithPurchase[]
  totImporto: number
}

function groupByPlan(quotas: QuotaWithPurchase[]): PlanGroup[] {
  const map = new Map<string, PlanGroup>()
  for (const q of quotas) {
    const existing = map.get(q.plan_id)
    if (existing) {
      existing.quotas.push(q)
      existing.totImporto += q.importo
    } else {
      map.set(q.plan_id, {
        planId: q.plan_id,
        fornitore: q.purchase?.fornitore ?? '—',
        descrizione: q.purchase?.descrizione,
        quotas: [q],
        totImporto: q.importo,
      })
    }
  }
  return [...map.values()]
}
