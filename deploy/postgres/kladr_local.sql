-- Local KLADR/FIAS address classifier tables (imported from official Base.7z)

CREATE TABLE IF NOT EXISTS kladr_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kladr_settlement (
  code CHAR(13) PRIMARY KEY,
  name TEXT NOT NULL,
  socr TEXT NOT NULL DEFAULT '',
  postal_index TEXT DEFAULT '',
  region_code CHAR(2) NOT NULL DEFAULT '',
  search_name TEXT NOT NULL,
  is_actual BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_kladr_settlement_search ON kladr_settlement (search_name);
CREATE INDEX IF NOT EXISTS idx_kladr_settlement_region ON kladr_settlement (region_code, search_name);
CREATE INDEX IF NOT EXISTS idx_kladr_settlement_name ON kladr_settlement (name);

CREATE TABLE IF NOT EXISTS kladr_street (
  code CHAR(17) PRIMARY KEY,
  parent_code CHAR(13) NOT NULL,
  name TEXT NOT NULL,
  socr TEXT NOT NULL DEFAULT '',
  postal_index TEXT DEFAULT '',
  search_name TEXT NOT NULL,
  is_actual BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_kladr_street_parent ON kladr_street (parent_code, search_name);
CREATE INDEX IF NOT EXISTS idx_kladr_street_search ON kladr_street (search_name);

CREATE TABLE IF NOT EXISTS kladr_building (
  code CHAR(19) PRIMARY KEY,
  parent_code CHAR(17) NOT NULL,
  name TEXT NOT NULL,
  korp TEXT DEFAULT '',
  search_name TEXT NOT NULL,
  is_actual BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_kladr_building_parent ON kladr_building (parent_code, search_name);
