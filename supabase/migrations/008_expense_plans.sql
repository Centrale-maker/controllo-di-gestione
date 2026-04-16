-- ─── 008_expense_plans.sql ───────────────────────────────────────────────────
-- Sistema di piani di rimborso rateizzati con split per sede e cliente.
-- expense_plans  : piano di rateizzazione legato a una purchase
-- expense_quotas : singola quota rimborsabile (foglia dell'albero)

-- ─── 1. Tabella expense_plans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_plans (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_id     UUID        NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  importo_totale  NUMERIC(10,2) NOT NULL,
  n_periodi       INTEGER     NOT NULL CHECK (n_periodi >= 1),
  data_inizio     DATE        NOT NULL,   -- primo giorno del primo mese
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_plans_company    ON expense_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_plans_purchase   ON expense_plans(purchase_id);

-- ─── 2. Tabella expense_quotas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_quotas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id         UUID        NOT NULL REFERENCES expense_plans(id) ON DELETE CASCADE,
  purchase_id     UUID        NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  periodo         DATE        NOT NULL,   -- sempre il 1° giorno del mese
  sede            TEXT,                  -- es. "Osimo" | "Avezzano" | null
  cliente         TEXT,                  -- es. "AD" | "ADB" | null
  importo         NUMERIC(10,2) NOT NULL,
  quota_index     INTEGER     NOT NULL,  -- 1-based (es. 1)
  quota_totale    INTEGER     NOT NULL,  -- totale periodi (es. 6)
  stato           TEXT        NOT NULL DEFAULT 'da_rimborsare'
                    CHECK (stato IN ('da_rimborsare', 'rimborsata')),
  data_rimborso   DATE,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_quotas_company   ON expense_quotas(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_quotas_plan      ON expense_quotas(plan_id);
CREATE INDEX IF NOT EXISTS idx_expense_quotas_purchase  ON expense_quotas(purchase_id);
CREATE INDEX IF NOT EXISTS idx_expense_quotas_periodo   ON expense_quotas(company_id, periodo);

-- ─── 3. Trigger updated_at su expense_quotas ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_expense_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expense_quotas_updated_at ON expense_quotas;
CREATE TRIGGER trg_expense_quotas_updated_at
  BEFORE UPDATE ON expense_quotas
  FOR EACH ROW EXECUTE FUNCTION update_expense_quotas_updated_at();

-- ─── 4. RLS — expense_plans ──────────────────────────────────────────────────
ALTER TABLE expense_plans ENABLE ROW LEVEL SECURITY;

-- Lettura: stessa azienda
CREATE POLICY "expense_plans_select" ON expense_plans
  FOR SELECT USING (
    company_id = get_my_company_id()
    OR is_super_admin()
  );

-- Insert: solo admin/editor della propria azienda
CREATE POLICY "expense_plans_insert" ON expense_plans
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
      )
    )
  );

-- Update: solo admin/editor
CREATE POLICY "expense_plans_update" ON expense_plans
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
      )
    )
  );

-- Delete: solo admin/editor
CREATE POLICY "expense_plans_delete" ON expense_plans
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
      )
    )
  );

-- ─── 5. RLS — expense_quotas ─────────────────────────────────────────────────
ALTER TABLE expense_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_quotas_select" ON expense_quotas
  FOR SELECT USING (
    company_id = get_my_company_id()
    OR is_super_admin()
  );

CREATE POLICY "expense_quotas_insert" ON expense_quotas
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "expense_quotas_update" ON expense_quotas
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "expense_quotas_delete" ON expense_quotas
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
      )
    )
  );
