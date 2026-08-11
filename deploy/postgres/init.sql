-- BarsLogistics PostgreSQL schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS factories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    holding TEXT DEFAULT '',
    country TEXT,
    region TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_ours BOOLEAN DEFAULT FALSE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supply_links (
    id TEXT PRIMARY KEY,
    origin_id TEXT REFERENCES factories(id),
    destination_id TEXT REFERENCES factories(id),
    cargo_type TEXT,
    volume NUMERIC,
    unit TEXT DEFAULT 'т',
    period TEXT DEFAULT '2025',
    status TEXT,
    progress_pct INTEGER DEFAULT 0,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    speed_kmh NUMERIC,
    eta TEXT,
    carrier_name TEXT,
    driver_info TEXT,
    delay_reason TEXT,
    source TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT,
    username TEXT,
    role TEXT,
    action TEXT,
    category TEXT,
    details TEXT,
    ip_address TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT,
    email TEXT,
    telegram_chat_id TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    password_hash TEXT
);

CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    size_bytes BIGINT,
    type TEXT,
    filename TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS carriers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    status TEXT,
    last_sync TIMESTAMPTZ,
    active_shipments_count INTEGER DEFAULT 0,
    api_endpoint TEXT
);

-- Migrations for databases created with an older schema
ALTER TABLE factories ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS is_ours BOOLEAN DEFAULT FALSE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'т';
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS period TEXT DEFAULT '2025';
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS eta TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS carrier_name TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS driver_info TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_supply_links_status ON supply_links(status);
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp DESC);

CREATE TABLE IF NOT EXISTS integration_settings (
    category TEXT PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'bearer';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sync_path TEXT DEFAULT '';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS id_field TEXT DEFAULT 'id';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS status_field TEXT DEFAULT 'status';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS last_sync_status TEXT;

ALTER TABLE backups ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS cloud_uploaded BOOLEAN DEFAULT FALSE;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS cloud_provider TEXT;

ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS external_tracking_id TEXT;
ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS tracker_id TEXT;

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS lat_field TEXT DEFAULT 'lat';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS lng_field TEXT DEFAULT 'lng';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS speed_field TEXT DEFAULT 'speed_kmh';

CREATE INDEX IF NOT EXISTS idx_supply_links_external_tracking ON supply_links(external_tracking_id);
CREATE INDEX IF NOT EXISTS idx_supply_links_tracker_id ON supply_links(tracker_id);

-- TZ features (also applied via tz_features.sql migration)
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
