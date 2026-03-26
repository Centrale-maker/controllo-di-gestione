-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crea automaticamente il profilo quando un utente si registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Uploads ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  file_url      TEXT,
  row_count     INTEGER NOT NULL DEFAULT 0,
  rows_added    INTEGER NOT NULL DEFAULT 0,
  rows_updated  INTEGER NOT NULL DEFAULT 0,
  rows_unchanged INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'success', 'error')),
  error_message TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Purchases ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id           UUID REFERENCES uploads(id) ON DELETE SET NULL,
  data                DATE NOT NULL,
  prox_scadenza       DATE,
  nr_acquisto         TEXT NOT NULL,
  ft_elettronica      BOOLEAN NOT NULL DEFAULT true,
  data_ricezione_fe   DATE,
  centro_costo        TEXT,
  categoria           TEXT,
  fornitore           TEXT NOT NULL DEFAULT '',
  descrizione         TEXT NOT NULL DEFAULT '',
  rinnovi             TEXT CHECK (rinnovi IN ('ricorrente', 'una tantum')),
  partita_iva         TEXT,
  codice_fiscale      TEXT,
  comune              TEXT,
  provincia           TEXT,
  paese               TEXT,
  imponibile          NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  rit_acconto         NUMERIC(12,2) NOT NULL DEFAULT 0,
  rit_prev            NUMERIC(12,2) NOT NULL DEFAULT 0,
  deducibilita        BOOLEAN NOT NULL DEFAULT true,
  detraibilita        BOOLEAN NOT NULL DEFAULT true,
  contrassegnato      BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (nr_acquisto, data)
);

-- Aggiorna updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indici per performance query comuni
CREATE INDEX IF NOT EXISTS idx_purchases_data          ON purchases (data);
CREATE INDEX IF NOT EXISTS idx_purchases_prox_scadenza ON purchases (prox_scadenza) WHERE prox_scadenza IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_fornitore     ON purchases (fornitore);
CREATE INDEX IF NOT EXISTS idx_purchases_categoria     ON purchases (categoria);
CREATE INDEX IF NOT EXISTS idx_purchases_centro_costo  ON purchases (centro_costo);
CREATE INDEX IF NOT EXISTS idx_purchases_upload_id     ON purchases (upload_id);
