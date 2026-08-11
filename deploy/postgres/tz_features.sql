-- TZ features migration: roles, products, flows, financials, enterprise status

ALTER TABLE factories ADD COLUMN IF NOT EXISTS enterprise_status TEXT DEFAULT 'active';

ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS flow_type TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS shipment_date DATE;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS manager_id TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS site_id TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS site_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_site_ids TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS shipment_change_logs (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL,
    user_id TEXT,
    username TEXT,
    action TEXT NOT NULL,
    changes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_links_shipment_date ON supply_links(shipment_date);
CREATE INDEX IF NOT EXISTS idx_supply_links_product_id ON supply_links(product_id);
CREATE INDEX IF NOT EXISTS idx_supply_links_flow_type ON supply_links(flow_type);
CREATE INDEX IF NOT EXISTS idx_supply_links_site_id ON supply_links(site_id);
CREATE INDEX IF NOT EXISTS idx_shipment_change_logs_shipment ON shipment_change_logs(shipment_id);

-- Migrate legacy roles
UPDATE users SET role = 'manager' WHERE role = 'dispatcher';
UPDATE users SET role = 'key_person' WHERE role = 'analyst';
UPDATE users SET role = 'local_employee' WHERE role = 'viewer';
