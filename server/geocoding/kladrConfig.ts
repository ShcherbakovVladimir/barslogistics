import type { GeocodingSettings } from '../../src/types.js';
import { getGeocodingSettings as getGeocodingSettingsFromDb } from '../integrations/settings.js';
import { DEFAULT_GEOCODING_SETTINGS } from '../integrations/helpers.js';
import { KLADR_API_FREE, KLADR_API_PAID } from './kladrEndpoints.js';

export interface KladrRuntimeConfig {
  baseUrls: string[];
  token?: string;
  key?: string;
  provider: GeocodingSettings['kladr_provider'];
  fallbackApi: boolean;
  nominatimEnabled: boolean;
  nominatimBaseUrl: string;
  stationLookupEnabled: boolean;
  knownPlacesEnabled: boolean;
}

let cached: { settings: GeocodingSettings; at: number } | null = null;
const CACHE_MS = 30_000;

export async function getGeocodingSettingsCached(): Promise<GeocodingSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.settings;
  const settings = await getGeocodingSettingsFromDb();
  cached = { settings, at: Date.now() };
  return settings;
}

export function invalidateGeocodingSettingsCache(): void {
  cached = null;
}

export async function getKladrRuntimeConfig(): Promise<KladrRuntimeConfig> {
  const settings = await getGeocodingSettingsCached();
  return buildKladrRuntimeConfig(settings);
}

export function buildKladrRuntimeConfig(settings: GeocodingSettings): KladrRuntimeConfig {
  const token = settings.kladr_api_token?.trim() || process.env.KLADR_API_TOKEN?.trim();
  const key = settings.kladr_api_key?.trim() || process.env.KLADR_API_KEY?.trim();
  const custom = settings.kladr_api_url?.trim() || process.env.KLADR_API_URL?.trim();
  const plan = settings.kladr_api_plan || (process.env.KLADR_API_PLAN?.trim().toLowerCase() as 'free' | 'paid' | undefined);

  let defaults: string[];
  if (plan === 'free') {
    defaults = [KLADR_API_FREE];
  } else if (plan === 'paid') {
    defaults = [KLADR_API_PAID, KLADR_API_FREE];
  } else if (token) {
    defaults = [KLADR_API_PAID, KLADR_API_FREE];
  } else {
    defaults = [KLADR_API_FREE];
  }

  const baseUrls = custom ? [custom, ...defaults.filter(u => u !== custom)] : defaults;

  return {
    baseUrls,
    token: token || undefined,
    key: key || undefined,
    provider: settings.kladr_provider,
    fallbackApi: settings.kladr_fallback_api,
    nominatimEnabled: settings.nominatim_enabled,
    nominatimBaseUrl: settings.nominatim_base_url?.trim() || 'https://nominatim.openstreetmap.org',
    stationLookupEnabled: settings.station_lookup_enabled,
    knownPlacesEnabled: settings.known_places_enabled,
  };
}

export function mergeGeocodingWithEnv(partial: GeocodingSettings): GeocodingSettings {
  return {
    ...DEFAULT_GEOCODING_SETTINGS,
    ...partial,
    kladr_api_token: partial.kladr_api_token || process.env.KLADR_API_TOKEN || '',
    kladr_api_key: partial.kladr_api_key || process.env.KLADR_API_KEY || '',
    kladr_api_url: partial.kladr_api_url || process.env.KLADR_API_URL || '',
  };
}
