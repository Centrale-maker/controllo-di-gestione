import { useState } from 'react'
import { useUploadRevenues } from '@/hooks/useUploadRevenues'
import UploadZone from '@/components/upload/UploadZone'
import UploadProgress from '@/components/upload/UploadProgress'
import UploadResult from '@/components/upload/UploadResult'
import UploadRicaviHistory from '@/components/upload/UploadRicaviHistory'

export default function UploadRicavi() {
  const { state, handleFile, reset } = useUploadRevenues()
  const [historyKey, setHistoryKey] = useState(0)

  function handleReset() {
    if (state.status === 'done') setHistoryKey(k => k + 1)
    reset()
  }

  const isActive = state.status === 'parsing' || state.status === 'uploading'

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-base font-semibold text-[#1A202C]">Importa fatture attive</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Carica il file Excel &quot;Documenti emessi&quot; esportato da FattureInCloud
        </p>
      </div>

      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-4 py-3 text-xs text-[#1E40AF]">
        <p className="font-semibold mb-1">Formato colonna &quot;Centro ricavo&quot;</p>
        <p>Inserisci nel campo <strong>Centro ricavo</strong> di FattureInCloud il valore nel formato:</p>
        <p className="font-mono mt-1 bg-white/60 rounded px-2 py-1">Tipo ricavo, Cliente, ID univoco</p>
        <p className="mt-1">Esempio: <span className="font-mono">Ricavi Evento, Fiera Milano Spa, EVT-001</span></p>
        <p className="mt-1">L&apos;ID univoco deve corrispondere a quello dei costi collegati.</p>
      </div>

      {state.status === 'idle' && <UploadZone onFile={handleFile} />}

      {isActive && (
        <UploadProgress status={state.status} progress={state.progress} filename={state.filename} />
      )}

      {(state.status === 'done' || state.status === 'error') && (
        <UploadResult result={state.result} error={state.error} filename={state.filename} onReset={handleReset} />
      )}

      <div>
        <h3 className="text-sm font-semibold text-[#1A202C] mb-3">Ultimi upload ricavi</h3>
        <UploadRicaviHistory refreshKey={historyKey} />
      </div>
    </div>
  )
}
