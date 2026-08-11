/**
 * One-time generator: Bars CSV → PostgreSQL seed SQL.
 * Run when catalog changes: npx tsx deploy/generate-sites-seed-sql.ts
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

loadDotenv();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://generate:generate@127.0.0.1:5432/generate';
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function main() {
  const { SITE_CATEGORIES } = await import('../src/constants/siteCategories.js');
  const { parseSitesCsv } = await import('../server/siteCsvImport.js');
  const { buildCanonicalKey } = await import('../src/utils/siteCanonicalKey.js');

  const dataDir = join(process.cwd(), 'data', 'sites');
  const lines: string[] = [
    '-- Site catalog seed (generated from data/sites/*.csv). Source of truth: PostgreSQL factories table.',
    '-- Regenerate: npx tsx deploy/generate-sites-seed-sql.ts',
    '',
  ];

  let total = 0;

  for (const cat of SITE_CATEGORIES) {
    const filePath = join(dataDir, cat.csv_filename);
    if (!existsSync(filePath)) {
      console.warn(`Skip ${cat.id}: ${filePath} not found`);
      continue;
    }

    const csv = readFileSync(filePath, 'utf-8');
    const { factories, errors } = parseSitesCsv(csv, cat.id);
    if (errors.length) {
      console.warn(`${cat.csv_filename}: ${errors.length} parse errors (rows skipped)`);
    }

    for (const f of factories) {
      const canonicalKey = buildCanonicalKey(f);
      lines.push(
        `INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          ${sqlString(f.id)},
          ${sqlString(f.name)},
          ${sqlString(f.type)},
          ${sqlString(f.holding || '')},
          ${sqlString(f.country)},
          ${sqlString(f.region)},
          ${f.latitude},
          ${f.longitude},
          ${f.is_ours ? 'TRUE' : 'FALSE'},
          ${sqlString(f.description || '')},
          ${sqlString(f.code || '')},
          ${sqlString(f.address || '')},
          TRUE,
          ${f.sort_order ?? 0},
          ${sqlString(f.enterprise_status || 'never')},
          ${sqlString(canonicalKey)},
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;`,
      );
      total++;
    }
  }

  const outPath = join(process.cwd(), 'deploy/postgres/seed_sites_catalog.sql');
  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf-8');
  console.log(`Wrote ${total} sites to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
