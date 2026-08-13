import { resolveRegionCoords } from '../rzdAnalytics/regionCoords.js';
import { buildNominatimQuery, parseAddressComponents } from './addressParse.js';
import { cityRegionHint, lookupKnownPlace } from './knownPlaces.js';
import { getKladrRuntimeConfig, getGeocodingSettingsCached } from './kladrConfig.js';
import { lookupKladrAddress } from './kladrClient.js';
import { extractStationName, geocodeStationFromAddress } from './stationLookup.js';
import type { GeocodeResult } from './types.js';

const cache = new Map<string, GeocodeResult>();
const reverseCache = new Map<string, GeocodeResult>();
let lastNominatimAt = 0;

async function sleep(ms: number): Promise<void> {
  await new Promise(r => setTimeout(r, ms));
}

async function nominatimSearch(query: string, baseUrl?: string): Promise<[number, number] | null> {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimAt));
  if (wait) await sleep(wait);
  lastNominatimAt = Date.now();

  const root = (baseUrl || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
  try {
    const url = `${root}/search?${new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'ru,by,kz',
      addressdetails: '1',
    })}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BarsLogistics/1.0 (internal shipments geocoder)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { lat: string; lon: string }[];
    if (!data.length) return null;
    const hit = data[0];
    if (!hit) return null;
    return [Number(hit.lat), Number(hit.lon)];
  } catch {
    return null;
  }
}

interface NominatimReverseHit {
  display_name: string;
  address?: Record<string, string>;
}

async function nominatimReverse(lat: number, lng: number, baseUrl?: string): Promise<NominatimReverseHit | null> {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimAt));
  if (wait) await sleep(wait);
  lastNominatimAt = Date.now();

  const root = (baseUrl || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
  try {
    const url = `${root}/reverse?${new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    })}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BarsLogistics/1.0 (internal shipments geocoder)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json() as NominatimReverseHit;
    if (!data.display_name) return null;
    return data;
  } catch {
    return null;
  }
}

function buildAddressFromNominatim(hit: NominatimReverseHit): string {
  const addr = hit.address;
  if (!addr) return hit.display_name;

  const parts: string[] = [];
  const region = addr.state || addr.region || addr.county;
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
  const street = addr.road || addr.pedestrian || addr.footway || addr.path;
  const house = addr.house_number;

  if (region) parts.push(region);
  if (city && city !== region) parts.push(city);
  if (street) parts.push(street);
  if (house) parts.push(house);

  return parts.length ? parts.join(', ') : hit.display_name;
}

function regionFromNominatim(addr?: Record<string, string>): string | undefined {
  if (!addr) return undefined;
  return addr.state || addr.region || addr.county;
}

/** Reverse geocode map coordinates → KLADR-normalized address. */
export async function reverseGeocodeRussianAddress(lat: number, lng: number): Promise<GeocodeResult> {
  const key = `${lat.toFixed(5)}|${lng.toFixed(5)}`;
  const cached = reverseCache.get(key);
  if (cached) return cached;

  const geoSettings = await getGeocodingSettingsCached();
  const runtime = await getKladrRuntimeConfig();

  if (!geoSettings.enabled) {
    const result: GeocodeResult = {
      latitude: lat,
      longitude: lng,
      geocode_source: 'map_pick',
    };
    reverseCache.set(key, result);
    return result;
  }

  let nominatimAddress: string | undefined;
  let nominatimRegion: string | undefined;

  if (runtime.nominatimEnabled) {
    const hit = await nominatimReverse(lat, lng, runtime.nominatimBaseUrl);
    if (hit) {
      nominatimAddress = buildAddressFromNominatim(hit);
      nominatimRegion = regionFromNominatim(hit.address);
    }
  }

  if (nominatimAddress) {
    const kladr = await lookupKladrAddress(nominatimAddress);
    if (kladr) {
      const result: GeocodeResult = {
        latitude: lat,
        longitude: lng,
        kladr_id: kladr.id,
        normalized_address: kladr.normalizedAddress,
        region: kladr.region || nominatimRegion,
        geocode_source: 'map_pick+kladr',
      };
      reverseCache.set(key, result);
      return result;
    }

    const result: GeocodeResult = {
      latitude: lat,
      longitude: lng,
      normalized_address: nominatimAddress,
      region: nominatimRegion,
      geocode_source: 'map_pick+nominatim',
    };
    reverseCache.set(key, result);
    return result;
  }

  const result: GeocodeResult = {
    latitude: lat,
    longitude: lng,
    geocode_source: 'map_pick',
  };
  reverseCache.set(key, result);
  return result;
}

function regionFallback(address: string, regionHint?: string): GeocodeResult {
  const parsed = parseAddressComponents(address);
  const region = regionHint || parsed.region || parsed.city || 'Россия';
  const [lat, lng] = resolveRegionCoords(region, address);
  return {
    latitude: lat,
    longitude: lng,
    region,
    geocode_source: 'region_estimate',
    normalized_address: address,
  };
}

/**
 * Geocode Russian delivery address:
 * 1) RZD/OSM station by name
 * 2) KLADR normalization + Nominatim
 * 3) Parsed address + Nominatim
 * 4) Raw address + Nominatim
 * 5) Region center (never stack on origin site)
 */
export async function geocodeRussianAddress(
  address: string,
  options?: { regionHint?: string; label?: string },
): Promise<GeocodeResult> {
  const key = `${address}|${options?.regionHint || ''}`.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const geoSettings = await getGeocodingSettingsCached();
  if (!geoSettings.enabled) {
    const fallback = regionFallback(address, options?.regionHint);
    cache.set(key, fallback);
    return fallback;
  }

  const runtime = await getKladrRuntimeConfig();
  const parsed = parseAddressComponents(address);
  const stationName = parsed.station || extractStationName(address);

  if (runtime.knownPlacesEnabled) {
    const known = lookupKnownPlace(address);
    if (known) {
      cache.set(key, known);
      return known;
    }
  }

  if (runtime.stationLookupEnabled && stationName) {
    const station = await geocodeStationFromAddress(stationName, options?.regionHint || parsed.region);
    if (station) {
      const result: GeocodeResult = {
        latitude: station.latitude,
        longitude: station.longitude,
        region: parsed.region || options?.regionHint,
        geocode_source: `station:${station.source}`,
        normalized_address: `${parsed.city || ''} станция ${stationName}`.trim(),
      };
      cache.set(key, result);
      return result;
    }
  }

  const kladr = await lookupKladrAddress(address);
  const nominatimBase = runtime.nominatimBaseUrl;

  if (kladr && runtime.nominatimEnabled) {
    const kladrQuery = kladr.normalizedAddress.includes('Россия')
      ? kladr.normalizedAddress
      : `${kladr.normalizedAddress}, Россия`;
    const coords = await nominatimSearch(kladrQuery, nominatimBase);
    if (coords) {
      const result: GeocodeResult = {
        latitude: coords[0],
        longitude: coords[1],
        kladr_id: kladr.id,
        normalized_address: kladr.normalizedAddress,
        region: kladr.region || parsed.region || options?.regionHint,
        geocode_source: 'kladr+nominatim',
      };
      cache.set(key, result);
      return result;
    }
  }

  if (!runtime.nominatimEnabled) {
    const fallback = regionFallback(address, options?.regionHint || kladr?.region || parsed.region);
    if (kladr?.id) {
      fallback.kladr_id = kladr.id;
      fallback.normalized_address = kladr.normalizedAddress;
      fallback.geocode_source = 'kladr+region_estimate';
    }
    cache.set(key, fallback);
    return fallback;
  }

  const structuredQuery = buildNominatimQuery(parsed);
  const structuredCoords = await nominatimSearch(structuredQuery, nominatimBase);
  if (structuredCoords) {
    const result: GeocodeResult = {
      latitude: structuredCoords[0],
      longitude: structuredCoords[1],
      kladr_id: kladr?.id,
      normalized_address: kladr?.normalizedAddress || structuredQuery,
      region: kladr?.region || parsed.region || options?.regionHint,
      geocode_source: kladr ? 'kladr+nominatim' : 'nominatim',
    };
    cache.set(key, result);
    return result;
  }

  const rawQuery = address.includes('Россия') ? address : `${address}, Россия`;
  const rawCoords = await nominatimSearch(rawQuery, nominatimBase);
  if (rawCoords) {
    const result: GeocodeResult = {
      latitude: rawCoords[0],
      longitude: rawCoords[1],
      kladr_id: kladr?.id,
      normalized_address: kladr?.normalizedAddress || address,
      region: kladr?.region || parsed.region || options?.regionHint,
      geocode_source: kladr ? 'kladr+nominatim' : 'nominatim',
    };
    cache.set(key, result);
    return result;
  }

  if (parsed.city) {
    const regionHint = cityRegionHint(parsed.city) || parsed.region || options?.regionHint;
    const cityCoords = await nominatimSearch(
      regionHint
        ? `${parsed.city}, ${regionHint}, Россия`
        : `${parsed.city}, Россия`,
      nominatimBase,
    );
    if (cityCoords) {
      const result: GeocodeResult = {
        latitude: cityCoords[0],
        longitude: cityCoords[1],
        kladr_id: kladr?.id,
        normalized_address: kladr?.normalizedAddress || `${parsed.city}, ${parsed.region || ''}`.trim(),
        region: kladr?.region || parsed.region || options?.regionHint,
        geocode_source: 'city+nominatim',
      };
      cache.set(key, result);
      return result;
    }
  }

  const fallback = regionFallback(address, options?.regionHint || kladr?.region || parsed.region);
  if (kladr?.id) {
    fallback.kladr_id = kladr.id;
    fallback.normalized_address = kladr.normalizedAddress;
    fallback.geocode_source = 'kladr+region_estimate';
  }
  cache.set(key, fallback);
  return fallback;
}

export function clearGeocodeCache(): void {
  cache.clear();
  reverseCache.clear();
}
