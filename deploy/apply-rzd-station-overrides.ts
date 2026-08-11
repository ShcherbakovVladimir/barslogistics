/**
 * Apply manual + OSM ESR coordinates for stations missed by Nominatim geocoding.
 *
 *   npm run apply:rzd-station-overrides
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';
import type { StationDirectoryEntry } from '../server/rzdAnalytics/stationDirectory.js';
import {
  makeEsrStationId,
  makeNameStationId,
  upsertStationDirectoryEntry,
  applyDirectoryCoordsToStations,
} from '../server/rzdAnalytics/stationDirectory.js';

const CACHE_PATH = join(process.cwd(), 'data/rzd/station_directory.json');
const OSM2ESR_PATH = join(process.cwd(), 'data/rzd/osm2esr.csv');
const OSM2ESR_URL = 'https://osm.sbin.ru/esr/osm2esr.csv';

interface OsmRow {
  esr: string;
  lat: number;
  lon: number;
  name: string;
}

interface StationInfo {
  name: string;
  region: string;
}

/** Manual coordinates for stations not reliably matched in osm2esr.csv */
const MANUAL_ESR: Record<string, { lat: number; lon: number; label?: string }> = {
  '2780': { lat: 64.589, lon: 30.577, label: 'Костомукша-Товарная' },
  '3090': { lat: 59.798, lon: 30.501, label: 'Рыбацкое' },
  '3160': { lat: 59.751, lon: 30.588, label: 'Колпино' },
  '3310': { lat: 59.829, lon: 30.394, label: 'Купчинская' },
  '3400': { lat: 59.576, lon: 30.128, label: 'Гатчина-Товарная-Балтийская' },
  '3500': { lat: 59.835, lon: 30.154, label: 'Предпортовая' },
  '3600': { lat: 59.906, lon: 30.298, label: 'Санкт-Петербург-Балтийский' },
  '3810': { lat: 59.808, lon: 30.169, label: 'Ручьи' },
  '4000': { lat: 59.899, lon: 32.352, label: 'Волховстрой I' },
  '6270': { lat: 57.591, lon: 34.568, label: 'Вышний Волочёк' },
  '17140': { lat: 54.822, lon: 31.936, label: 'Кrasnoe-Eksportnaya' },
  '20120': { lat: 52.426, lon: 31.738, label: 'Зlynka-Eksportnaya' },
  '20430': { lat: 52.579, lon: 33.763, label: 'Трубчевск' },
  '21010': { lat: 54.204, lon: 37.593, label: 'Тула-Лихвинская' },
  '26010': { lat: 56.218, lon: 43.876, label: 'Нижний Новгород-Автозавод' },
  '31020': { lat: 57.629, lon: 39.874, label: 'Ярославль-Пассажирский' },
  '51101': { lat: 47.697, lon: 38.678, label: 'Уspenskaya-Styk' },
  '62050': { lat: 51.478, lon: 45.938, label: 'Saratov-II-Tovarnaya' },
  '76110': { lat: 58.010, lon: 56.253, label: 'Пerm-II' },
  '81650': { lat: 53.053, lon: 60.647, label: 'Кartaly-I-Eksportnaya' },
  '92570': { lat: 56.164, lon: 103.111, label: 'Кorshunikha-Anzherskaya' },
  '93210': { lat: 52.603, lon: 104.089, label: 'Кitoy-Kombinat' },
  '96280': { lat: 48.794, lon: 132.924, label: 'Birobidzhan-I' },
  '97000': { lat: 48.355, lon: 135.074, label: 'Khabarovsk-II' },
};

const MANUAL_DEST: Record<string, { lat: number; lon: number; label?: string }> = {
  'СЕРОВ-ЗАВДСК|Свердловская область': { lat: 59.597, lon: 60.602, label: 'Serov-Zavodskoy' },
  'НОВОРОСС-ЭКС|Краснодарский край': { lat: 44.723, lon: 37.768, label: 'Novorossiysk-Eksportnaya' },
  'ЗЛЫНКА-ЭКСП|Брянская область': { lat: 52.426, lon: 31.738, label: 'Zlynka-Eksportnaya' },
  'ЧЕЛЯБИНСК-ГР|Челябинская область': { lat: 55.099, lon: 61.374, label: 'Chelyabinsk-Gr' },
  'МЕТАЛЛУРГИЧ.|Челябинская область': { lat: 55.223, lon: 61.449, label: 'Metallurgicheskaya' },
  'ПЕТРОПАВ-Э-Р|Субъект РФ не определен': { lat: 54.856, lon: 69.170, label: 'Petropavlovsk' },
  'МАГНИТОГ-ГР|Челябинская область': { lat: 53.463, lon: 59.080, label: 'Magnitogorsk-Gr' },
  'ОРСК-НОВ-ГОР-ЭКС|Оренбургская область': { lat: 51.204, lon: 58.566, label: 'Orsk-Nov-Gor-Eks' },
  'ВЫСОЦК-ЭКСП|Ленинградская область': { lat: 60.623, lon: 28.568, label: 'Vysotsk-Eksportnaya' },
  'ТУАПСЕ-СОР-Э|Краснодарский край': { lat: 44.099, lon: 39.073, label: 'Tuapse-Sort-Eks' },
  'ТЕМРЮК-ЭКСП|Краснодарский край': { lat: 45.356, lon: 37.387, label: 'Temryuk-Eksportnaya' },
  'КОМС-НА-АМУР|Хабаровский край': { lat: 50.552, lon: 136.990, label: 'Komsomolsk-na-Amure' },
  'НОВОКУЗ.-СОР|Кемеровская область': { lat: 53.744, lon: 87.059, label: 'Novokuznetsk-Sort' },
  'НОВОКУЗ.-СЕВ|Кемеровская область': { lat: 53.893, lon: 87.249, label: 'Novokuznetsk-Severny' },
  'НОВОСИБ-ВОСТ|Новосибирская область': { lat: 55.068, lon: 82.974, label: 'Novosibirsk-Vostochny' },
  'МИХАЙЛО-СЕМ-ЭКС|Еврейская Автономная область': { lat: 48.628, lon: 132.500, label: 'Mikhailo-Sem-Eks' },
  'ГРОДЕК/КИТАЙ|Приморский край': { lat: 44.417, lon: 131.150, label: 'Grodek/Kitay' },
  'ХАБАРОВСК 2|Хабаровский край': { lat: 48.355, lon: 135.074, label: 'Khabarovsk-II' },
  'НЕВА|Город Санкт-Петербург город федерального': { lat: 59.935, lon: 30.389, label: 'Neva' },
  'НОВОКУЗ.-ВОС|Кемеровская область': { lat: 53.757, lon: 87.109, label: 'Novokuznetsk-Vostochny' },
  'ТУЛА 1-КУРС|Тульская область': { lat: 54.204, lon: 37.617, label: 'Tula-I-Kurskaya' },
  'ЛОК-Э-РУБ-РС|Алтайский край': { lat: 52.433, lon: 85.083, label: 'Lok-E-Rub-RS' },
  'КРАСНОЕ-ЭКСП|Смоленская область': { lat: 54.822, lon: 31.936, label: 'Krasnoe-Eksportnaya' },
  'КРАСНООКТЯБР|Волгоградская область': { lat: 48.520, lon: 44.544, label: 'Krasnooktyabrsky' },
  'ОЧАКОВО 1|Москва': { lat: 55.684, lon: 37.451, label: 'Ochakovo-I' },
  'НОВЫЙ ПОРТ|Город Санкт-Петербург город федерального': { lat: 59.905, lon: 30.213, label: 'Novyy Port' },
  'ВЫСТРЕЛ-РЗД-СТЫК|Белгородская область': { lat: 50.595, lon: 36.587, label: 'Vystrel-Rzd-Styk' },
  'ПЕРВОМ-ГОРК|Нижегородская область': { lat: 56.326, lon: 43.936, label: 'Pervomayskaya-Gork' },
  'МИХАЙЛО-ЛЕОН|Ростовская область': { lat: 47.112, lon: 39.423, label: 'Mikhailo-Leon' },
  'МУРМАНСК-ЭКС|Мурманская область': { lat: 68.979, lon: 33.092, label: 'Murmansk-Eksportnaya' },
  'ЗАВЕРЕЖЬЕ-ЭК|Псковская область': { lat: 57.813, lon: 28.331, label: 'Zaverezhe-Eks' },
  'САРАТОВ2-ТОВ|Саратовская область': { lat: 51.478, lon: 45.938, label: 'Saratov-II-Tov' },
  'ЛАБЫТНАНГИ|Ямало-Ненецкий автономный округ (Тюменск': { lat: 66.653, lon: 66.404, label: 'Labytnangi' },
  'РУЧЬИ|Город Санкт-Петербург город федерального': { lat: 59.808, lon: 30.169, label: 'Ruchi' },
  'УСПЕНСКАЯ-СТЫК|Ростовская область': { lat: 47.697, lon: 38.678, label: 'Uspenskaya-Styk' },
  'СЕРОВ-СОРТРВ|Свердловская область': { lat: 59.625, lon: 60.636, label: 'Serov-Sortirovochny' },
};

function bootstrapEnv(): boolean {
  if (process.env.DATABASE_URL) return true;
  for (const path of [join(process.cwd(), '.env'), '/opt/barslogistics/.env']) {
    if (!existsSync(path)) continue;
    loadDotenv({ path });
    if (process.env.DATABASE_URL) return true;
  }
  return false;
}

function loadCache(): Map<string, StationDirectoryEntry> {
  const map = new Map<string, StationDirectoryEntry>();
  if (!existsSync(CACHE_PATH)) return map;
  const list = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as StationDirectoryEntry[];
  for (const e of list) map.set(e.id, e);
  return map;
}

function saveCache(map: Map<string, StationDirectoryEntry>) {
  mkdirSync(join(process.cwd(), 'data/rzd'), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify([...map.values()], null, 2));
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
}

function inRussia(lat: number, lon: number): boolean {
  return lat >= 41 && lat <= 82 && lon >= 19 && lon <= 180;
}

async function ensureOsm2Esr(): Promise<OsmRow[]> {
  mkdirSync(join(process.cwd(), 'data/rzd'), { recursive: true });
  if (!existsSync(OSM2ESR_PATH)) {
    process.stdout.write('Downloading osm2esr.csv… ');
    const res = await fetch(OSM2ESR_URL, { headers: { 'User-Agent': 'BarsLogistics/1.0' } });
    if (!res.ok) throw new Error(`Failed to download osm2esr.csv: ${res.status}`);
    writeFileSync(OSM2ESR_PATH, Buffer.from(await res.arrayBuffer()));
    console.log('done');
  }
  const rows: OsmRow[] = [];
  for (const line of readFileSync(OSM2ESR_PATH, 'utf-8').split('\n').slice(1)) {
    const parts = line.split(';').map(x => x.replace(/^"|"$/g, ''));
    if (!parts[0] || parts[1] !== '1') continue;
    const lat = Number(parts[4]);
    const lon = Number(parts[5]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    rows.push({ esr: parts[0], lat, lon, name: parts[6] });
  }
  return rows;
}

function lookupOsm2Esr(rows: OsmRow[], code: string, info: StationInfo): OsmRow | null {
  const candidates = rows.filter(r => r.esr.startsWith(code) && r.esr.length === 6 && inRussia(r.lat, r.lon));
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  const target = norm(info.name);
  let best = candidates[0];
  let bestScore = 0;
  for (const c of candidates) {
    const cn = norm(c.name);
    let score = 0;
    for (let len = 4; len <= Math.min(target.length, cn.length); len++) {
      if (target.startsWith(cn.slice(0, len)) || cn.startsWith(target.slice(0, len))) score = len;
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

async function loadFailedStations(): Promise<{ esr: Record<string, StationInfo>; dest: Record<string, StationInfo> }> {
  const { execSync } = await import('child_process');
  const out = execSync('npx tsx deploy/list-failed-stations.ts', { cwd: process.cwd(), encoding: 'utf-8' });
  return JSON.parse(out) as { esr: Record<string, StationInfo>; dest: Record<string, StationInfo> };
}

if (!bootstrapEnv()) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const { initDatabase, closeDatabase } = await import('../server/db.js');
  await initDatabase();

  const cache = loadCache();
  const failed = await loadFailedStations();
  const osmRows = await ensureOsm2Esr();

  let added = 0;
  let skipped = 0;

  for (const [code, info] of Object.entries(failed.esr)) {
    const id = makeEsrStationId(code);
    if (cache.has(id)) {
      skipped++;
      continue;
    }
    const manual = MANUAL_ESR[code];
    const osm = manual ? null : lookupOsm2Esr(osmRows, code, info);
    const coords = manual ?? (osm ? { lat: osm.lat, lon: osm.lon, label: osm.name, source: 'osm2esr' as const } : null);
    if (!coords) {
      console.log(`SKIP ESR ${code} ${info.name}`);
      continue;
    }
    const entry: StationDirectoryEntry = {
      id,
      esr_code: code,
      name: info.name,
      region: info.region,
      latitude: coords.lat,
      longitude: coords.lon,
      geocode_source: manual ? 'manual' : 'osm2esr',
    };
    cache.set(id, entry);
    await upsertStationDirectoryEntry(entry);
    added++;
    console.log(`ESR ${code} ${info.name} → ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)} (${entry.geocode_source})`);
  }

  for (const [key, info] of Object.entries(failed.dest)) {
    const id = makeNameStationId(info.name, info.region);
    if (cache.has(id)) {
      skipped++;
      continue;
    }
    const manual = MANUAL_DEST[key];
    if (!manual) {
      console.log(`SKIP DEST ${info.name}`);
      continue;
    }
    const entry: StationDirectoryEntry = {
      id,
      name: info.name,
      region: info.region,
      latitude: manual.lat,
      longitude: manual.lon,
      geocode_source: 'manual',
    };
    cache.set(id, entry);
    await upsertStationDirectoryEntry(entry);
    added++;
    console.log(`DEST ${info.name} → ${manual.lat.toFixed(4)}, ${manual.lon.toFixed(4)} (manual)`);
  }

  saveCache(cache);
  const updated = await applyDirectoryCoordsToStations();
  await closeDatabase();

  console.log(`\nAdded ${added} stations, skipped ${skipped} existing.`);
  console.log(`Directory total: ${cache.size}. Updated ${updated} rzd_stations.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
