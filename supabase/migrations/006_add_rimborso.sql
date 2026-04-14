-- Migration 006: aggiunge colonna rimborso a purchases
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS rimborso TEXT
    CHECK (rimborso IN ('rimborsata', 'non rimborsata'));
