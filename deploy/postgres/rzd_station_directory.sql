-- Справочник координат железнодорожных станций (коды ЕСР и станции назначения по названию)

CREATE TABLE IF NOT EXISTS rzd_station_directory (
  id              TEXT PRIMARY KEY,
  esr_code        TEXT,
  name            TEXT NOT NULL,
  region          TEXT,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  geocode_source  TEXT NOT NULL DEFAULT 'nominatim',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS rzd_station_directory_esr_code_idx
  ON rzd_station_directory (esr_code) WHERE esr_code IS NOT NULL AND esr_code <> '';

CREATE INDEX IF NOT EXISTS rzd_station_directory_name_region_idx
  ON rzd_station_directory (lower(name), lower(COALESCE(region, '')));
