import type { GeocodeResult } from './types.js';

interface KnownPlace {
  test: RegExp;
  latitude: number;
  longitude: number;
  region: string;
  normalizedAddress: string;
  geocode_source: string;
}

/** Verified delivery points from internal shipments template + OSM/RZD. */
const KNOWN_PLACES: KnownPlace[] = [
  {
    test: /фролово[^,]*(?:арчеда|станц)/i,
    latitude: 49.7649,
    longitude: 43.6553,
    region: 'Волгоградская область',
    normalizedAddress: 'г. Фролово, станция Арчеда',
    geocode_source: 'known:station_archeda',
  },
  {
    test: /фролово[^,]*(?:строител|128)/i,
    latitude: 49.766,
    longitude: 43.647,
    region: 'Волгоградская область',
    normalizedAddress: 'г. Фролово, ул. Строителей, 128А',
    geocode_source: 'known:frolovo_stroiteley',
  },
  {
    test: /рязань[^,]*(?:новая|нов\.?\s)/i,
    latitude: 54.626,
    longitude: 39.691,
    region: 'Рязанская область',
    normalizedAddress: 'г. Рязань, ул. Новая',
    geocode_source: 'known:ryazan_novaya',
  },
  {
    test: /пермь[^,]*(?:татищев|василия\s+татищ)/i,
    latitude: 58.009,
    longitude: 56.266,
    region: 'Пермский край',
    normalizedAddress: 'г. Пермь, ул. Василия Татищева, 6',
    geocode_source: 'known:perm_tatischeva',
  },
  {
    test: /пашия/i,
    latitude: 58.380,
    longitude: 58.324,
    region: 'Пермский край',
    normalizedAddress: 'Пермский край, р.п. Пашия',
    geocode_source: 'known:pashiya',
  },
  {
    test: /лысьва/i,
    latitude: 58.112,
    longitude: 57.781,
    region: 'Пермский край',
    normalizedAddress: 'Пермский край, г. Лысьва',
    geocode_source: 'known:lysva',
  },
];

const CITY_REGION_HINTS: Record<string, string> = {
  фролово: 'Волгоградская область',
  рязань: 'Рязанская область',
  пермь: 'Пермский край',
  лысьва: 'Пермский край',
  пашия: 'Пермский край',
};

export function lookupKnownPlace(address: string): GeocodeResult | null {
  const hit = KNOWN_PLACES.find(p => p.test.test(address));
  if (!hit) return null;
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    region: hit.region,
    normalized_address: hit.normalizedAddress,
    geocode_source: hit.geocode_source,
  };
}

export function cityRegionHint(city?: string): string | undefined {
  if (!city) return undefined;
  const key = city.toLowerCase().replace(/ё/g, 'е').replace(/^г\.?\s*/, '').trim();
  return CITY_REGION_HINTS[key];
}
