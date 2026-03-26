import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

export default function UploadZone({ onFile, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) onFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && isValidFile(file)) onFile(file)
    e.target.value = ''
  }

  function isValidFile(file: File): boolean {
    return file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        flex flex-col items-center justify-center gap-4
        min-h-[220px] rounded-xl border-2 border-dashed cursor-pointer
        transition-colors select-none
        ${dragging
          ? 'border-[#3B82F6] bg-blue-50'
          : 'border-[#E2E8F0] bg-white hover:border-[#3B82F6] hover:bg-blue-50/30'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
          {dragging
            ? <FileSpreadsheet size={28} className="text-[#3B82F6]" />
            : <Upload size={28} className="text-[#64748B]" />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-[#1A202C]">
            {dragging ? 'Rilascia il file qui' : 'Trascina il file Excel qui'}
          </p>
          <p className="text-sm text-[#64748B] mt-0.5">
            oppure <span className="text-[#3B82F6] font-medium">sfoglia</span> per selezionarlo
          </p>
        </div>
        <p className="text-xs text-[#64748B]">Formati supportati: .xlsx, .xls</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
