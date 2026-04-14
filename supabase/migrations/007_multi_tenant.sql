-- ─── 007_multi_tenant.sql ────────────────────────────────────────────────────
-- Trasformazione multi-tenant: aggiunge companies, company_id su tutte le
-- tabelle, ruolo super_admin, RLS per isolamento dati tra aziende.

-- ─── 1. Tabella companies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE,
  plan        TEXT        NOT NULL DEFAULT 'trial'
                CHECK (plan IN ('trial', 'pro', 'enterprise')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Aggiunge company_id alle tabelle esistenti ────────────────────────────
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE uploads   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE cc_mapping ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- ─── 3. Aggiunge super_admin al check sul ruolo ───────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer'));

-- ─── 4. Crea la company IGS e assegna tutti i dati esistenti ─────────────────
DO $$
DECLARE
  igs_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO companies (id, name, slug, plan)
  VALUES (igs_id, 'Italian Global Solution S.r.l.', 'igs', 'pro')
  ON CONFLICT (id) DO NOTHING;

  -- Assegna tutti i dati esistenti alla company IGS
  -- (i profili super_admin non appartengono a nessuna company)
  UPDATE profiles   SET company_id = igs_id WHERE company_id IS NULL AND role != 'super_admin';
  UPDATE purchases  SET company_id = igs_id WHERE company_id IS NULL;
  UPDATE uploads    SET company_id = igs_id WHERE company_id IS NULL;
  UPDATE cc_mapping SET company_id = igs_id WHERE company_id IS NULL;
END $$;

-- ─── 5. NOT NULL su purchases e uploads dopo la migrazione ───────────────────
ALTER TABLE purchases ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE uploads   ALTER COLUMN company_id SET NOT NULL;

-- ─── 6. Aggiorna il vincolo UNIQUE su purchases per includere company_id ──────
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_nr_acquisto_data_key;
ALTER TABLE purchases ADD CONSTRAINT purchases_company_nr_data_key
  UNIQUE (company_id, nr_acquisto, data);

-- ─── 7. Aggiorna il vincolo UNIQUE su cc_mapping per essere per-company ───────
ALTER TABLE cc_mapping DROP CONSTRAINT IF EXISTS cc_mapping_raw_value_key;
ALTER TABLE cc_mapping ADD CONSTRAINT cc_mapping_company_raw_key
  UNIQUE (company_id, raw_value);

-- ─── 8. Indice su company_id per performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON purchases (company_id);
CREATE INDEX IF NOT EXISTS idx_uploads_company_id   ON uploads   (company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id  ON profiles  (company_id);

-- ─── 9. Funzioni helper (SECURITY DEFINER per bypassare RLS nelle policy) ─────
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- ─── 10. Aggiorna trigger handle_new_user per accettare company_id ─────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, company_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NULLIF(NEW.raw_user_meta_data->>'company_id', '')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 11. Droppa le vecchie RLS policy e crea le nuove ────────────────────────

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies: super_admin full access" ON companies FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "companies: members select own" ON companies FOR SELECT
  USING (id = get_my_company_id());

-- purchases
DROP POLICY IF EXISTS "purchases: authenticated select" ON purchases;
DROP POLICY IF EXISTS "purchases: editor insert"        ON purchases;
DROP POLICY IF EXISTS "purchases: editor update"        ON purchases;
DROP POLICY IF EXISTS "purchases: admin delete"         ON purchases;

CREATE POLICY "purchases: company select" ON purchases FOR SELECT
  USING (is_super_admin() OR company_id = get_my_company_id());

CREATE POLICY "purchases: editor insert" ON purchases FOR INSERT
  WITH CHECK (
    is_super_admin() OR (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
    )
  );

CREATE POLICY "purchases: editor update" ON purchases FOR UPDATE
  USING (
    is_super_admin() OR (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
    )
  );

CREATE POLICY "purchases: admin delete" ON purchases FOR DELETE
  USING (
    is_super_admin() OR (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- uploads
DROP POLICY IF EXISTS "uploads: authenticated select" ON uploads;
DROP POLICY IF EXISTS "uploads: editor insert"        ON uploads;
DROP POLICY IF EXISTS "uploads: admin update"         ON uploads;

CREATE POLICY "uploads: company select" ON uploads FOR SELECT
  USING (is_super_admin() OR company_id = get_my_company_id());

CREATE POLICY "uploads: editor insert" ON uploads FOR INSERT
  WITH CHECK (
    is_super_admin() OR (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
    )
  );

CREATE POLICY "uploads: admin update" ON uploads FOR UPDATE
  USING (
    is_super_admin() OR (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- profiles
DROP POLICY IF EXISTS "profiles: select own"       ON profiles;
DROP POLICY IF EXISTS "profiles: admin select all" ON profiles;
DROP POLICY IF EXISTS "profiles: update own"       ON profiles;
DROP POLICY IF EXISTS "profiles: admin update all" ON profiles;

CREATE POLICY "profiles: select" ON profiles FOR SELECT
  USING (
    is_super_admin() OR
    auth.uid() = id OR
    (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "profiles: insert" ON profiles FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    auth.uid() = id OR
    (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "profiles: update" ON profiles FOR UPDATE
  USING (
    is_super_admin() OR
    auth.uid() = id OR
    (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "profiles: delete" ON profiles FOR DELETE
  USING (
    is_super_admin() OR
    (
      company_id = get_my_company_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- cc_mapping: per company
DROP POLICY IF EXISTS "cc_mapping_select" ON cc_mapping;
DROP POLICY IF EXISTS "cc_mapping_insert" ON cc_mapping;
DROP POLICY IF EXISTS "cc_mapping_update" ON cc_mapping;
DROP POLICY IF EXISTS "cc_mapping_delete" ON cc_mapping;

CREATE POLICY "cc_mapping: company select" ON cc_mapping FOR SELECT
  USING (is_super_admin() OR company_id = get_my_company_id());

CREATE POLICY "cc_mapping: editor insert" ON cc_mapping FOR INSERT
  WITH CHECK (is_super_admin() OR company_id = get_my_company_id());

CREATE POLICY "cc_mapping: editor update" ON cc_mapping FOR UPDATE
  USING (is_super_admin() OR company_id = get_my_company_id());

CREATE POLICY "cc_mapping: admin delete" ON cc_mapping FOR DELETE
  USING (is_super_admin() OR company_id = get_my_company_id());
