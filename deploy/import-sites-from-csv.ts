/**
 * Import all 5 site directory CSV files from data/sites/.
 *
 * Run from source tree (auto-loads /opt/barslogistics/.env):
 *   npm run import:sites
 *
 * Or via shell wrapper (recommended on server):
 *   bash deploy/import-sites.sh
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { config as loadDotenv } from "dotenv";
import { SITE_CATEGORIES } from "../src/constants/siteCategories.js";

function bootstrapEnv(): boolean {
  if (process.env.DATABASE_URL) return true;

  const candidates = [
    process.env.BARSLOGISTICS_ENV_FILE,
    join(process.cwd(), ".env"),
    "/opt/barslogistics/.env",
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

// Must run before importing server/db.ts (it throws without DATABASE_URL)
if (!bootstrapEnv()) {
  console.error(
    "DATABASE_URL is not set.\n\n" +
    "Options:\n" +
    "  1) bash deploy/import-sites.sh\n" +
    "  2) cd /opt/barslogistics && npm run import:sites\n" +
    "  3) DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/barslogistics npm run import:sites\n" +
    "  4) BARSLOGISTICS_ENV_FILE=/opt/barslogistics/.env npm run import:sites"
  );
  process.exit(1);
}

async function main() {
  const { initDatabase, closeDatabase } = await import("../server/db.js");
  const { importSitesCsv } = await import("../server/siteCsvImport.js");

  await initDatabase();

  const dataDir = join(process.cwd(), "data", "sites");
  let totalImported = 0;
  let totalUpdated = 0;
  let totalMerged = 0;
  let totalErrors = 0;

  for (const cat of SITE_CATEGORIES) {
    const filePath = join(dataDir, cat.csv_filename);
    if (!existsSync(filePath)) {
      console.warn(`Skip ${cat.id}: file not found ${filePath}`);
      continue;
    }

    const csv = readFileSync(filePath, "utf-8");
    const result = await importSitesCsv(csv, cat.id, "merge");
    totalImported += result.imported;
    totalUpdated += result.updated;
    totalMerged += result.merged;
    totalErrors += result.errors.length;

    console.log(
      `${cat.csv_filename}: +${result.imported} new, ~${result.updated} updated, ` +
      `=${result.merged} merged, ${result.skipped} skipped, ${result.errors.length} errors`
    );
    if (result.errors.length > 0) {
      result.errors.slice(0, 5).forEach(e => console.warn(`  ! ${e}`));
    }
  }

  console.log(`Done: imported=${totalImported}, updated=${totalUpdated}, merged=${totalMerged}, errors=${totalErrors}`);
  await closeDatabase();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
