-- ─── 009 — Fatture attive (revenues) ────────────────────────────────────────

-- 1. Tipo upload: distingue acquisti da ricavi
ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'acquisti'
    CHECK (tipo IN ('acquisti', 'ricavi'));

-- 2. Tabella revenues (fatture emesse / ricavi)
CREATE TABLE IF NOT EXISTS revenues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id         UUID REFERENCES uploads(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Dati fattura
  data              DATE NOT NULL,
  prox_scadenza     DATE,
  documento         TEXT,                        -- "Fattura", "Nota di credito", ecc.
  numero            TEXT NOT NULL,               -- numero fattura emessa
  serie             TEXT,
  saldato           BOOLEAN DEFAULT false,

  -- Centro di ricavo (formato: "Tipo, Cliente, ID univoco")
  centro_ricavo     TEXT,
  cr_tipo           TEXT,                        -- parte 1: categoria ricavo
  cr_cliente        TEXT,                        -- parte 2: cliente nel centro
  cr_id             TEXT,                        -- parte 3: ID univoco (chiave di join con purchases.cc_sede)

  -- Anagrafica cliente
  cliente           TEXT,
  comune            TEXT,
  provincia         TEXT,
  cap               TEXT,
  paese             TEXT,
  partita_iva       TEXT,
  codice_fiscale    TEXT,

  -- Oggetto
  oggetto_interno   TEXT,
  oggetto_visibile  TEXT,

  -- Importi
  imponibile        NUMERIC(12,2) DEFAULT 0,
  iva               NUMERIC(12,2) DEFAULT 0,
  cassa             NUMERIC(12,2) DEFAULT 0,
  altra_cassa       NUMERIC(12,2) DEFAULT 0,
  rivalsa           NUMERIC(12,2) DEFAULT 0,
  rit_acconto       NUMERIC(12,2) DEFAULT 0,
  rit_prev          NUMERIC(12,2) DEFAULT 0,
  lordo             NUMERIC(12,2) DEFAULT 0,

  contrassegnato    BOOLEAN DEFAULT false,

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (company_id, numero, data)
);

-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION update_revenues_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS revenues_updated_at ON revenues;
CREATE TRIGGER revenues_updated_at
  BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_revenues_updated_at();

-- 4. RLS
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenues_company_select ON revenues
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY revenues_company_insert ON revenues
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY revenues_company_update ON revenues
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY revenues_company_delete ON revenues
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
