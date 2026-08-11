-- Shipment event timeline (status changes, delays, early arrivals, comments)
CREATE TABLE IF NOT EXISTS shipment_events (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES supply_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  timing_kind TEXT,
  delay_reason TEXT,
  delay_hours NUMERIC,
  early_hours NUMERIC,
  comment TEXT,
  eta_before TEXT,
  eta_after TEXT,
  origin_id TEXT,
  destination_id TEXT,
  product_id TEXT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment
  ON shipment_events (shipment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_events_created
  ON shipment_events (created_at DESC);
