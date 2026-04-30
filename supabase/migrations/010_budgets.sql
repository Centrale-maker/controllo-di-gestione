-- ─── Budget tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  codice              TEXT NOT NULL,
  cliente             TEXT NOT NULL,
  nome                TEXT NOT NULL,
  descrizione         TEXT,
  stato               TEXT NOT NULL DEFAULT 'bozza'
                        CHECK (stato IN ('bozza', 'inviato', 'confermato', 'chiuso')),
  preventivo_bloccato BOOLEAN NOT NULL DEFAULT false,
  totale_bloccato     NUMERIC(12,2),
  bloccato_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, codice)
);

CREATE TABLE IF NOT EXISTS budget_centri (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id  UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_voci (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_centro_id UUID NOT NULL REFERENCES budget_centri(id) ON DELETE CASCADE,
  budget_id        UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  descrizione      TEXT NOT NULL DEFAULT '',
  costo_stimato    NUMERIC(12,2) NOT NULL DEFAULT 0,
  prezzo_vendita   NUMERIC(12,2) NOT NULL DEFAULT 0,
  note             TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_centri ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_voci ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_budgets" ON budgets
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "company_budget_centri" ON budget_centri
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "company_budget_voci" ON budget_voci
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
