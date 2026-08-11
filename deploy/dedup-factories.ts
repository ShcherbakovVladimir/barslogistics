/**
 * Merge duplicate factory rows (CLI wrapper around server/siteDedup.ts).
 *
 *   npm run dedup:factories
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

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
  const { connectDatabase, closeDatabase } = await import('../server/db.js');
  const { mergeSiteDuplicates } = await import('../server/siteDedup.js');

  await connectDatabase();
  const result = await mergeSiteDuplicates();
  console.log(
    `Done: ${result.merged_groups} groups merged, ${result.deactivated} deactivated, ${result.aliases} aliases.`,
  );
  await closeDatabase();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
