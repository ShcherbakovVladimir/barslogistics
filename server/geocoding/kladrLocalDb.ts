import { pool } from '../db.js';
import { parseAddressComponents } from './addressParse.js';
import { normalizeKladrSearchName } from './kladrImport.js';
import type { KladrMatch } from './types.js';

function formatPart(name: string, socr?: string): string {
  if (!name) return '';
  return socr ? `${socr}. ${name}`.trim() : name;
}

function stripHouseFromStreet(street?: string): { street?: string; house?: string } {
  if (!street) return {};
  const m = street.match(/^(.+?)\s+(\d+[a-zа-я]?)$/i);
  if (m?.[1] && m[2]) return { street: m[1].trim(), house: m[2].trim() };
  return { street };
}

async function findSettlement(cityName: string, regionHint?: string): Promise<{
  code: string;
  name: string;
  socr: string;
  region_code: string;
} | null> {
  const search = normalizeKladrSearchName(cityName.replace(/^(г|город|п|пос|с|село|ст|станица)\.?\s+/i, ''));
  if (!search) return null;

  const { rows } = await pool.query<{
    code: string;
    name: string;
    socr: string;
    region_code: string;
  }>(
    `SELECT code, name, socr, region_code FROM kladr_settlement
     WHERE is_actual AND (search_name = $1 OR search_name LIKE $1 || '%' OR name ILIKE $2)
     ORDER BY CASE WHEN search_name = $1 THEN 0 WHEN search_name LIKE $1 || '%' THEN 1 ELSE 2 END, length(code)
     LIMIT 15`,
    [search, cityName.replace(/[%_]/g, '')],
  );

  if (!rows.length) return null;

  if (regionHint) {
    const regionNorm = normalizeKladrSearchName(regionHint);
    const byRegion = rows.find(r => normalizeKladrSearchName(r.name).includes(regionNorm));
    if (byRegion) return byRegion;
  }

  return rows.find(r => normalizeKladrSearchName(r.name) === search) || rows[0] || null;
}

async function findStreet(parentCode: string, streetName: string): Promise<{
  code: string;
  name: string;
  socr: string;
} | null> {
  const cleaned = streetName.replace(/^(ул|улица|пр|пр-кт|проспект|пер|переулок|ш|шоссе)\.?\s+/i, '').trim();
  const search = normalizeKladrSearchName(cleaned);
  if (!search) return null;

  const { rows } = await pool.query<{ code: string; name: string; socr: string }>(
    `SELECT code, name, socr FROM kladr_street
     WHERE is_actual AND parent_code = $1
       AND (search_name = $2 OR search_name LIKE $2 || '%' OR name ILIKE $3)
     ORDER BY CASE WHEN search_name = $2 THEN 0 ELSE 1 END
     LIMIT 5`,
    [parentCode, search, cleaned.replace(/[%_]/g, '')],
  );
  return rows[0] ?? null;
}

async function findBuilding(parentCode: string, house: string): Promise<{
  code: string;
  name: string;
  korp: string;
} | null> {
  const search = normalizeKladrSearchName(house);
  if (!search) return null;

  const { rows } = await pool.query<{ code: string; name: string; korp: string }>(
    `SELECT code, name, korp FROM kladr_building
     WHERE is_actual AND parent_code = $1
       AND (search_name = $2 OR search_name LIKE $2 || '%' OR name ILIKE $3)
     ORDER BY CASE WHEN search_name = $2 THEN 0 ELSE 1 END
     LIMIT 3`,
    [parentCode, search, house.replace(/[%_]/g, '')],
  );
  return rows[0] ?? null;
}

async function regionNameForCode(regionCode: string): Promise<string | undefined> {
  const { rows } = await pool.query<{ name: string }>(
    `SELECT name FROM kladr_settlement WHERE code LIKE $1 AND RIGHT(code, 11) = '00000000000' LIMIT 1`,
    [`${regionCode}%`],
  );
  return rows[0]?.name;
}

function toMatch(
  obj: { code: string; name: string; socr?: string; korp?: string },
  parents: string[],
  contentType: string,
  region?: string,
): KladrMatch {
  const self = formatPart(obj.name, obj.socr);
  const normalizedAddress = [...parents.filter(Boolean), self].join(', ');
  return {
    id: obj.code.trim(),
    name: obj.name,
    typeShort: obj.socr,
    normalizedAddress,
    region,
    contentType,
  };
}

/** Lookup address in local KLADR PostgreSQL tables. */
export async function lookupKladrAddressLocal(address: string): Promise<KladrMatch | null> {
  const parsed = parseAddressComponents(address);
  let { street, house } = parsed;
  if (street && !house) {
    const split = stripHouseFromStreet(street);
    street = split.street;
    house = split.house ?? house;
  }

  const cityName = parsed.city ?? (address.includes(',') ? address.split(',')[0]?.trim() : address.trim());
  if (!cityName) return null;

  const settlement = await findSettlement(cityName, parsed.region);
  if (!settlement) return null;

  const region = parsed.region || (await regionNameForCode(settlement.region_code));
  const settlementLabel = formatPart(settlement.name, settlement.socr);

  if (street) {
    const streetObj = await findStreet(settlement.code, street);
    if (streetObj) {
      const streetLabel = formatPart(streetObj.name, streetObj.socr);
      if (house) {
        const building = await findBuilding(streetObj.code, house);
        if (building) {
          const bLabel = building.korp ? `${building.name}к${building.korp}` : building.name;
          return toMatch(
            { code: building.code, name: bLabel, socr: 'д' },
            [region, settlementLabel, streetLabel].filter(Boolean) as string[],
            'building',
            region,
          );
        }
      }
      return toMatch(streetObj, [region, settlementLabel].filter(Boolean) as string[], 'street', region);
    }
  }

  return toMatch(settlement, region ? [region] : [], 'city', region);
}

export async function isKladrLocalDbReady(): Promise<boolean> {
  try {
    const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM kladr_settlement');
    return Number(rows[0]?.count || 0) > 0;
  } catch {
    return false;
  }
}

function pickSearchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  const terms = new Set<string>();
  terms.add(normalizeKladrSearchName(trimmed.replace(/,/g, ' ')));
  if (parts.length) {
    const last = parts[parts.length - 1];
    const first = parts[0];
    if (last) terms.add(normalizeKladrSearchName(last));
    if (parts.length > 1 && first) {
      terms.add(normalizeKladrSearchName(first));
    }
  }
  return [...terms].filter(Boolean);
}

async function resolveRegionCodeFromHint(regionHint: string): Promise<string | null> {
  const trimmed = regionHint.trim();
  if (!trimmed) return null;

  const norm = normalizeKladrSearchName(trimmed);
  const { rows } = await pool.query<{ code: string }>(
    `SELECT code FROM kladr_settlement
     WHERE is_actual AND RIGHT(code, 11) = '00000000000'
       AND (search_name = $1 OR search_name LIKE $1 || '%' OR search_name LIKE '%' || $1 || '%' OR name ILIKE $2)
     ORDER BY CASE WHEN search_name = $1 THEN 0 WHEN search_name LIKE $1 || '%' THEN 1 ELSE 2 END, length(name)
     LIMIT 1`,
    [norm, trimmed.replace(/[%_]/g, '') + '%'],
  );

  return rows[0]?.code.slice(0, 2) ?? null;
}

function matchesRegionHint(match: KladrMatch, regionHint: string): boolean {
  const hintNorm = normalizeKladrSearchName(regionHint);
  if (!hintNorm) return true;

  const regionNorm = normalizeKladrSearchName(match.region || '');
  if (regionNorm && (regionNorm.includes(hintNorm) || hintNorm.includes(regionNorm))) {
    return true;
  }

  const addressNorm = normalizeKladrSearchName(match.normalizedAddress || '');
  return addressNorm.includes(hintNorm);
}

function filterByRegionHint(results: KladrMatch[], regionHint?: string): KladrMatch[] {
  if (!regionHint?.trim()) return results;
  const matched = results.filter(item => matchesRegionHint(item, regionHint));
  return matched.length ? matched : results;
}

function ilikePattern(term: string): string {
  return term.replace(/[%_]/g, '') + '%';
}

/** Prefix search in local KLADR tables for autocomplete. */
export async function searchKladrSuggestionsLocal(
  query: string,
  limit = 10,
  kind: 'address' | 'region' = 'address',
  regionHint?: string,
): Promise<KladrMatch[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cap = Math.min(Math.max(limit, 1), 20);
  const regionCode = regionHint ? await resolveRegionCodeFromHint(regionHint) : null;
  const terms = pickSearchTerms(trimmed);
  const results: KladrMatch[] = [];
  const seen = new Set<string>();

  const push = (match: KladrMatch) => {
    if (!match.id || seen.has(match.id)) return;
    seen.add(match.id);
    results.push(match);
  };

  if (kind === 'region') {
    for (const term of terms) {
      if (results.length >= cap) break;
      const { rows } = await pool.query<{
        code: string;
        name: string;
        socr: string;
      }>(
        `SELECT code, name, socr FROM kladr_settlement
         WHERE is_actual AND RIGHT(code, 11) = '00000000000'
           AND (search_name LIKE $1 || '%' OR name ILIKE $2)
         ORDER BY CASE WHEN search_name = $1 THEN 0 WHEN search_name LIKE $1 || '%' THEN 1 ELSE 2 END, length(name)
         LIMIT $3`,
        [term, ilikePattern(term), cap - results.length],
      );
      for (const row of rows) {
        push(toMatch(row, [], 'region', row.name));
      }
    }
    return results.slice(0, cap);
  }

  for (const term of terms) {
    if (results.length >= cap) break;

    const buildingLimit = Math.max(2, Math.ceil(cap / 3));
    const { rows: buildings } = await pool.query<{
      code: string;
      name: string;
      korp: string;
      street_name: string;
      street_socr: string;
      settlement_name: string;
      settlement_socr: string;
      region_name: string | null;
    }>(
      `SELECT b.code, b.name, b.korp,
              st.name AS street_name, st.socr AS street_socr,
              sett.name AS settlement_name, sett.socr AS settlement_socr,
              reg.name AS region_name
       FROM kladr_building b
       INNER JOIN kladr_street st ON st.code = b.parent_code AND st.is_actual
       INNER JOIN kladr_settlement sett ON sett.code = st.parent_code AND sett.is_actual
       LEFT JOIN kladr_settlement reg ON reg.code = sett.region_code || '00000000000' AND reg.is_actual
       WHERE b.is_actual
         AND (b.search_name LIKE $1 || '%' OR b.name ILIKE $2)
         AND ($4::text IS NULL OR sett.region_code = $4)
       ORDER BY CASE WHEN b.search_name = $1 THEN 0 WHEN b.search_name LIKE $1 || '%' THEN 1 ELSE 2 END
       LIMIT $3`,
      [term, ilikePattern(term), buildingLimit, regionCode],
    );
    for (const row of buildings) {
      const region = row.region_name || undefined;
      const settlementLabel = formatPart(row.settlement_name, row.settlement_socr);
      const streetLabel = formatPart(row.street_name, row.street_socr);
      const bLabel = row.korp ? `${row.name}к${row.korp}` : row.name;
      push(
        toMatch(
          { code: row.code, name: bLabel, socr: 'д' },
          [region, settlementLabel, streetLabel].filter(Boolean) as string[],
          'building',
          region,
        ),
      );
    }

    if (results.length >= cap) break;

    const streetLimit = Math.max(3, Math.ceil(cap / 2));
    const { rows: streets } = await pool.query<{
      code: string;
      name: string;
      socr: string;
      settlement_name: string;
      settlement_socr: string;
      region_name: string | null;
    }>(
      `SELECT s.code, s.name, s.socr,
              sett.name AS settlement_name, sett.socr AS settlement_socr,
              reg.name AS region_name
       FROM kladr_street s
       INNER JOIN kladr_settlement sett ON sett.code = s.parent_code AND sett.is_actual
       LEFT JOIN kladr_settlement reg ON reg.code = sett.region_code || '00000000000' AND reg.is_actual
       WHERE s.is_actual
         AND (s.search_name LIKE $1 || '%' OR s.name ILIKE $2)
         AND ($4::text IS NULL OR sett.region_code = $4)
       ORDER BY CASE WHEN s.search_name = $1 THEN 0 WHEN s.search_name LIKE $1 || '%' THEN 1 ELSE 2 END
       LIMIT $3`,
      [term, ilikePattern(term), streetLimit, regionCode],
    );
    for (const row of streets) {
      const region = row.region_name || undefined;
      const settlementLabel = formatPart(row.settlement_name, row.settlement_socr);
      push(
        toMatch(
          row,
          [region, settlementLabel].filter(Boolean) as string[],
          'street',
          region,
        ),
      );
    }

    if (results.length >= cap) break;

    const { rows: settlements } = await pool.query<{
      code: string;
      name: string;
      socr: string;
      region_code: string;
      region_name: string | null;
    }>(
      `SELECT sett.code, sett.name, sett.socr, sett.region_code, reg.name AS region_name
       FROM kladr_settlement sett
       LEFT JOIN kladr_settlement reg ON reg.code = sett.region_code || '00000000000' AND reg.is_actual
       WHERE sett.is_actual AND RIGHT(sett.code, 11) <> '00000000000'
         AND (sett.search_name LIKE $1 || '%' OR sett.name ILIKE $2)
         AND ($4::text IS NULL OR sett.region_code = $4)
       ORDER BY CASE WHEN sett.search_name = $1 THEN 0 WHEN sett.search_name LIKE $1 || '%' THEN 1 ELSE 2 END, length(sett.code)
       LIMIT $3`,
      [term, ilikePattern(term), cap - results.length, regionCode],
    );
    for (const row of settlements) {
      const region = row.region_name || undefined;
      push(toMatch(row, region ? [region] : [], 'city', region));
    }
  }

  return filterByRegionHint(results.slice(0, cap), regionHint);
}
