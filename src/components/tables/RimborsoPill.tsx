import { Loader2 } from 'lucide-react'

type Rimborso = 'rimborsata' | 'non rimborsata' | null

interface Props {
  value: Rimborso
  saving?: boolean
  onChange: (next: Rimborso) => void
}

const NEXT: Record<string, Rimborso> = {
  '':              'rimborsata',
  'rimborsata':    'non rimborsata',
  'non rimborsata': null,
}

export default function RimborsoPill({ value, saving, onChange }: Props) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (saving) return
    onChange(NEXT[value ?? ''])
  }

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-[#94A3B8]">
        <Loader2 size={11} className="animate-spin" />
      </span>
    )
  }

  if (value === 'rimborsata') {
    return (
      <button
        onClick={handleClick}
        title="Clicca per cambiare"
        className="min-h-[28px] px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95 transition-all cursor-pointer"
      >
        Rimborsata
      </button>
    )
  }

  if (value === 'non rimborsata') {
    return (
      <button
        onClick={handleClick}
        title="Clicca per cambiare"
        className="min-h-[28px] px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 active:scale-95 transition-all cursor-pointer"
      >
        Non rimb.
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      title="Clicca per impostare rimborso"
      className="min-h-[28px] px-2.5 py-0.5 rounded-full text-xs font-medium border border-dashed border-[#CBD5E0] text-[#94A3B8] hover:border-[#64748B] hover:text-[#64748B] active:scale-95 transition-all cursor-pointer"
    >
      + rimborso
    </button>
  )
}
