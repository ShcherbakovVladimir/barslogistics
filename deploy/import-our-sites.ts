/**
 * Sync «Наши площадки» (internal contour) into PostgreSQL.
 * Run manually when data/sites/Барс_Наши площадки.csv changes — NOT on deploy.
 *
 * WARNING: clears is_ours on all factories, then upserts the 5 internal sites from CSV.
 *
 *   npm run import:our-sites
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';
import { OUR_SITES } from '../src/data/ourSites.js';

function bootstrapEnv(): boolean {
  if (process.env.DATABASE_URL) return true;

  const candidates = [
    process.env.BARSLOGISTICS_ENV_FILE,
    join(process.cwd(), '.env'),
    '/opt/barslogistics/.env',
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    loadDotenv({ path });
    if (process.env.DATABASE_URL) {
      console.log(`Using DATABASE_URL from ${path}`);
      return true;
    }
  }
  return false;
}

if (!bootstrapEnv()) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const { connectDatabase, closeDatabase, pool } = await import('../server/db.js');
  const { upsertFactoryFromDirectory } = await import('../server/repositories.js');

  await connectDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('UPDATE factories SET is_ours = FALSE WHERE is_ours = TRUE');

    let inserted = 0;
    let updated = 0;
    for (const site of OUR_SITES) {
      const result = await upsertFactoryFromDirectory(client, site);
      if (result === 'inserted') inserted++;
      else if (result === 'updated') updated++;
      console.log(`  ${site.name} (${site.id}): ${result}`);
    }

    await client.query('COMMIT');
    console.log(`Our sites synced: inserted=${inserted}, updated=${updated}, total=${OUR_SITES.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await closeDatabase();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
