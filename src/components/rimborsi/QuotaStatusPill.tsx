import type { QuotaStato } from '@/types'

interface Props {
  stato: QuotaStato
  onClick: () => void
  disabled?: boolean
}

// ─── QuotaStatusPill ──────────────────────────────────────────────────────────
// Pill click-to-toggle: da_rimborsare ↔ rimborsata

export function QuotaStatusPill({ stato, onClick, disabled = false }: Props) {
  const isRimborsata = stato === 'rimborsata'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'border transition-colors select-none',
        disabled ? 'cursor-default opacity-60' : 'cursor-pointer',
        isRimborsata
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      ].join(' ')}
    >
      <span className={[
        'w-1.5 h-1.5 rounded-full',
        isRimborsata ? 'bg-emerald-500' : 'bg-amber-500',
      ].join(' ')} />
      {isRimborsata ? 'Rimborsata' : 'Da rimborsare'}
    </button>
  )
}
