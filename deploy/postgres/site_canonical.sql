-- Single source of truth: canonical business key + legacy id aliases

ALTER TABLE factories ADD COLUMN IF NOT EXISTS canonical_key TEXT;

CREATE TABLE IF NOT EXISTS site_aliases (
    alias_id TEXT PRIMARY KEY,
    factory_id TEXT NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'legacy',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_factories_canonical_key_active
    ON factories (canonical_key)
    WHERE canonical_key IS NOT NULL AND COALESCE(is_active, TRUE) = TRUE;

CREATE INDEX IF NOT EXISTS idx_site_aliases_factory_id ON site_aliases(factory_id);
CREATE INDEX IF NOT EXISTS idx_factories_canonical_key ON factories(canonical_key);
