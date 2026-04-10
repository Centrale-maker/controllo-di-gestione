-- Aggiunge campo acknowledged_at alla tabella uploads
-- Quando l'utente clicca "Ho visto" nella Dashboard, viene impostato a now()
-- Se NULL → l'upload è "nuovo" e le righe vengono evidenziate in verde

ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ DEFAULT NULL;
