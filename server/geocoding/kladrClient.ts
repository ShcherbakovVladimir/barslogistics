import { parseAddressComponents } from './addressParse.js';
import { getKladrRuntimeConfig, type KladrRuntimeConfig } from './kladrConfig.js';
import { lookupKladrAddressLocal, isKladrLocalDbReady, searchKladrSuggestionsLocal } from './kladrLocalDb.js';
import type { KladrMatch } from './types.js';

export { KLADR_API_FREE, KLADR_API_PAID } from './kladrEndpoints.js';

interface KladrApiObject {
  id?: string;
  name?: string;
  type?: string;
  typeShort?: string;
  zip?: string | null;
  okato?: string;
  contentType?: string;
  parents?: KladrApiObject[];
}

export interface KladrApiResponse {
  searchContext?: Record<string, unknown>;
  result?: KladrApiObject[];
}

function getKladrConfigFromRuntime(runtime: KladrRuntimeConfig): { baseUrls: string[]; token?: string; key?: string } {
  return { baseUrls: runtime.baseUrls, token: runtime.token, key: runtime.key };
}

async function getKladrConfig(): Promise<{ baseUrls: string[]; token?: string; key?: string }> {
  const runtime = await getKladrRuntimeConfig();
  return getKladrConfigFromRuntime(runtime);
}

function normalizeKladrName(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function formatKladrPart(obj: Pick<KladrApiObject, 'name' | 'typeShort'>): string {
  if (!obj.name) return '';
  const short = obj.typeShort ? `${obj.typeShort}. ` : '';
  return `${short}${obj.name}`.trim();
}

function buildNormalizedAddress(obj: KladrApiObject): string {
  const parts: string[] = [];
  for (const parent of obj.parents ?? []) {
    const line = formatKladrPart(parent);
    if (line) parts.push(line);
  }
  const self = formatKladrPart(obj);
  if (self && !parts.includes(self)) parts.push(self);
  return parts.join(', ');
}

function regionFromParents(parents: KladrApiObject[] | undefined): string | undefined {
  const region = parents?.find(
    p => p.contentType === 'region' || /^(обл|край|респ)/i.test(p.typeShort || ''),
  );
  return region?.name;
}

function mapKladrObject(obj: KladrApiObject): KladrMatch {
  return {
    id: String(obj.id || ''),
    name: String(obj.name || ''),
    typeShort: obj.typeShort,
    zip: obj.zip,
    normalizedAddress: buildNormalizedAddress(obj),
    region: regionFromParents(obj.parents),
    contentType: obj.contentType,
  };
}

function stripHouseFromStreet(street?: string): { street?: string; house?: string } {
  if (!street) return {};
  const m = street.match(/^(.+?)\s+(\d+[a-zа-я]?)$/i);
  if (m) return { street: m[1].trim(), house: m[2].trim() };
  return { street };
}

const deadEndpoints = new Set<string>();

function endpointTimeoutMs(baseUrl: string): number {
  return baseUrl.includes('kladr-api.com') ? 12000 : 6000;
}

/** Low-level KLADR request (docs: token + query + contentType / oneString). */
export async function requestKladr(params: Record<string, string>): Promise<KladrApiResponse | null> {
  const { baseUrls, token, key } = await getKladrConfig();

  for (const baseUrl of baseUrls) {
    if (deadEndpoints.has(baseUrl)) continue;

    const qs = new URLSearchParams(params);
    if (token) qs.set('token', token);
    if (key) qs.set('key', key);

    try {
      const res = await fetch(`${baseUrl}?${qs}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(endpointTimeoutMs(baseUrl)),
      });
      const text = await res.text();
      if (!res.ok || !text.trim() || text.trimStart().startsWith('<!')) {
        if (!res.ok || text.trimStart().startsWith('<!')) deadEndpoints.add(baseUrl);
        continue;
      }

      const data = JSON.parse(text) as KladrApiResponse;
      if (Array.isArray(data.result) && data.result.length > 0) {
        return data;
      }
    } catch {
      deadEndpoints.add(baseUrl);
    }
  }
  return null;
}

async function lookupCity(cityName: string, regionId?: string): Promise<KladrApiObject | null> {
  const query = cityName.trim();
  if (!query) return null;

  const params: Record<string, string> = {
    query,
    contentType: 'city',
    withParent: '1',
    limit: '10',
    typeCode: '7', // cities + settlements + villages
  };
  if (regionId) params.regionId = regionId;

  const data = await requestKladr(params);
  if (!data?.result?.length) return null;

  const norm = normalizeKladrName(query);
  return (
    data.result.find(c => normalizeKladrName(c.name || '') === norm)
    ?? data.result.find(c => normalizeKladrName(c.name || '').startsWith(norm))
    ?? data.result[0]
  );
}

async function lookupStreet(cityId: string, streetName: string): Promise<KladrApiObject | null> {
  const query = streetName.trim();
  if (!query || !cityId) return null;

  const data = await requestKladr({
    cityId,
    query,
    contentType: 'street',
    withParent: '1',
    limit: '5',
  });
  if (!data?.result?.length) return null;

  const norm = normalizeKladrName(query);
  return (
    data.result.find(s => normalizeKladrName(s.name || '').startsWith(norm))
    ?? data.result[0]
  );
}

async function lookupBuilding(streetId: string, house: string): Promise<KladrApiObject | null> {
  const query = house.trim();
  if (!query || !streetId) return null;

  const data = await requestKladr({
    streetId,
    query,
    contentType: 'building',
    withParent: '1',
    limit: '1',
  });
  return data?.result?.[0] ?? null;
}

async function lookupStructured(address: string): Promise<KladrMatch | null> {
  const parsed = parseAddressComponents(address);
  let { street, house } = parsed;
  if (street && !house) {
    const split = stripHouseFromStreet(street);
    street = split.street;
    house = split.house ?? house;
  }

  const cityName = parsed.city ?? (address.includes(',') ? address.split(',')[0].trim() : undefined);
  if (!cityName) return null;

  const city = await lookupCity(cityName);
  if (!city?.id) return null;

  if (street) {
    const streetObj = await lookupStreet(city.id, street);
    if (streetObj?.id && house) {
      const building = await lookupBuilding(streetObj.id, house);
      if (building?.id) return mapKladrObject(building);
    }
    if (streetObj?.id) return mapKladrObject(streetObj);
  }

  return mapKladrObject(city);
}

async function lookupKladrAddressApi(address: string): Promise<KladrMatch | null> {
  const query = address.trim();
  if (!query) return null;

  const oneString = await requestKladr({
    query,
    oneString: '1',
    withParent: '1',
    limit: '1',
  });
  const oneHit = oneString?.result?.[0];
  if (oneHit?.id) return mapKladrObject(oneHit);

  const structured = await lookupStructured(query);
  if (structured) return structured;

  const parsed = parseAddressComponents(query);
  const cityName = parsed.city ?? query.split(',')[0]?.trim();
  if (cityName) {
    const city = await lookupCity(cityName);
    if (city?.id) return mapKladrObject(city);
  }

  return null;
}

/** KLADR/FIAS lookup — local DB or external API based on admin settings. */
export async function searchKladrSuggestionsApi(
  query: string,
  limit = 10,
  kind: 'address' | 'region' = 'address',
  regionHint?: string,
): Promise<KladrMatch[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cap = Math.min(Math.max(limit, 1), 20);
  const searchQuery = regionHint && kind === 'address'
    ? `${trimmed}, ${regionHint.trim()}`
    : trimmed;
  const params: Record<string, string> = {
    query: searchQuery,
    oneString: '1',
    withParent: '1',
    limit: String(cap),
  };
  if (kind === 'region') {
    params.contentType = 'region';
  }

  const data = await requestKladr(params);
  const mapped = (data?.result ?? []).map(mapKladrObject).slice(0, cap);
  if (!regionHint?.trim() || kind !== 'address') return mapped;

  const hint = regionHint.trim().toLowerCase();
  const matched = mapped.filter(item => {
    const region = (item.region || '').toLowerCase();
    const address = (item.normalizedAddress || '').toLowerCase();
    return region.includes(hint) || hint.includes(region) || address.includes(hint);
  });
  return matched.length ? matched : mapped;
}

/** KLADR/FIAS autocomplete — local DB or external API based on admin settings. */
export async function searchKladrSuggestions(
  query: string,
  options?: { limit?: number; kind?: 'address' | 'region'; regionHint?: string },
): Promise<KladrMatch[]> {
  const limit = options?.limit ?? 10;
  const kind = options?.kind ?? 'address';
  const regionHint = options?.regionHint;
  const runtime = await getKladrRuntimeConfig();
  const provider = runtime.provider;

  if (provider === 'local_db' || provider === 'auto') {
    const ready = await isKladrLocalDbReady();
    if (ready) {
      const local = await searchKladrSuggestionsLocal(query, limit, kind, regionHint);
      if (local.length) return local;
      if (provider === 'local_db' && !runtime.fallbackApi) return [];
    } else if (provider === 'local_db' && !runtime.fallbackApi) {
      return [];
    }
  }

  return searchKladrSuggestionsApi(query, limit, kind, regionHint);
}

export async function lookupKladrAddress(address: string): Promise<KladrMatch | null> {
  const runtime = await getKladrRuntimeConfig();
  const provider = runtime.provider;

  if (provider === 'local_db' || provider === 'auto') {
    const ready = await isKladrLocalDbReady();
    if (ready) {
      const local = await lookupKladrAddressLocal(address);
      if (local) return local;
      if (provider === 'local_db' && !runtime.fallbackApi) return null;
    } else if (provider === 'local_db' && !runtime.fallbackApi) {
      return null;
    }
  }

  return lookupKladrAddressApi(address);
}

export async function lookupKladrCity(cityName: string): Promise<KladrMatch | null> {
  const city = await lookupCity(cityName.trim());
  return city?.id ? mapKladrObject(city) : null;
}

export async function getKladrEndpointList(): Promise<string[]> {
  const { baseUrls } = await getKladrConfig();
  return baseUrls;
}
