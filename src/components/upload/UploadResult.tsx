import { CheckCircle, XCircle, Plus, RefreshCw, Minus } from 'lucide-react'
import type { UpsertResult } from '@/lib/upsert'

interface Props {
  result: UpsertResult | null
  error: string | null
  filename: string
  onReset: () => void
}

interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

export default function UploadResult({ result, error, filename, onReset }: Props) {
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#EF4444]/30 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <XCircle size={24} className="text-[#EF4444] shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#1A202C]">Import fallito</p>
            <p className="text-xs text-[#64748B] truncate">{filename}</p>
          </div>
        </div>
        <p className="text-sm text-[#EF4444] bg-red-50 rounded-lg px-3 py-2">{error}</p>
        <button
          onClick={onReset}
          className="w-full h-11 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#1A202C] hover:bg-[#F8FAFC] transition-colors"
        >
          Riprova
        </button>
      </div>
    )
  }

  if (!result) return null

  const stats: StatItem[] = [
    { label: 'Aggiunte', value: result.added, icon: <Plus size={16} />, color: 'text-[#10B981]' },
    { label: 'Aggiornate', value: result.updated, icon: <RefreshCw size={16} />, color: 'text-[#F59E0B]' },
    { label: 'Invariate', value: result.unchanged, icon: <Minus size={16} />, color: 'text-[#64748B]' },
  ]

  return (
    <div className="bg-white rounded-xl border border-[#10B981]/30 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <CheckCircle size={24} className="text-[#10B981] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#1A202C]">Import completato</p>
          <p className="text-xs text-[#64748B] truncate">{filename}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-[#F8FAFC] rounded-lg p-3 text-center">
            <div className={`flex items-center justify-center gap-1 mb-1 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-xl font-bold text-[#1A202C]">{s.value}</p>
            <p className="text-xs text-[#64748B]">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="w-full h-11 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E5F8A] transition-colors"
      >
        Nuovo upload
      </button>
    </div>
  )
}
