-- Aggiunge colonna targhe (array di stringhe) alla tabella purchases.
-- Contiene le targhe veicoli estratte automaticamente dalla colonna descrizione
-- tramite regex /\b[A-Z]{2}\d{3}[A-Z]{2}\b/ durante il parsing Excel.
-- NULL = nessuna targa trovata nella descrizione.

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS targhe text[] DEFAULT NULL;
