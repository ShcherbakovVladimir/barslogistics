-- RZD analytics (external railway shipment data, separate from supply_links)

CREATE TABLE IF NOT EXISTS rzd_import_batches (
  id              TEXT PRIMARY KEY,
  filename        TEXT NOT NULL,
  file_hash       TEXT NOT NULL,
  uploaded_by     TEXT,
  row_count       INTEGER NOT NULL DEFAULT 0,
  inserted_count  INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'completed',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS rzd_import_batches_file_hash_idx ON rzd_import_batches (file_hash);

CREATE TABLE IF NOT EXISTS rzd_stations (
  id              TEXT PRIMARY KEY,
  esr_code        TEXT,
  name            TEXT NOT NULL,
  region          TEXT,
  country         TEXT,
  railway         TEXT,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS rzd_stations_esr_code_idx ON rzd_stations (esr_code) WHERE esr_code IS NOT NULL AND esr_code <> '';
CREATE INDEX IF NOT EXISTS rzd_stations_name_region_idx ON rzd_stations (name, region);

CREATE TABLE IF NOT EXISTS rzd_analytics_records (
  id                    TEXT PRIMARY KEY,
  batch_id              TEXT NOT NULL REFERENCES rzd_import_batches(id) ON DELETE CASCADE,
  content_hash          TEXT NOT NULL,
  shipment_date         DATE NOT NULL,
  cargo_code            TEXT,
  cargo_name            TEXT NOT NULL,
  origin_country        TEXT,
  origin_region         TEXT,
  origin_station_name   TEXT NOT NULL,
  origin_station_code   TEXT,
  origin_railway        TEXT,
  dest_country          TEXT,
  dest_region           TEXT,
  dest_station_name     TEXT NOT NULL,
  dest_station_code     TEXT,
  shipper               TEXT,
  consignee             TEXT,
  volume                DOUBLE PRECISION NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 't',
  origin_station_id     TEXT REFERENCES rzd_stations(id),
  dest_station_id       TEXT REFERENCES rzd_stations(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS rzd_analytics_records_content_hash_idx ON rzd_analytics_records (content_hash);
CREATE INDEX IF NOT EXISTS rzd_analytics_records_shipment_date_idx ON rzd_analytics_records (shipment_date);
CREATE INDEX IF NOT EXISTS rzd_analytics_records_cargo_code_idx ON rzd_analytics_records (cargo_code);
CREATE INDEX IF NOT EXISTS rzd_analytics_records_origin_region_idx ON rzd_analytics_records (origin_region);
CREATE INDEX IF NOT EXISTS rzd_analytics_records_dest_region_idx ON rzd_analytics_records (dest_region);
CREATE INDEX IF NOT EXISTS rzd_analytics_records_route_idx ON rzd_analytics_records (origin_station_id, dest_station_id);
