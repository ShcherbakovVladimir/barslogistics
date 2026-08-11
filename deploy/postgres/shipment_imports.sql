-- CSV import batches for internal shipments (manager uploads)

CREATE TABLE IF NOT EXISTS shipment_import_batches (
  id              TEXT PRIMARY KEY,
  filename        TEXT NOT NULL,
  file_hash       TEXT NOT NULL UNIQUE,
  uploaded_by     TEXT,
  row_count       INT NOT NULL DEFAULT 0,
  inserted_count  INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  error_count     INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'completed',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipment_import_batches_created_idx
  ON shipment_import_batches (created_at DESC);

ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS content_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS supply_links_content_hash_idx
  ON supply_links (content_hash) WHERE content_hash IS NOT NULL AND content_hash <> '';
