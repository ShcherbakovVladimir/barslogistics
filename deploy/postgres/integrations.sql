-- Integration settings (telegram, cloud)
CREATE TABLE IF NOT EXISTS integration_settings (
    category TEXT PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend carriers for admin configuration
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'bearer';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sync_path TEXT DEFAULT '';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS id_field TEXT DEFAULT 'id';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS status_field TEXT DEFAULT 'status';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS last_sync_status TEXT;

-- Extend backups for real files
ALTER TABLE backups ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS cloud_uploaded BOOLEAN DEFAULT FALSE;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS cloud_provider TEXT;

-- External tracking ID for carrier sync mapping
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS external_tracking_id TEXT;

CREATE INDEX IF NOT EXISTS idx_supply_links_external_tracking ON supply_links(external_tracking_id);
