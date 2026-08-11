/**
 * Build RZD station directory (ESR codes + destination names) via Nominatim geocoding.
 *
 *   npm run geocode:rzd-stations
 *
 * Results cached in data/rzd/station_directory.json and rzd_station_directory table.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';
import { parseRzdAnalyticsCsv } from '../server/rzdAnalytics/parseCsv.js';
import type { StationDirectoryEntry } from '../server/rzdAnalytics/stationDirectory.js';
import { makeEsrStationId, makeNameStationId } from '../server/rzdAnalytics/stationDirectory.js';

const CACHE_PATH = join(process.cwd(), 'data/rzd/station_directory.json');
const CSV_FILES = [
  '/home/user/usersfiles/РЖД_Декабрь_1.csv',
  '/home/user/usersfiles/РЖД_Декабрь_2.csv',
];
const NOMINATIM_DELAY_MS = 1100;

function bootstrapEnv(): boolean {
  if (process.env.DATABASE_URL) return true;
  for (const path of [join(process.cwd(), '.env'), '/opt/barslogistics/.env']) {
    if (!existsSync(path)) continue;
    loadDotenv({ path });
    if (process.env.DATABASE_URL) return true;
  }
  return false;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function loadCache(): Map<string, StationDirectoryEntry> {
  const map = new Map<string, StationDirectoryEntry>();
  if (!existsSync(CACHE_PATH)) return map;
  try {
    const list = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as StationDirectoryEntry[];
    for (const e of list) map.set(e.id, e);
  } catch {
    /* ignore */
  }
  return map;
}

function saveCache(map: Map<string, StationDirectoryEntry>) {
  mkdirSync(join(process.cwd(), 'data/rzd'), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify([...map.values()], null, 2));
}

async function geocodeNominatim(name: string, region: string): Promise<[number, number] | null> {
  const q = `железнодорожная станция ${name}, ${region}, Россия`;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q,
    format: 'json',
    limit: '1',
    countrycodes: 'ru,by,kz,cn',
  })}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'BarsLogistics/1.0 (RZD station directory)' },
      });
      if (!res.ok) {
        if (attempt < 2) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        return null;
      }
      const data = await res.json() as { lat: string; lon: string }[];
      if (!data.length) return null;
      return [Number(data[0].lat), Number(data[0].lon)];
    } catch {
      if (attempt < 2) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }
  return null;
}

function collectStationsFromCsv(): { esr: Map<string, { name: string; region: string }>; names: Map<string, { name: string; region: string }> } {
  const esr = new Map<string, { name: string; region: string }>();
  const names = new Map<string, { name: string; region: string }>();

  for (const file of CSV_FILES) {
    if (!existsSync(file)) continue;
    const csv = readFileSync(file, 'utf-8');
    const { rows } = parseRzdAnalyticsCsv(csv);
    for (const row of rows) {
      const code = row.originStationCode?.trim();
      const region = row.originRegion || row.originCountry;
      if (code && code !== '10' && /^\d{4,6}$/.test(code)) {
        esr.set(code, { name: row.originStationName, region });
      }
      const dr = row.destRegion || row.destCountry;
      const nid = makeNameStationId(row.destStationName, dr);
      if (!names.has(nid)) names.set(nid, { name: row.destStationName, region: dr });
    }
  }
  return { esr, names };
}

if (!bootstrapEnv()) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const { initDatabase, closeDatabase } = await import('../server/db.js');
  const { upsertStationDirectoryEntry } = await import('../server/rzdAnalytics/stationDirectory.js');
  const { applyDirectoryCoordsToStations } = await import('../server/rzdAnalytics/stationDirectory.js');

  await initDatabase();
  const cache = loadCache();
  const { esr, names } = collectStationsFromCsv();

  let geocoded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [code, info] of esr) {
    const id = makeEsrStationId(code);
    const existing = cache.get(id);
    if (existing) {
      skipped++;
      continue;
    }
    process.stdout.write(`ESR ${code} ${info.name}… `);
    await sleep(NOMINATIM_DELAY_MS);
    const coords = await geocodeNominatim(info.name, info.region);
    if (!coords) {
      console.log('not found');
      failed++;
      continue;
    }
    const entry: StationDirectoryEntry = {
      id,
      esr_code: code,
      name: info.name,
      region: info.region,
      latitude: coords[0],
      longitude: coords[1],
      geocode_source: 'nominatim',
    };
    cache.set(id, entry);
    saveCache(cache);
    await upsertStationDirectoryEntry(entry);
    geocoded++;
    console.log(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
  }

  for (const [id, info] of names) {
    const existing = cache.get(id);
    if (existing) {
      skipped++;
      continue;
    }
    process.stdout.write(`DEST ${info.name}… `);
    await sleep(NOMINATIM_DELAY_MS);
    const coords = await geocodeNominatim(info.name, info.region);
    if (!coords) {
      console.log('not found');
      failed++;
      continue;
    }
    const entry: StationDirectoryEntry = {
      id,
      name: info.name,
      region: info.region,
      latitude: coords[0],
      longitude: coords[1],
      geocode_source: 'nominatim',
    };
    cache.set(id, entry);
    saveCache(cache);
    await upsertStationDirectoryEntry(entry);
    geocoded++;
    console.log(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
  }

  const updated = await applyDirectoryCoordsToStations();
  await closeDatabase();

  console.log(`\nDirectory: ${cache.size} stations (new geocoded: ${geocoded}, cached: ${skipped}, failed: ${failed})`);
  console.log(`Updated ${updated} rzd_stations coordinates from directory.`);
  console.log(`Cache: ${CACHE_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
