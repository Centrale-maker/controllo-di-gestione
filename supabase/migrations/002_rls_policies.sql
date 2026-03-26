-- ─── Abilita RLS su tutte le tabelle ─────────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- Ogni utente vede solo il proprio profilo
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin vede tutti i profili
CREATE POLICY "profiles: admin select all"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Ogni utente aggiorna solo il proprio profilo
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin aggiorna tutti i profili
CREATE POLICY "profiles: admin update all"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── uploads ──────────────────────────────────────────────────────────────────
-- Tutti gli autenticati possono vedere gli upload
CREATE POLICY "uploads: authenticated select"
  ON uploads FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo editor e admin possono inserire
CREATE POLICY "uploads: editor insert"
  ON uploads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- Solo admin può aggiornare/cancellare
CREATE POLICY "uploads: admin update"
  ON uploads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── purchases ────────────────────────────────────────────────────────────────
-- Tutti gli autenticati possono vedere i dati
CREATE POLICY "purchases: authenticated select"
  ON purchases FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo editor e admin possono inserire/aggiornare
CREATE POLICY "purchases: editor insert"
  ON purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY "purchases: editor update"
  ON purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- Solo admin può cancellare
CREATE POLICY "purchases: admin delete"
  ON purchases FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
