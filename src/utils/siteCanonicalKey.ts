import type { Factory, FactoryType } from '../types';

/** Normalize site name for deduplication (shared client + server). */
export function normalizeSiteName(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAddress(value: string | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .replace(/,\s*ул\.?\s*новая\s*\d+/gi, ', ул. новая')
    .trim();
}

function roundCoord(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Stable business key for a site row in PostgreSQL.
 * Same physical site → same key even if import uses different ids (gok_1 vs *marke).
 */
export function buildCanonicalKey(factory: Pick<Factory, 'type' | 'name' | 'latitude' | 'longitude' | 'address'>): string {
  const type = factory.type as FactoryType;
  const name = normalizeSiteName(factory.name);
  const address = normalizeAddress(factory.address);

  if (address) {
    return `${type}|${name}|${address}`;
  }

  const lat = roundCoord(factory.latitude);
  const lng = roundCoord(factory.longitude);
  return `${type}|${name}|${lat}|${lng}`;
}

/** Prefer legacy marke ids and our sites when merging duplicate rows. */
export function scoreFactoryId(id: string, isOurs: boolean): number {
  let score = 0;
  if (isOurs) score += 1000;
  if (/marke$/i.test(id)) score += 100;
  if (id.startsWith('cp_imp_')) score += 50;
  if (/^(gok|port|steel_mill|slag_dump|coal_mine)_\d+$/.test(id)) score += 10;
  if (id.startsWith('site_') || id.startsWith('fac_')) score += 1;
  return score;
}
