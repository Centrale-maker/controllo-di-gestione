import { useState } from 'react'
import { useUpload } from '@/hooks/useUpload'
import UploadZone from '@/components/upload/UploadZone'
import UploadProgress from '@/components/upload/UploadProgress'
import UploadResult from '@/components/upload/UploadResult'
import UploadHistory from '@/components/upload/UploadHistory'

export default function Upload() {
  const { state, handleFile, reset } = useUpload()
  const [historyKey, setHistoryKey] = useState(0)

  function handleReset() {
    if (state.status === 'done') setHistoryKey(k => k + 1)
    reset()
  }

  const isActive = state.status === 'parsing' || state.status === 'uploading'

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-base font-semibold text-[#1A202C]">Importa acquisti</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Carica il file Excel esportato da FattureInCloud
        </p>
      </div>

      {state.status === 'idle' && (
        <UploadZone onFile={handleFile} />
      )}

      {isActive && (
        <UploadProgress
          status={state.status}
          progress={state.progress}
          filename={state.filename}
        />
      )}

      {(state.status === 'done' || state.status === 'error') && (
        <UploadResult
          result={state.result}
          error={state.error}
          filename={state.filename}
          onReset={handleReset}
        />
      )}

      <div>
        <h3 className="text-sm font-semibold text-[#1A202C] mb-3">Ultimi upload</h3>
        <UploadHistory refreshKey={historyKey} />
      </div>
    </div>
  )
}
