// ─── Purchase ────────────────────────────────────────────────────────────────

export interface Purchase {
  id: string
  upload_id: string | null
  data: string                          // ISO date
  prox_scadenza: string | null
  nr_acquisto: string
  ft_elettronica: boolean
  data_ricezione_fe: string | null
  centro_costo: string | null
  categoria: string | null
  fornitore: string
  descrizione: string
  rinnovi: 'ricorrente' | 'una tantum' | null
  partita_iva: string | null
  codice_fiscale: string | null
  comune: string | null
  provincia: string | null
  paese: string | null
  imponibile: number
  iva: number
  rit_acconto: number
  rit_prev: number
  deducibilita: boolean
  detraibilita: boolean
  contrassegnato: boolean
  created_at: string
  updated_at: string
}

// Riga Excel prima del parsing → campi ancora grezzi
export type PurchaseInsert = Omit<Purchase, 'id' | 'created_at' | 'updated_at'>

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface Upload {
  id: string
  uploaded_by: string
  filename: string
  file_url: string | null
  row_count: number
  rows_added: number
  rows_updated: number
  rows_unchanged: number
  status: 'processing' | 'success' | 'error'
  error_message: string | null
  uploaded_at: string
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  created_at: string
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date | null
  to: Date | null
}

export interface NumberRange {
  min: number | null
  max: number | null
}

export interface FilterState {
  dateRange: DateRange
  scadenzaRange: DateRange
  centroCosto: string[]
  categoria: string[]
  fornitore: string[]
  rinnovi: 'ricorrente' | 'una tantum' | null
  paese: string[]
  provincia: string[]
  imponibileRange: NumberRange
  ivaRange: NumberRange
  soloScaduti: boolean
  ftElettronica: boolean | null
  deducibile: boolean | null
  detraibile: boolean | null
  contrassegnato: boolean | null
  searchText: string
}

export const defaultFilterState: FilterState = {
  dateRange: { from: null, to: null },
  scadenzaRange: { from: null, to: null },
  centroCosto: [],
  categoria: [],
  fornitore: [],
  rinnovi: null,
  paese: [],
  provincia: [],
  imponibileRange: { min: null, max: null },
  ivaRange: { min: null, max: null },
  soloScaduti: false,
  ftElettronica: null,
  deducibile: null,
  detraibile: null,
  contrassegnato: null,
  searchText: '',
}
