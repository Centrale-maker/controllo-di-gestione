import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import DataTable from './DataTable'
import DataCards from './DataCards'
import type { Purchase } from '@/types'

interface Props {
  purchases: Purchase[]
  loading: boolean
  error: string | null
}

export default function DataView({ purchases, loading, error }: Props) {
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#64748B]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#EF4444]/30 px-4 py-8 text-center">
        <p className="text-sm text-[#EF4444]">{error}</p>
      </div>
    )
  }

  if (isMobile) return <DataCards purchases={purchases} />
  return <DataTable purchases={purchases} />
}
