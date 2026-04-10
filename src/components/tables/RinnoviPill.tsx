import { Loader2 } from 'lucide-react'

type Rinnovi = 'ricorrente' | 'una tantum' | null

interface Props {
  value: Rinnovi
  saving?: boolean
  onChange: (next: Rinnovi) => void
}

const NEXT: Record<string, Rinnovi> = {
  '':           'ricorrente',
  'ricorrente': 'una tantum',
  'una tantum': null,
}

export default function RinnoviPill({ value, saving, onChange }: Props) {
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

  if (value === 'ricorrente') {
    return (
      <button
        onClick={handleClick}
        title="Clicca per cambiare"
        className="min-h-[28px] px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95 transition-all cursor-pointer"
      >
        Ricorrente
      </button>
    )
  }

  if (value === 'una tantum') {
    return (
      <button
        onClick={handleClick}
        title="Clicca per cambiare"
        className="min-h-[28px] px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 active:scale-95 transition-all cursor-pointer"
      >
        Una tantum
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      title="Clicca per impostare"
      className="min-h-[28px] px-2.5 py-0.5 rounded-full text-xs font-medium border border-dashed border-[#CBD5E0] text-[#94A3B8] hover:border-[#64748B] hover:text-[#64748B] active:scale-95 transition-all cursor-pointer"
    >
      + tipo
    </button>
  )
}
