-- Carrier directory: categories (own / rzd / other), CRUD, shipment linkage

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS carrier_id TEXT;

CREATE INDEX IF NOT EXISTS idx_carriers_category ON carriers(category);
CREATE INDEX IF NOT EXISTS idx_carriers_active ON carriers(is_active);
CREATE INDEX IF NOT EXISTS idx_supply_links_carrier_id ON supply_links(carrier_id);

UPDATE carriers SET category = 'rzd' WHERE id = 'c_rzd';
UPDATE carriers SET category = 'other' WHERE id IN ('c_dellin', 'c_fesco', 'c_pgk');

INSERT INTO carriers (id, name, code, category, status, sort_order, is_active, description, api_endpoint)
VALUES (
  'c_own',
  'Собственный автопарк',
  'OWN',
  'own',
  'connected',
  1,
  TRUE,
  'Внутренние перевозки собственным транспортом',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

UPDATE carriers SET sort_order = 2 WHERE id = 'c_rzd';
UPDATE carriers SET sort_order = 10 WHERE id = 'c_dellin';
UPDATE carriers SET sort_order = 11 WHERE id = 'c_fesco';
UPDATE carriers SET sort_order = 12 WHERE id = 'c_pgk';
