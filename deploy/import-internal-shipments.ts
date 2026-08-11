/**
 * Import or replace internal shipments CSV template.
 *
 *   npm run import:internal-shipments [path/to/file.csv]
 *   npm run import:internal-shipments -- --replace [path/to/file.csv]
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

const DEFAULT_FILE = '/home/user/usersfiles/Шаблон_заполнения_Внутренние_поставки_3.csv';

function bootstrapEnv(): boolean {
  if (process.env.DATABASE_URL) return true;
  for (const path of [join(process.cwd(), '.env'), '/opt/barslogistics/.env']) {
    if (!existsSync(path)) continue;
    loadDotenv({ path });
    if (process.env.DATABASE_URL) return true;
  }
  return false;
}

function parseArgs(argv: string[]): { replace: boolean; file: string } {
  const args = argv.slice(2);
  const replace = args.includes('--replace');
  const fileArg = args.find(a => !a.startsWith('--'));
  return {
    replace,
    file: fileArg || DEFAULT_FILE,
  };
}

if (!bootstrapEnv()) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const { replace, file } = parseArgs(process.argv);
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const { initDatabase, closeDatabase } = await import('../server/db.js');
  const {
    importInternalShipmentsCsv,
    replaceInternalShipmentsFromCsv,
  } = await import('../server/internalShipments/import.js');
  const { getAllProducts, getUserByUsername } = await import('../server/repositories.js');

  await initDatabase();
  const csv = readFileSync(file, 'utf-8');
  const products = await getAllProducts();
  const manager = await getUserByUsername('manager');
  const admin = await getUserByUsername('admin');
  const uploader = manager ?? admin;
  if (!uploader) {
    console.error('No manager/admin user found.');
    process.exit(1);
  }

  const filename = file.split('/').pop() || 'import.csv';
  const result = replace
    ? await replaceInternalShipmentsFromCsv(csv, filename, uploader, products)
    : await importInternalShipmentsCsv(csv, filename, uploader, products);

  await closeDatabase();

  if (replace && 'deleted' in result) {
    console.log(`Removed ${result.deleted} previously imported shipments`);
  }

  if (result.skipped_file) {
    console.log(`File already imported: ${result.batch.filename}`);
    return;
  }

  console.log(`Imported ${result.inserted} shipments (${result.duplicates} duplicates, ${result.skipped} skipped)`);
  console.log(`Counterparties created: ${result.counterparties_created}`);
  if (result.date_from && result.date_to) {
    console.log(`Date range: ${result.date_from} — ${result.date_to}`);
  }
  if (result.errors.length) {
    console.log('Warnings:');
    for (const e of result.errors.slice(0, 30)) console.log(`  - ${e}`);
    if (result.errors.length > 30) {
      console.log(`  ... and ${result.errors.length - 30} more`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
