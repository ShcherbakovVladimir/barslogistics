-- Structured ETA timestamp for overdue checks and analytics (display text stays in eta)
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS eta_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_supply_links_eta_at
  ON supply_links (eta_at)
  WHERE eta_at IS NOT NULL;
