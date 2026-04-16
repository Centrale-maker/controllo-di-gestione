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
  cc_tipo: string | null               // es. "Logistica", "Marketing"
  cc_sede: string | null               // es. "Avezzano", "centrale IGS"
  cc_cliente: string | null            // es. "AD", "ADB"
  categoria: string | null
  fornitore: string
  descrizione: string
  targhe: string[] | null
  rinnovi: 'ricorrente' | 'una tantum' | null
  rimborso: 'rimborsata' | 'non rimborsata' | null
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

// ─── CcMapping ───────────────────────────────────────────────────────────────

export interface CcMapping {
  id: string
  raw_value: string
  cc_tipo: string | null
  cc_sede: string | null
  cc_cliente: string | null
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
  acknowledged_at: string | null
}

// ─── Company ─────────────────────────────────────────────────────────────────

export type CompanyPlan = 'trial' | 'pro' | 'enterprise'

export interface Company {
  id: string
  name: string
  slug: string | null
  plan: CompanyPlan
  created_at: string
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  company_id: string | null
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
  ccTipo: string[]
  ccSede: string[]
  ccCliente: string[]
  categoria: string[]
  fornitore: string[]
  rinnovi: 'ricorrente' | 'una tantum' | null
  rimborso: 'rimborsata' | 'non rimborsata' | null
  targa: string[]
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

// ─── ExpensePlan ─────────────────────────────────────────────────────────────

export interface ExpensePlan {
  id: string
  company_id: string
  purchase_id: string
  importo_totale: number
  n_periodi: number
  data_inizio: string   // ISO date — primo giorno del primo mese
  note: string | null
  created_at: string
  // join opzionale
  purchase?: Purchase
}

// ─── ExpenseQuota ─────────────────────────────────────────────────────────────

export type QuotaStato = 'da_rimborsare' | 'rimborsata'

export interface ExpenseQuota {
  id: string
  company_id: string
  plan_id: string
  purchase_id: string
  periodo: string       // ISO date — sempre il 1° del mese
  sede: string | null
  cliente: string | null
  importo: number
  quota_index: number   // 1-based
  quota_totale: number
  stato: QuotaStato
  data_rimborso: string | null
  note: string | null
  created_at: string
  updated_at: string
  // join opzionale
  purchase?: Purchase
  plan?: ExpensePlan
}

// Riga "diretta" sintetica usata nella pagina Rimborsi per le purchases senza piano
export interface DirectReimbursement {
  purchase: Purchase
  tipo: 'direct'
}

export interface PlanReimbursement {
  plan: ExpensePlan
  quotas: ExpenseQuota[]
  tipo: 'plan'
}

export type ReimbursementRow = DirectReimbursement | PlanReimbursement

// ─── Filters ─────────────────────────────────────────────────────────────────

export const defaultFilterState: FilterState = {
  dateRange: { from: null, to: null },
  scadenzaRange: { from: null, to: null },
  centroCosto: [],
  ccTipo: [],
  ccSede: [],
  ccCliente: [],
  categoria: [],
  fornitore: [],
  rinnovi: null,
  rimborso: null,
  targa: [],
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
