type Accent = 'default' | 'success' | 'warning' | 'danger'

interface Props {
  label: string
  value: string
  sublabel?: string
  accent?: Accent
}

const ACCENT_STYLES: Record<Accent, string> = {
  default: 'text-[#1A202C]',
  success: 'text-[#10B981]',
  warning: 'text-[#F59E0B]',
  danger: 'text-[#EF4444]',
}

export default function KPICard({ label, value, sublabel, accent = 'default' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-4 h-full">
      <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide truncate">{label}</p>
      <p className={`text-2xl font-bold mt-1 truncate ${ACCENT_STYLES[accent]}`}>{value}</p>
      {sublabel && <p className="text-xs text-[#64748B] mt-0.5 truncate">{sublabel}</p>}
    </div>
  )
}
