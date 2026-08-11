/**
 * Initial import of RZD analytics CSV files.
 *
 *   npm run import:rzd-analytics
 *   npm run import:rzd-analytics -- /path/to/file1.csv /path/to/file2.csv
 */
import { existsSync, readFileSync } from 'fs';
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
  const { initDatabase, closeDatabase } = await import('../server/db.js');
  const { importRzdAnalyticsCsv } = await import('../server/rzdAnalytics/repository.js');

  const defaultFiles = [
    '/home/user/usersfiles/РЖД_Декабрь_1.csv',
    '/home/user/usersfiles/РЖД_Декабрь_2.csv',
  ];
  const files = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultFiles;

  await initDatabase();

  for (const filePath of files) {
    if (!existsSync(filePath)) {
      console.warn(`Skip: file not found ${filePath}`);
      continue;
    }
    console.log(`Importing ${filePath}...`);
    const csv = readFileSync(filePath, 'utf-8');
    const filename = filePath.split('/').pop() || 'import.csv';
    const result = await importRzdAnalyticsCsv(csv, filename, 'system-import');
    console.log(
      `  ${filename}: inserted=${result.inserted}, duplicates=${result.duplicates}, ` +
      `errors=${result.errors.length}${result.skipped_file ? ' (file already imported)' : ''}`,
    );
    if (result.errors.length) result.errors.slice(0, 5).forEach(e => console.warn(`    ! ${e}`));
  }

  await closeDatabase();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
