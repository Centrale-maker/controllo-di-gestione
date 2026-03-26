import type { UploadStatus } from '@/hooks/useUpload'

interface Props {
  status: UploadStatus
  progress: number
  filename: string
}

const STATUS_LABEL: Partial<Record<UploadStatus, string>> = {
  parsing: 'Lettura file in corso...',
  uploading: 'Caricamento dati...',
}

export default function UploadProgress({ status, progress, filename }: Props) {
  const label = STATUS_LABEL[status] ?? ''
  const showPercent = status === 'uploading'

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1A202C]">{label}</p>
          <p className="text-xs text-[#64748B] truncate">{filename}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1E3A5F] rounded-full transition-all duration-300"
            style={{ width: showPercent ? `${progress}%` : '40%' }}
          />
        </div>
        {showPercent && (
          <p className="text-xs text-[#64748B] text-right">{progress}%</p>
        )}
      </div>
    </div>
  )
}
