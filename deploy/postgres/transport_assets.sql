-- Own transport / equipment directory (fleet + site machinery)

CREATE TABLE IF NOT EXISTS transport_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'both'
    CHECK (purpose IN ('shipment', 'site', 'both')),
  category TEXT NOT NULL,
  type_key TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INT,
  vehicle_number TEXT,
  trailer_number TEXT,
  container_number TEXT,
  vin TEXT,
  chassis_number TEXT,
  engine_number TEXT,
  inventory_number TEXT,
  waybill_number TEXT,
  driver_info TEXT,
  description TEXT,
  specs_note TEXT,
  site_id TEXT REFERENCES factories(id) ON DELETE SET NULL,
  photo_path TEXT,
  photo_mime TEXT,
  photo_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_assets_active ON transport_assets (is_active);
CREATE INDEX IF NOT EXISTS idx_transport_assets_purpose ON transport_assets (purpose);
CREATE INDEX IF NOT EXISTS idx_transport_assets_category ON transport_assets (category);
CREATE INDEX IF NOT EXISTS idx_transport_assets_type ON transport_assets (type_key);
CREATE INDEX IF NOT EXISTS idx_transport_assets_site ON transport_assets (site_id);
CREATE INDEX IF NOT EXISTS idx_transport_assets_sort ON transport_assets (sort_order, name);

ALTER TABLE supply_links
  ADD COLUMN IF NOT EXISTS transport_asset_id TEXT REFERENCES transport_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supply_links_transport_asset
  ON supply_links (transport_asset_id);
