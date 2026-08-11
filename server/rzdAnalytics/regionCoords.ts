/** Approximate region centers for RZD station geocoding (Russia + neighbors) */
const REGION_COORDS: Record<string, [number, number]> = {
  'курганская область': [55.44, 65.34],
  'свердловская область': [56.84, 60.6],
  'челябинская область': [55.16, 61.4],
  'удмуртская республика': [57.0, 53.0],
  'оренбургская область': [51.77, 55.1],
  'краснодарский край': [45.04, 38.98],
  'хабаровский край': [48.48, 135.08],
  'еврейская автономная область': [48.79, 132.92],
  'пермский край': [58.01, 56.25],
  'московская область': [55.5, 37.5],
  'ленинградская область': [59.9, 31.3],
  'новосибирская область': [55.0, 79.0],
  'кемеровская область': [55.35, 86.09],
  'иркутская область': [52.29, 104.28],
  'амурская область': [50.29, 127.53],
  'забайкальский край': [52.0, 113.5],
  'приморский край': [43.12, 131.89],
  'самарская область': [53.2, 50.15],
  'татарстан': [55.8, 51.0],
  'республика татарстан': [55.8, 51.0],
  'башкортостан': [54.0, 56.0],
  'республика башкортостан': [54.0, 56.0],
  'волгоградская область': [48.71, 44.51],
  'ростовская область': [47.24, 39.71],
  'нижегородская область': [56.33, 44.0],
  'вологодская область': [59.22, 39.88],
  'архангельская область': [64.54, 40.54],
  'мурманская область': [68.97, 33.05],
  'карелия': [63.0, 34.0],
  'республика карелия': [63.0, 34.0],
  'коми': [63.0, 54.0],
  'республика коми': [63.0, 54.0],
  'китай': [43.8, 125.3],
  'беларусь': [53.9, 27.57],
  'украина': [49.0, 32.0],
  'казахстан': [48.0, 67.0],
  'италия': [41.9, 12.5],
};

function normalizeRegion(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hashJitter(seed: string): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const lat = ((h & 0xffff) / 0xffff - 0.5) * 0.8;
  const lng = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 1.2;
  return [lat, lng];
}

export function resolveRegionCoords(region: string, stationName: string): [number, number] {
  const key = normalizeRegion(region);
  const base = REGION_COORDS[key];
  const [jLat, jLng] = hashJitter(`${region}|${stationName}`);
  if (base) return [base[0] + jLat, base[1] + jLng];
  return [55.0 + jLat, 60.0 + jLng];
}

export function makeStationId(code: string | null, name: string, region: string): string {
  const c = code?.trim();
  if (c && c !== '10' && /^\d+$/.test(c)) return `rzd_esr_${c}`;
  const slug = `${name}_${region}`.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '_').slice(0, 40);
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return `rzd_${Math.abs(h).toString(36)}`;
}
