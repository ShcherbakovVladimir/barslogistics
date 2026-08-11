/**
 * Generates CSV seed files per site category from initialData.
 * Run: npx tsx deploy/generate-site-csv.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { rawFactories } from '../src/data/initialData.ts';
import { SITE_CATEGORIES } from '../src/constants/siteCategories.ts';
import type { FactoryType } from '../src/types.ts';

const HEADER = 'id;name;latitude;longitude;region;country;holding;description;is_ours;code;address';

function escapeCsv(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(f: (typeof rawFactories)[0]): string {
  return [
    f.id,
    f.name,
    f.latitude,
    f.longitude,
    f.region,
    f.country,
    f.holding || '',
    f.description || '',
    f.is_ours ? '1' : '0',
    '',
    '',
  ].map(v => escapeCsv(String(v))).join(';');
}

const outDir = join(process.cwd(), 'data', 'sites');
mkdirSync(outDir, { recursive: true });

for (const cat of SITE_CATEGORIES) {
  const items = rawFactories.filter(f => f.type === cat.id);
  const content = [HEADER, ...items.map(row)].join('\n');
  writeFileSync(join(outDir, cat.csv_filename), content, 'utf-8');
  console.log(`${cat.csv_filename}: ${items.length} rows`);
}

console.log(`Written to ${outDir}`);
