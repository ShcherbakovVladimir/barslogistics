import type { PoolClient } from 'pg';
import type { Factory } from '../src/types.js';
import { buildCanonicalKey } from '../src/utils/siteCanonicalKey.js';

export type SiteUpsertResult = 'inserted' | 'updated' | 'merged';

const FACTORY_INSERT_COLS = `
  id, name, type, holding, country, region, latitude, longitude,
  is_ours, description, code, address, is_active, sort_order,
  enterprise_status, kladr_id, geocode_source, canonical_key, updated_at
`;

function factoryInsertValues(factory: Factory, canonicalKey: string): unknown[] {
  return [
    factory.id,
    factory.name,
    factory.type,
    factory.holding || '',
    factory.country,
    factory.region,
    factory.latitude,
    factory.longitude,
    factory.is_ours,
    factory.description,
    factory.code || '',
    factory.address || '',
    factory.is_active !== false,
    factory.sort_order ?? 0,
    factory.enterprise_status || 'never',
    factory.kladr_id || '',
    factory.geocode_source || '',
    canonicalKey,
  ];
}

function factoryUpdateValues(factory: Factory, canonicalKey: string, id: string): unknown[] {
  return [
    id,
    factory.name,
    factory.type,
    factory.holding || '',
    factory.country,
    factory.region,
    factory.latitude,
    factory.longitude,
    factory.is_ours,
    factory.description,
    factory.code || '',
    factory.address || '',
    factory.is_active !== false,
    factory.sort_order ?? 0,
    factory.enterprise_status || 'never',
    factory.kladr_id || '',
    factory.geocode_source || '',
    canonicalKey,
  ];
}

export async function registerSiteAlias(
  client: PoolClient,
  aliasId: string,
  factoryId: string,
  source: string,
): Promise<void> {
  if (aliasId === factoryId) return;
  await client.query(
    `INSERT INTO site_aliases (alias_id, factory_id, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (alias_id) DO UPDATE SET factory_id = EXCLUDED.factory_id, source = EXCLUDED.source`,
    [aliasId, factoryId, source],
  );
}

/** Resolve canonical factory id by primary id or registered alias (prefers active row). */
export async function resolveFactoryId(
  client: Pick<PoolClient, 'query'>,
  id: string,
): Promise<string | null> {
  const byId = await client.query<{ id: string; is_active: boolean | null }>(
    'SELECT id, is_active FROM factories WHERE id = $1',
    [id],
  );
  if (byId.rows[0] && byId.rows[0].is_active !== false) {
    return byId.rows[0].id;
  }

  const byAlias = await client.query<{ factory_id: string }>(
    'SELECT factory_id FROM site_aliases WHERE alias_id = $1',
    [id],
  );
  if (byAlias.rows[0]) return byAlias.rows[0].factory_id;

  return byId.rows[0]?.id ?? null;
}

async function findByCanonicalKey(client: Pick<PoolClient, 'query'>, canonicalKey: string): Promise<string | null> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM factories
     WHERE canonical_key = $1 AND COALESCE(is_active, TRUE) = TRUE
     ORDER BY is_ours DESC, id
     LIMIT 1`,
    [canonicalKey],
  );
  return rows[0]?.id ?? null;
}

/**
 * Upsert a site into factories — single entry point for CSV, map JSON, admin, shipments.
 * Matches by id → alias → canonical_key; legacy ids are stored in site_aliases.
 */
export async function upsertSite(
  client: PoolClient,
  factory: Factory,
  source = 'import',
): Promise<SiteUpsertResult> {
  const canonicalKey = buildCanonicalKey(factory);

  let targetId = await resolveFactoryId(client, factory.id);
  if (!targetId) {
    targetId = await findByCanonicalKey(client, canonicalKey);
  }

  if (!targetId) {
    await client.query(
      `INSERT INTO factories (${FACTORY_INSERT_COLS}) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
      )`,
      factoryInsertValues(factory, canonicalKey),
    );
    return 'inserted';
  }

  const merged = factory.id !== targetId;
  if (merged) {
    await registerSiteAlias(client, factory.id, targetId, source);
  }

  await client.query(
    `UPDATE factories SET
      name = $2, type = $3, holding = $4, country = $5, region = $6,
      latitude = $7, longitude = $8, is_ours = $9, description = $10,
      code = $11, address = $12, is_active = TRUE, sort_order = $13,
      enterprise_status = $14, kladr_id = $15, geocode_source = $16,
      canonical_key = $17, edit_count = COALESCE(edit_count, 0) + 1, updated_at = NOW()
     WHERE id = $1`,
    factoryUpdateValues(factory, canonicalKey, targetId),
  );

  return merged ? 'merged' : 'updated';
}

export async function backfillCanonicalKeys(client: Pick<PoolClient, 'query'>): Promise<number> {
  const { rows } = await client.query<{
    id: string;
    type: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string | null;
    canonical_key: string | null;
  }>(
    `SELECT id, type, name, latitude, longitude, address, canonical_key
     FROM factories WHERE COALESCE(is_active, TRUE) = TRUE`,
  );

  let updated = 0;
  for (const row of rows) {
    const key = buildCanonicalKey({
      type: row.type as Factory['type'],
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      address: row.address || undefined,
    });
    if (row.canonical_key === key) continue;

    const result = await client.query(
      `UPDATE factories SET canonical_key = $2, updated_at = NOW()
       WHERE id = $1
         AND NOT EXISTS (
           SELECT 1 FROM factories f2
           WHERE f2.canonical_key = $2
             AND f2.id <> $1
             AND COALESCE(f2.is_active, TRUE) = TRUE
         )`,
      [row.id, key],
    );
    if ((result.rowCount ?? 0) > 0) {
      updated++;
      continue;
    }

    // Another active row already owns this key — leave for mergeSiteDuplicates
    const conflict = await client.query<{ id: string }>(
      `SELECT id FROM factories
       WHERE canonical_key = $2 AND id <> $1 AND COALESCE(is_active, TRUE) = TRUE
       LIMIT 1`,
      [row.id, key],
    );
    if (conflict.rows[0] && row.canonical_key !== key) {
      await client.query(
        `UPDATE factories SET canonical_key = NULL, updated_at = NOW() WHERE id = $1`,
        [row.id],
      );
    }
  }
  return updated;
}
