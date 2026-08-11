/**
 * Download official KLADR Base.7z and import into PostgreSQL.
 *
 *   npm run import:kladr
 *   npm run import:kladr -- --url=https://fias.nalog.ru/Public/Downloads/Actual/base.arj
 *   npm run import:kladr -- --skip-download
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

for (const path of [join(process.cwd(), '.env'), '/opt/barslogistics/.env']) {
  if (existsSync(path)) loadDotenv({ path });
}

async function main() {
  const args = process.argv.slice(2);
  const skipDownload = args.includes('--skip-download');
  const urlArg = args.find(a => a.startsWith('--url='));
  const url = urlArg?.slice('--url='.length);

  const { initDatabase, closeDatabase } = await import('../server/db.js');
  const {
    DEFAULT_KLADR_ARCHIVE_URL,
    downloadKladrArchive,
    extractKladrArchive,
    importKladrFromDirectory,
    getKladrDataDir,
  } = await import('../server/geocoding/kladrImport.js');

  await initDatabase();

  const archiveUrl = url || DEFAULT_KLADR_ARCHIVE_URL;
  console.log('KLADR data dir:', getKladrDataDir());
  console.log('Archive URL:', archiveUrl);

  if (!skipDownload) {
    console.log('\n=== Downloading KLADR archive (may take a while) ===');
    const archive = await downloadKladrArchive(archiveUrl);
    console.log('Saved:', archive);
    console.log('\n=== Extracting ===');
    const dir = extractKladrArchive(archive);
    console.log('Extracted to:', dir);
  } else {
    console.log('\n=== Skipping download (--skip-download) ===');
    extractKladrArchive();
  }

  console.log('\n=== Importing DBF → PostgreSQL ===');
  const result = await importKladrFromDirectory();
  console.log('Settlements:', result.settlement_count.toLocaleString());
  console.log('Streets:', result.street_count.toLocaleString());
  console.log('Buildings:', result.building_count.toLocaleString());
  console.log('\nDone.');

  await closeDatabase();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
