-- ─── 003_cc_mapping.sql ──────────────────────────────────────────────────────
-- Aggiunge le tre colonne cc_tipo / cc_sede / cc_cliente a purchases
-- e crea la tabella di mapping manuale per la colonna "Centro costo"

-- 1. Nuove colonne su purchases
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS cc_tipo    TEXT,
  ADD COLUMN IF NOT EXISTS cc_sede    TEXT,
  ADD COLUMN IF NOT EXISTS cc_cliente TEXT;

-- Indici per filtrare per tipo / sede / cliente
CREATE INDEX IF NOT EXISTS idx_purchases_cc_tipo    ON purchases (cc_tipo);
CREATE INDEX IF NOT EXISTS idx_purchases_cc_sede    ON purchases (cc_sede);
CREATE INDEX IF NOT EXISTS idx_purchases_cc_cliente ON purchases (cc_cliente);

-- 2. Tabella di mapping: raw_value (normalizzato) → cc_tipo / cc_sede / cc_cliente
CREATE TABLE IF NOT EXISTS cc_mapping (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_value   TEXT        NOT NULL UNIQUE,   -- valore normalizzato (spazi, typo corretti)
  cc_tipo     TEXT,
  cc_sede     TEXT,
  cc_cliente  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE cc_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_mapping_select" ON cc_mapping
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cc_mapping_insert" ON cc_mapping
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cc_mapping_update" ON cc_mapping
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cc_mapping_delete" ON cc_mapping
  FOR DELETE TO authenticated USING (true);

-- 3. Dati iniziali: tutti i valori già visti nel file export 08-04-2026
--    raw_value = valore già normalizzato (typo corretti, spazi collassati)
INSERT INTO cc_mapping (raw_value, cc_tipo, cc_sede, cc_cliente) VALUES
  ('Logistica generale',                    'Logistica',               'generale',             NULL),
  ('Logistica Avezzano AD',                 'Logistica',               'Avezzano',             'AD'),
  ('Logistica Roma AD',                     'Logistica',               'Roma',                 'AD'),
  ('Logistica Foggia ADB',                  'Logistica',               'Foggia',               'ADB'),
  ('Logistica Bastia AD',                   'Logistica',               'Bastia',               'AD'),
  ('Logistica Atri ADB',                    'Logistica',               'Atri',                 'ADB'),
  ('Logistica Marotta ADB',                 'Logistica',               'Marotta',              'ADB'),
  ('Marketing centrale IGS',                'Marketing',               'centrale IGS',         NULL),
  ('Marketing ADB',                         'Marketing',               NULL,                   'ADB'),
  ('Marketing AD',                          'Marketing',               NULL,                   'AD'),
  ('Marketing Pera Stefano',                'Marketing',               'Pera Stefano',         NULL),
  ('Marketing Peramorecentrostile',         'Marketing',               'Peramorecentrostile',  NULL),
  ('Marketing ADB',                         'Marketing',               NULL,                   'ADB'),
  ('Amministrazione centrale IGS',          'Amministrazione',         'centrale IGS',         NULL),
  ('Amministrazione generale',              'Amministrazione',         'generale',             NULL),
  ('Amministrazione Pera Stefano',          'Amministrazione',         'Pera Stefano',         NULL),
  ('Spese di rappresentanza centrale IGS',  'Spese di rappresentanza', 'centrale IGS',         NULL),
  ('Rappresentanza Osimo',                  'Rappresentanza',          'Osimo',                NULL),
  ('Rappresentanza logistica Avezzano',     'Rappresentanza',          'logistica Avezzano',   NULL),
  ('Sviluppo Bacheca Aziende',              'Sviluppo',                'Bacheca Aziende',      NULL)
ON CONFLICT (raw_value) DO NOTHING;
