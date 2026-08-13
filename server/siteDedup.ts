import type { PoolClient } from 'pg';
import type { Factory, FactoryType } from '../src/types.js';
import type {
  SiteDuplicateGroup,
  SiteDuplicatesReport,
  SiteMergeDuplicatesResult,
} from '../src/types.js';
import { buildCanonicalKey, scoreFactoryId } from '../src/utils/siteCanonicalKey.js';
import { pool } from './db.js';
import {
  backfillCanonicalKeys,
  registerSiteAlias,
} from './siteRegistry.js';

type FactoryDedupRow = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string | null;
  is_ours: boolean;
  edit_count: number;
};

async function loadActiveFactories(client: Pick<PoolClient, 'query'>): Promise<FactoryDedupRow[]> {
  const { rows } = await client.query<FactoryDedupRow>(
    `SELECT id, name, type, latitude, longitude, address, is_ours,
            COALESCE(edit_count, 0)::int AS edit_count
     FROM factories WHERE COALESCE(is_active, TRUE) = TRUE`,
  );
  return rows;
}

function groupByComputedKey(rows: FactoryDedupRow[]): Map<string, FactoryDedupRow[]> {
  const groups = new Map<string, FactoryDedupRow[]>();
  for (const row of rows) {
    const key = buildCanonicalKey({
      type: row.type as Factory['type'],
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      address: row.address || undefined,
    });
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return groups;
}

async function countLinkRefs(client: Pick<PoolClient, 'query'>, id: string): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT (
      (SELECT COUNT(*) FROM supply_links WHERE origin_id = $1 OR destination_id = $1 OR site_id = $1)
    )::text AS count`,
    [id],
  );
  return Number(rows[0]?.count ?? 0);
}

async function rewireReferences(client: PoolClient, fromId: string, toId: string): Promise<void> {
  await client.query('UPDATE supply_links SET origin_id = $2 WHERE origin_id = $1', [fromId, toId]);
  await client.query('UPDATE supply_links SET destination_id = $2 WHERE destination_id = $1', [fromId, toId]);
  await client.query('UPDATE supply_links SET site_id = $2 WHERE site_id = $1', [fromId, toId]);
  await client.query('UPDATE users SET site_id = $2 WHERE site_id = $1', [fromId, toId]);
}

async function mergeDuplicateGroup(
  client: PoolClient,
  canonicalKey: string,
  rows: FactoryDedupRow[],
): Promise<{ aliases: number; deactivated: number }> {
  let aliases = 0;
  let deactivated = 0;

  const scored: Array<FactoryDedupRow & { link_refs: number; idScore: number }> = [];
  for (const row of rows) {
    scored.push({
      ...row,
      link_refs: await countLinkRefs(client, row.id),
      idScore: scoreFactoryId(row.id, row.is_ours),
    });
  }

  scored.sort((a, b) => {
    if (b.link_refs !== a.link_refs) return b.link_refs - a.link_refs;
    if (b.idScore !== a.idScore) return b.idScore - a.idScore;
    return a.id.localeCompare(b.id);
  });

  const winner = scored[0];
  if (!winner) return { aliases: 0, deactivated: 0 };
  const losers = scored.slice(1);

  await client.query(
    'UPDATE factories SET canonical_key = $2, updated_at = NOW() WHERE id = $1',
    [winner.id, canonicalKey],
  );

  for (const loser of losers) {
    await rewireReferences(client, loser.id, winner.id);
    await registerSiteAlias(client, loser.id, winner.id, 'dedup');
    aliases++;
    await client.query(
      `UPDATE factories SET is_active = FALSE, canonical_key = NULL, updated_at = NOW() WHERE id = $1`,
      [loser.id],
    );
    deactivated++;
  }

  return { aliases, deactivated };
}

async function buildDuplicateGroups(client: Pick<PoolClient, 'query'>): Promise<SiteDuplicateGroup[]> {
  const rows = await loadActiveFactories(client);
  const grouped = groupByComputedKey(rows);
  const groups: SiteDuplicateGroup[] = [];

  for (const [canonicalKey, members] of grouped) {
    if (members.length < 2) continue;

    const sites = await Promise.all(
      members.map(async row => ({
        id: row.id,
        name: row.name,
        type: row.type as FactoryType,
        is_ours: row.is_ours,
        edit_count: row.edit_count,
        link_refs: await countLinkRefs(client, row.id),
      })),
    );

    groups.push({ canonical_key: canonicalKey, sites });
  }

  return groups.sort((a, b) => b.sites.length - a.sites.length);
}

export async function getSiteDuplicatesReport(): Promise<SiteDuplicatesReport> {
  const groups = await buildDuplicateGroups(pool);
  const totalDuplicateRows = groups.reduce((sum, g) => sum + g.sites.length - 1, 0);

  return {
    groups,
    total_groups: groups.length,
    total_duplicate_rows: totalDuplicateRows,
  };
}

export async function mergeSiteDuplicates(): Promise<SiteMergeDuplicatesResult> {
  const client = await pool.connect();
  let mergedGroups = 0;
  let deactivated = 0;
  let aliases = 0;

  try {
    await client.query('BEGIN');

    const rows = await loadActiveFactories(client);
    const grouped = groupByComputedKey(rows);

    for (const [canonicalKey, members] of grouped) {
      if (members.length < 2) continue;
      const result = await mergeDuplicateGroup(client, canonicalKey, members);
      aliases += result.aliases;
      deactivated += result.deactivated;
      mergedGroups++;
    }

    await backfillCanonicalKeys(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { merged_groups: mergedGroups, deactivated, aliases };
}
