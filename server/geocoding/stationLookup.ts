import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { resolveStationCoords } from '../rzdAnalytics/stationDirectory.js';

interface StationCoords {
  latitude: number;
  longitude: number;
  name: string;
  source: string;
}

let osmByName: Map<string, StationCoords> | null = null;

function normalizeStationName(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '')
    .trim();
}

function loadOsm2esr(): Map<string, StationCoords> {
  if (osmByName) return osmByName;
  osmByName = new Map();
  const path = join(process.cwd(), 'data/rzd/osm2esr.csv');
  if (!existsSync(path)) return osmByName;

  const text = readFileSync(path, 'utf-8');
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.match(/"([^"]*)"/g);
    if (!cols || cols.length < 7) continue;
    const lat = Number(cols[4]?.replace(/"/g, ''));
    const lon = Number(cols[5]?.replace(/"/g, ''));
    const name = cols[6]?.replace(/"/g, '').trim();
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const key = normalizeStationName(name);
    if (!osmByName.has(key)) {
      osmByName.set(key, { latitude: lat, longitude: lon, name, source: 'osm2esr' });
    }
  }
  return osmByName;
}

function findInOsm2esr(stationName: string): StationCoords | null {
  const map = loadOsm2esr();
  const norm = normalizeStationName(stationName);
  const direct = map.get(norm);
  if (direct) return direct;

  for (const [key, coords] of map) {
    if (key.startsWith(norm) || norm.startsWith(key)) return coords;
  }
  return null;
}

/** Resolve railway station name from address (e.g. «станция Арчеда»). */
export async function geocodeStationFromAddress(
  stationName: string,
  regionHint?: string,
): Promise<StationCoords | null> {
  const name = stationName.trim();
  if (!name) return null;

  const osmHit = findInOsm2esr(name);
  if (osmHit) return osmHit;

  const resolved = await resolveStationCoords({ name, region: regionHint });
  if (resolved.source !== 'region_estimate') {
    return {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      name,
      source: resolved.source,
    };
  }

  return null;
}

export function extractStationName(address: string): string | null {
  const m = address.match(/станц(?:ия|\.)\s+([^,;]+)/i);
  return m?.[1] ? m[1].trim() : null;
}
