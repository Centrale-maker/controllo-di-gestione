# CLAUDE.md — Spec di Progetto: IGS Financial Dashboard
> Questo file viene letto automaticamente da Claude Code ad ogni sessione.
> Non modificarlo senza aggiornare anche il Project Brief.

---

## 🏢 Progetto

**Nome cartella:** `controllo-gestione-igs`
**Descrizione:** Business Intelligence dashboard web per l'analisi dei dati contabili di Italian Global Solution S.r.l.
**Dati sorgente:** Export acquisti da FattureInCloud (.xlsx), caricato settimanalmente
**Deploy:** Vercel (gratuito) — CI/CD automatico da GitHub

---

## ⚡ Regole Fondamentali (leggi sempre prima di scrivere codice)

1. **Mobile-first SEMPRE** — ogni componente si sviluppa prima per mobile (≥320px), poi si scala verso desktop. Non esiste "lo sistemiamo dopo per mobile".
2. **TypeScript strict** — niente `any`, niente `// @ts-ignore`. Tipizza tutto.
3. **Niente logica nel JSX** — estrai logica in hook o utility functions.
4. **Supabase è la sola fonte di verità** — niente stato locale persistente, niente localStorage.
5. **Un componente = un file** — max ~150 righe per file. Se supera, splitta.
6. **Variabili d'ambiente** — mai hardcodare URL o chiavi. Sempre da `.env.local`.
7. **Errori sempre gestiti** — ogni chiamata Supabase ha try/catch e feedback UI.

---

## 🛠 Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| Framework | React + Vite | React 18, Vite 5 |
| Linguaggio | TypeScript | strict mode |
| Stile | Tailwind CSS | v4 |
| Componenti UI | shadcn/ui | latest |
| Grafici | Recharts | latest |
| Drag & Drop | @dnd-kit/core + sortable | latest |
| Parsing Excel | xlsx (SheetJS) | latest |
| Date | date-fns | latest |
| Backend/DB | Supabase | latest JS client |
| Deploy | Vercel | - |
| Repo | GitHub | branch: main |

---

## 📱 Responsive — Regole Mobile-First (CRITICO)

### Breakpoints Tailwind da usare
```
default (mobile)  → 320px+   → layout a colonna singola
sm:               → 640px+   → piccole variazioni
md:               → 768px+   → tablet
lg:               → 1024px+  → desktop
xl:               → 1280px+  → desktop wide
```

### Layout Generale
- **Mobile:** sidebar nascosta, nav bottom bar, tutto in colonna singola
- **Tablet (md):** sidebar collassabile laterale
- **Desktop (lg+):** sidebar fissa a sinistra, contenuto a destra

### Navigazione
- **Mobile:** Bottom Navigation Bar fissa (icona + label, max 5 voci)
- **Desktop:** Sidebar verticale sinistra con logo + voci + user info
- Il componente `AppLayout` gestisce entrambi i casi

### KPI Strip
- **Mobile:** scroll orizzontale snap (1 card per volta visibile)
- **Tablet:** 2 colonne
- **Desktop:** tutte in riga

### Grafici
- **Mobile:** altezza fissa 220px, niente label se non ci stanno, tooltip always-on
- **Desktop:** altezza 320px+, label complete
- Usare `ResponsiveContainer` di Recharts SEMPRE (width="100%")

### Tabella Dati
- **Mobile:** card list invece di table (ogni riga = card verticale)
- **Tablet/Desktop:** table classica con sticky header e colonne fisse
- Implementare il component `<DataView>` che switcha automaticamente tra i due layout

### Filtri
- **Mobile:** pulsante "Filtri" che apre un bottom sheet (drawer dal basso)
- **Desktop:** FilterPanel laterale fisso + FilterBar orizzontale in cima

### Form / Upload
- **Mobile:** full-screen, input grandi (min 44px touch target), tastiera non copre i campi importanti
- Tutti i button: min-height 44px, padding adeguato per tocco

### Touch & Gesture
- Swipe per chiudere bottom sheet e drawer
- Tap area minima sempre 44x44px
- Niente hover-only interactions (hover non esiste su mobile)

---

## 🗄 Database Supabase

### Tabelle

#### `purchases` — righe contabili
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
upload_id       UUID REFERENCES uploads(id)
data            DATE NOT NULL
prox_scadenza   DATE
nr_acquisto     TEXT NOT NULL
ft_elettronica  BOOLEAN DEFAULT true
data_ricezione_fe DATE
centro_costo    TEXT
categoria       TEXT
fornitore       TEXT
descrizione     TEXT
rinnovi         TEXT CHECK (rinnovi IN ('ricorrente', 'una tantum'))
partita_iva     TEXT
codice_fiscale  TEXT
comune          TEXT
provincia       TEXT
paese           TEXT
imponibile      NUMERIC(10,2) DEFAULT 0
iva             NUMERIC(10,2) DEFAULT 0
rit_acconto     NUMERIC(10,2) DEFAULT 0
rit_prev        NUMERIC(10,2) DEFAULT 0
deducibilita    BOOLEAN DEFAULT true
detraibilita    BOOLEAN DEFAULT true
contrassegnato  BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(nr_acquisto, data)
```

#### `uploads` — storico import
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
uploaded_by     UUID REFERENCES auth.users(id)
filename        TEXT NOT NULL
file_url        TEXT
row_count       INTEGER DEFAULT 0
rows_added      INTEGER DEFAULT 0
rows_updated    INTEGER DEFAULT 0
rows_unchanged  INTEGER DEFAULT 0
status          TEXT CHECK (status IN ('processing', 'success', 'error'))
error_message   TEXT
uploaded_at     TIMESTAMPTZ DEFAULT now()
```

#### `profiles` — estensione utenti
```sql
id              UUID PRIMARY KEY REFERENCES auth.users(id)
full_name       TEXT
role            TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer'
created_at      TIMESTAMPTZ DEFAULT now()
```

### Chiave di Deduplicazione
La coppia `(nr_acquisto, data)` identifica univocamente una riga.
Upsert: `ON CONFLICT (nr_acquisto, data) DO UPDATE SET ...`

### Row Level Security
- Abilitare RLS su tutte le tabelle
- `purchases` e `uploads`: visibili a tutti gli utenti autenticati
- `profiles`: ogni utente vede solo il proprio profilo (admin vede tutti)

---

## 📂 Struttura Repository

```
controllo-gestione-igs/
├── CLAUDE.md                      ← questo file
├── .env.local                     ← NON committare (in .gitignore)
├── .env.example                   ← template variabili (committare)
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
│
└── src/
    ├── main.tsx
    ├── App.tsx                    ← router + auth guard
    │
    ├── types/
    │   └── index.ts               ← Purchase, Upload, Profile, FilterState
    │
    ├── lib/
    │   ├── supabase.ts            ← createClient
    │   ├── parser.ts              ← Excel → Purchase[] (header riga 5)
    │   ├── upsert.ts              ← logica upsert con contatori
    │   └── utils.ts               ← formatCurrency, formatDate, cn()
    │
    ├── hooks/
    │   ├── useAuth.ts             ← user, role, login, logout
    │   ├── useFilters.ts          ← FilterState, setFilter, resetFilters
    │   ├── usePurchases.ts        ← query Supabase con filtri applicati
    │   ├── useUpload.ts           ← handleFile, uploadProgress, result
    │   └── useIsMobile.ts         ← boolean, breakpoint detection
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx      ← wrapper: sidebar desktop + bottom nav mobile
    │   │   ├── Sidebar.tsx        ← navigazione desktop
    │   │   ├── BottomNav.tsx      ← navigazione mobile (fixed bottom)
    │   │   └── TopBar.tsx         ← header mobile con titolo pagina + filtri btn
    │   │
    │   ├── filters/
    │   │   ├── FilterPanel.tsx    ← pannello laterale desktop / bottom sheet mobile
    │   │   ├── FilterBar.tsx      ← barra filtri attivi con drag & drop (desktop)
    │   │   ├── FilterChip.tsx     ← singolo filtro attivo con X per rimuoverlo
    │   │   ├── FilterBottomSheet.tsx ← drawer mobile per i filtri
    │   │   └── filters/           ← un file per tipo di filtro
    │   │       ├── DateRangeFilter.tsx
    │   │       ├── MultiSelectFilter.tsx
    │   │       ├── RangeSliderFilter.tsx
    │   │       └── ToggleFilter.tsx
    │   │
    │   ├── kpi/
    │   │   ├── KPIStrip.tsx       ← contenitore KPI (scroll mobile, row desktop)
    │   │   └── KPICard.tsx        ← singola card KPI
    │   │
    │   ├── charts/
    │   │   ├── CashflowChart.tsx
    │   │   ├── CentroCostoChart.tsx
    │   │   ├── CategorieChart.tsx
    │   │   ├── RinnoviChart.tsx
    │   │   ├── TopFornitoriChart.tsx
    │   │   └── PaeseChart.tsx
    │   │
    │   ├── tables/
    │   │   ├── DataView.tsx       ← switch automatico table↔cards
    │   │   ├── DataTable.tsx      ← tabella desktop con sort + paginazione
    │   │   └── DataCards.tsx      ← card list mobile
    │   │
    │   └── upload/
    │       ├── UploadZone.tsx     ← drag&drop file + click to browse
    │       ├── UploadProgress.tsx ← progress bar durante import
    │       ├── UploadResult.tsx   ← riepilogo: X add, Y upd, Z unch
    │       └── UploadHistory.tsx  ← lista upload passati
    │
    └── pages/
        ├── Login.tsx
        ├── Dashboard.tsx
        ├── Analytics.tsx
        ├── Scadenze.tsx
        ├── Fornitori.tsx
        ├── Upload.tsx
        ├── Storico.tsx
        └── Settings.tsx
```

---

## 🔐 Autenticazione

- **Provider:** Supabase Auth (email + password)
- **Ruoli:** `admin` | `editor` | `viewer` (da tabella `profiles`)
- **Guard:** `<AuthGuard>` in App.tsx — redirect a `/login` se non autenticato
- **Accessi per ruolo:**

| Pagina | viewer | editor | admin |
|--------|--------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ |
| Scadenze | ✅ | ✅ | ✅ |
| Fornitori | ✅ | ✅ | ✅ |
| Upload | ❌ | ✅ | ✅ |
| Storico | ❌ | ❌ | ✅ |
| Settings | ❌ | ❌ | ✅ |

---

## 📥 Parser Excel — Dettagli Critici

```typescript
// Il file ha metadati nelle righe 1-4, l'header è alla riga 5 (index 4)
// SheetJS: read con { header: 1 } poi skippa le prime 4 righe
// Oppure: read con defval: null e usa la riga 4 come header

// Mapping colonne Excel → campo DB:
"Data"               → data           (Date)
"Prox scadenza"      → prox_scadenza  (Date | null)
"Nr. acquisto"       → nr_acquisto    (string)
"Ft elettronica"     → ft_elettronica (bool: "SI" → true)
"Data ricezione FE"  → data_ricezione_fe (Date)
"Centro costo"       → centro_costo   (string | null)
"Categoria"          → categoria      (string | null)
"Fornitore"          → fornitore      (string)
"Descrizione"        → descrizione    (string)
"rinnovi"            → rinnovi        ("ricorrente" | "una tantum" | null)
"Partita IVA"        → partita_iva    (string | null)
"Codice fiscale"     → codice_fiscale (string | null)
"Comune"             → comune         (string | null)
"Provincia"          → provincia      (string | null)
"Paese"              → paese          (string | null)
"Imponibile"         → imponibile     (number)
"IVA"                → iva            (number)
"Rit. acconto"       → rit_acconto    (number)
"Rit. prev."         → rit_prev       (number)
"Deducibilità"       → deducibilita   (bool: 1 → true, 0 → false)
"Detraibilità"       → detraibilita   (bool: 1 → true, 0 → false)
"Contrassegnato"     → contrassegnato (bool: "SI" → true)

// ATTENZIONE:
// - Le date in Excel sono numeri seriali → usare XLSX.SSF.parse_date_code()
// - Partita IVA e CAP possono essere numeri o stringhe → normalizzare a string
// - "Indirizzo extra" è sempre null nel dataset attuale → ignorare
// - "Valuta orig." è sempre "EUR" → salvare ma non usare per ora
```

---

## 🔄 Logica Upsert

```typescript
// Per ogni riga parsata dall'Excel:
// 1. Cerca in DB per (nr_acquisto, data)
// 2a. Non trovata → INSERT → rows_added++
// 2b. Trovata, dati cambiati → UPDATE → rows_updated++
// 2c. Trovata, dati identici → skip → rows_unchanged++

// Usare Supabase upsert con:
const { error } = await supabase
  .from('purchases')
  .upsert(rows, {
    onConflict: 'nr_acquisto,data',
    ignoreDuplicates: false  // false = aggiorna se cambiato
  })

// Per contare add/update/unchanged fare una query PRIMA dell'upsert
// per sapere quante righe esistono già e confrontare i dati
```

---

## 🎛 Sistema Filtri

### Stato globale (useFilters hook)
```typescript
interface FilterState {
  dateRange: { from: Date | null; to: Date | null }
  scadenzaRange: { from: Date | null; to: Date | null }
  centroCosto: string[]
  categoria: string[]
  fornitore: string[]
  rinnovi: 'ricorrente' | 'una tantum' | null
  paese: string[]
  provincia: string[]
  imponibileRange: { min: number | null; max: number | null }
  ivaRange: { min: number | null; max: number | null }
  soloScaduti: boolean
  ftElettronica: boolean | null
  deducibile: boolean | null
  detraibile: boolean | null
  contrassegnato: boolean | null
  searchText: string
}
```

### Filtri attivi → URL params
Serializzare FilterState in query string per permettere di condividere le view.
Usare `useSearchParams` di React Router.

### Drag & Drop (desktop)
- Usare `@dnd-kit` per trascinare filtri dal FilterPanel alla FilterBar
- Ogni filtro ha un `id` univoco e può stare in uno dei due spazi
- Su mobile: niente drag, solo toggle on/off nel bottom sheet

---

## 📊 KPI — Calcoli

Tutti calcolati sui dati filtrati:

| KPI | Formula |
|-----|---------|
| Totale Imponibile | SUM(imponibile) |
| Totale IVA | SUM(iva) |
| Totale Lordo | SUM(imponibile + iva) |
| Totale Ritenute | SUM(rit_acconto + rit_prev) |
| N° Fatture | COUNT(*) |
| N° Fornitori unici | COUNT(DISTINCT fornitore) |
| Scadenze entro 30gg | COUNT WHERE prox_scadenza BETWEEN oggi E oggi+30 |
| Scadenze scadute | COUNT WHERE prox_scadenza < oggi AND prox_scadenza IS NOT NULL |

---

## 🎨 Design System

### Colori principali
```
Primary:     #1E3A5F  (blu IGS)
Primary light: #2E5F8A
Accent:      #3B82F6  (blu azione)
Success:     #10B981  (verde)
Warning:     #F59E0B  (arancio)
Danger:      #EF4444  (rosso)
Background:  #F8FAFC
Surface:     #FFFFFF
Border:      #E2E8F0
Text:        #1A202C
Muted:       #64748B
```

### Tipografia
- Font: sistema (Inter se disponibile, altrimenti system-ui)
- Heading mobile: 18-24px
- Body mobile: 14px
- Label: 12px

### Spaziatura
- Padding mobile: 16px (p-4)
- Gap tra card: 12px (gap-3)
- Border radius: 8px (rounded-lg)

---

## 🚀 Ordine di Sviluppo

Seguire questo ordine tassativamente. Non iniziare una fase se la precedente non compila e funziona.

### FASE 1 — Fondamenta
- [ ] Init Vite + React + TypeScript
- [ ] Tailwind CSS v4 configurato
- [ ] shadcn/ui inizializzato
- [ ] Supabase client configurato (`src/lib/supabase.ts`)
- [ ] Tipi TypeScript definiti (`src/types/index.ts`)
- [ ] `.env.local` e `.env.example` creati

### FASE 2 — Database
- [ ] Migration `001_initial_schema.sql` (purchases, uploads, profiles)
- [ ] Migration `002_rls_policies.sql`
- [ ] Bucket Storage `excel-uploads` creato su Supabase

### FASE 3 — Auth
- [ ] Pagina Login (`/login`) — form email/password, mobile-first
- [ ] Hook `useAuth` con user, role, login, logout
- [ ] `AuthGuard` component — redirect se non autenticato
- [ ] `AppLayout` con routing condizionale per ruolo

### FASE 4 — Layout & Navigazione
- [ ] `AppLayout` — struttura generale
- [ ] `Sidebar` desktop (lg+)
- [ ] `BottomNav` mobile (default)
- [ ] `TopBar` mobile con titolo + bottone filtri
- [ ] Hook `useIsMobile`

### FASE 5 — Import Excel
- [ ] `src/lib/parser.ts` — parsing Excel con SheetJS (header riga 5)
- [ ] `src/lib/upsert.ts` — logica upsert con contatori
- [ ] Pagina Upload con UploadZone
- [ ] UploadProgress + UploadResult
- [ ] Test con file reale FattureInCloud

### FASE 6 — Dashboard Base
- [ ] Hook `useFilters` con FilterState
- [ ] Hook `usePurchases` — query Supabase con filtri
- [ ] `KPIStrip` + `KPICard` (scroll mobile, row desktop)
- [ ] `DataView` — switch automatico table/cards
- [ ] `DataTable` desktop
- [ ] `DataCards` mobile

### FASE 7 — Filtri
- [ ] `FilterPanel` desktop + `FilterBottomSheet` mobile
- [ ] Tutti i tipi di filtro (DateRange, MultiSelect, RangeSlider, Toggle)
- [ ] `FilterBar` con drag & drop (desktop)
- [ ] `FilterChip` con rimozione
- [ ] Serializzazione in URL params

### FASE 8 — Grafici
- [ ] `CashflowChart` — linechart per mese
- [ ] `CentroCostoChart` — barchart orizzontale
- [ ] `CategorieChart` — donut
- [ ] `RinnoviChart` — pie
- [ ] `TopFornitoriChart` — barchart top 10
- [ ] `PaeseChart` — barchart per paese

### FASE 9 — Pagine secondarie
- [ ] Pagina Scadenze — lista + alert colori
- [ ] Pagina Fornitori — tabella + dettaglio
- [ ] Pagina Analytics — P&L mensile + confronto periodi
- [ ] Pagina Storico — lista upload con dettagli

### FASE 10 — Polish
- [ ] Settings — gestione utenti (solo admin)
- [ ] Export CSV filtrato
- [ ] Loading skeletons su ogni sezione
- [ ] Error boundaries
- [ ] Empty states (nessun dato, nessun risultato filtri)
- [ ] Test responsività su 320px, 375px, 768px, 1024px, 1440px

---

## ✅ Checklist Pre-Deploy

- [ ] `.env.local` in `.gitignore`
- [ ] Nessuna chiave hardcodata nel codice
- [ ] RLS abilitato su tutte le tabelle Supabase
- [ ] Build Vite senza errori TypeScript
- [ ] Test su Chrome mobile (DevTools), Safari iOS, Chrome Android
- [ ] Tutte le route protette funzionano correttamente
- [ ] Upload di un file Excel reale funziona end-to-end
- [ ] Variabili env configurate su Vercel

---

## 📝 Comandi Utili

```bash
# Sviluppo locale
npm run dev

# Build produzione
npm run build

# Preview build locale
npm run preview

# Type check
npx tsc --noEmit

# Install dipendenze
npm install

# Aggiungere componente shadcn
npx shadcn@latest add <component>
```

---

## ⚠️ Errori Comuni da Evitare

1. **NON** usare `table` su mobile — usare `DataView` che switcha su cards
2. **NON** mettere grafici con larghezza fissa — sempre `ResponsiveContainer width="100%"`
3. **NON** usare `hover:` senza alternativa touch
4. **NON** mettere padding < 16px sui lati su mobile
5. **NON** usare font-size < 14px su mobile (illeggibile)
6. **NON** dimenticare `overflow-x: hidden` sul body (evita scroll orizzontale indesiderato)
7. **NON** usare `position: fixed` senza testare con tastiera virtuale aperta
8. **NON** committare `.env.local`
9. **NON** usare `any` in TypeScript
10. **NON** fare chiamate Supabase senza gestire l'errore

---

*Ultimo aggiornamento: Marzo 2026 — IGS Financial Dashboard v1.0*
