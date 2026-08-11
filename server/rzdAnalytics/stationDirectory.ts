import { pool } from '../db.js';
import { resolveRegionCoords } from './regionCoords.js';

export interface StationDirectoryEntry {
  id: string;
  esr_code?: string;
  name: string;
  region?: string;
  latitude: number;
  longitude: number;
  geocode_source: string;
}

let cacheByEsr = new Map<string, StationDirectoryEntry>();
let cacheByNameRegion = new Map<string, StationDirectoryEntry>();
let cacheLoaded = false;

function nameRegionKey(name: string, region?: string): string {
  return `${name.trim().toLowerCase()}|${(region || '').trim().toLowerCase()}`;
}

export function makeEsrStationId(esrCode: string): string {
  return `rzd_esr_${esrCode}`;
}

export function makeNameStationId(name: string, region: string): string {
  const slug = `${name}_${region}`.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '_').slice(0, 48);
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return `rzd_nm_${Math.abs(h).toString(36)}`;
}

export async function loadStationDirectoryCache(): Promise<void> {
  if (cacheLoaded) return;
  const res = await pool.query(
    'SELECT id, esr_code, name, region, latitude, longitude, geocode_source FROM rzd_station_directory',
  );
  cacheByEsr = new Map();
  cacheByNameRegion = new Map();
  for (const row of res.rows) {
    const entry: StationDirectoryEntry = {
      id: String(row.id),
      esr_code: row.esr_code != null ? String(row.esr_code) : undefined,
      name: String(row.name),
      region: row.region != null ? String(row.region) : undefined,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      geocode_source: String(row.geocode_source),
    };
    if (entry.esr_code) cacheByEsr.set(entry.esr_code, entry);
    cacheByNameRegion.set(nameRegionKey(entry.name, entry.region), entry);
  }
  cacheLoaded = true;
}

export function invalidateStationDirectoryCache(): void {
  cacheLoaded = false;
  cacheByEsr.clear();
  cacheByNameRegion.clear();
}

export async function upsertStationDirectoryEntry(entry: StationDirectoryEntry): Promise<void> {
  await pool.query(
    `INSERT INTO rzd_station_directory (id, esr_code, name, region, latitude, longitude, geocode_source, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (id) DO UPDATE SET
       esr_code = COALESCE(EXCLUDED.esr_code, rzd_station_directory.esr_code),
       name = EXCLUDED.name,
       region = COALESCE(EXCLUDED.region, rzd_station_directory.region),
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       geocode_source = EXCLUDED.geocode_source,
       updated_at = NOW()`,
    [
      entry.id,
      entry.esr_code ?? null,
      entry.name,
      entry.region ?? null,
      entry.latitude,
      entry.longitude,
      entry.geocode_source,
    ],
  );
  if (entry.esr_code) cacheByEsr.set(entry.esr_code, entry);
  cacheByNameRegion.set(nameRegionKey(entry.name, entry.region), entry);
}

export interface ResolveStationInput {
  esrCode?: string | null;
  name: string;
  region?: string;
}

export interface ResolvedStationCoords {
  latitude: number;
  longitude: number;
  source: 'esr_directory' | 'name_directory' | 'region_estimate';
  directory_id?: string;
}

export async function resolveStationCoords(input: ResolveStationInput): Promise<ResolvedStationCoords> {
  await loadStationDirectoryCache();
  const code = input.esrCode?.trim();
  if (code && code !== '10' && /^\d+$/.test(code)) {
    const hit = cacheByEsr.get(code);
    if (hit) {
      return {
        latitude: hit.latitude,
        longitude: hit.longitude,
        source: 'esr_directory',
        directory_id: hit.id,
      };
    }
  }
  const nameHit = cacheByNameRegion.get(nameRegionKey(input.name, input.region));
  if (nameHit) {
    return {
      latitude: nameHit.latitude,
      longitude: nameHit.longitude,
      source: nameHit.esr_code ? 'esr_directory' : 'name_directory',
      directory_id: nameHit.id,
    };
  }
  const [lat, lng] = resolveRegionCoords(input.region || '', input.name);
  return { latitude: lat, longitude: lng, source: 'region_estimate' };
}

export async function getStationDirectoryStats(): Promise<{ total: number; with_esr: number }> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE esr_code IS NOT NULL AND esr_code <> '')::int AS with_esr
     FROM rzd_station_directory`,
  );
  return { total: Number(res.rows[0].total), with_esr: Number(res.rows[0].with_esr) };
}

export async function applyDirectoryCoordsToStations(): Promise<number> {
  const res = await pool.query(
    `UPDATE rzd_stations s SET
       latitude = d.latitude,
       longitude = d.longitude,
       updated_at = NOW()
     FROM rzd_station_directory d
     WHERE (s.esr_code IS NOT NULL AND s.esr_code = d.esr_code)
        OR (s.id = d.id)
     RETURNING s.id`,
  );
  return res.rowCount ?? 0;
}
