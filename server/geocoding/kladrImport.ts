import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { pool } from '../db.js';
import { readDbfRecords, streamDownload } from './dbfReader.js';

export function getKladrDataDir(): string {
  return process.env.KLADR_DATA_DIR?.trim() || join(process.cwd(), 'data', 'kladr');
}

export function normalizeKladrSearchName(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function padCode(code: string, len: number): string {
  return code.replace(/\s/g, '').padEnd(len, '0').slice(0, len);
}

function isActualStatus(status: string | undefined): boolean {
  const s = (status || '').trim();
  return s === '' || s === '0';
}

/** Official FIAS KLADR dump (replaces deprecated GNIVC Base.7z). */
export const DEFAULT_KLADR_ARCHIVE_URL = 'https://fias.nalog.ru/Public/Downloads/Actual/base.arj';

/** Fallback URLs if primary source is unavailable. */
export const KLADR_ARCHIVE_URLS = [
  DEFAULT_KLADR_ARCHIVE_URL,
  'http://fias.nalog.ru/Public/Downloads/Actual/base.arj',
  'https://gnivc.ru/html/gnivcsoft/KLADR/Base.7z',
  'https://www.gnivc.ru/html/gnivcsoft/KLADR/Base.7z',
];

function archiveFileNameFromUrl(url: string): string {
  try {
    const name = new URL(url).pathname.split('/').pop();
    if (name) return name;
  } catch { /* ignore */ }
  return url.toLowerCase().includes('.arj') ? 'base.arj' : 'Base.7z';
}

function resolveArchivePath(archivePath?: string): string {
  if (archivePath && existsSync(archivePath)) return archivePath;
  const dir = getKladrDataDir();
  for (const name of ['base.arj', 'Base.7z', 'base.7z']) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Archive not found in ${dir}. Run download first or pass --url=`);
}

function findDbfInDir(dir: string, name: string): string | null {
  if (!existsSync(dir)) return null;
  const upper = name.toUpperCase();
  for (const file of readdirSync(dir)) {
    if (file.toUpperCase() === upper) return join(dir, file);
  }
  for (const file of readdirSync(dir)) {
    if (file.toUpperCase().endsWith('.DBF') && file.toUpperCase().includes(name.replace('.DBF', ''))) {
      return join(dir, file);
    }
  }
  return null;
}

function findDbf(dir: string, name: string): string | null {
  const direct = findDbfInDir(dir, name);
  if (direct) return direct;
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = findDbf(join(dir, entry.name), name);
    if (nested) return nested;
  }
  return null;
}

export async function downloadKladrArchive(url?: string): Promise<string> {
  const dir = getKladrDataDir();
  mkdirSync(dir, { recursive: true });

  const candidates = url ? [url, ...KLADR_ARCHIVE_URLS.filter(u => u !== url)] : KLADR_ARCHIVE_URLS;
  let lastError = '';

  for (const candidate of candidates) {
    const dest = join(dir, archiveFileNameFromUrl(candidate));
    try {
      await streamDownload(candidate, dest);
      await pool.query(
        `INSERT INTO kladr_meta (key, value, updated_at) VALUES ('archive_url', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [candidate],
      );
      return dest;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`All KLADR download URLs failed. Last error: ${lastError}`);
}

export function extractKladrArchive(archivePath?: string): string {
  const archive = resolveArchivePath(archivePath);
  const dir = getKladrDataDir();
  const extractDir = join(dir, 'extracted');
  mkdirSync(extractDir, { recursive: true });

  const commands: string[][] = [
    ['7z', 'x', archive, `-o${extractDir}`, '-y'],
    ['7za', 'x', archive, `-o${extractDir}`, '-y'],
    ['7zr', 'x', archive, `-o${extractDir}`, '-y'],
    ['unar', '-force-overwrite', '-output-directory', extractDir, archive],
    ['arj', 'x', archive, extractDir],
  ];

  let lastErr = '';
  for (const cmd of commands) {
    const bin = cmd[0];
    if (!bin) continue;
    const result = spawnSync(bin, cmd.slice(1), { encoding: 'utf-8' });
    if (result.status === 0) return extractDir;
    lastErr = result.stderr || result.stdout || `exit ${result.status}`;
  }
  throw new Error(
    `Could not extract ${archive}. Install p7zip-full (7z) or unar. ${lastErr}`,
  );
}

async function setMeta(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO kladr_meta (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value],
  );
}

async function importSettlements(dbfPath: string): Promise<number> {
  await pool.query('TRUNCATE kladr_settlement');
  let inserted = 0;
  await readDbfRecords(dbfPath, async rows => {
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let i = 0;
    for (const row of rows) {
      if (!isActualStatus(row.STATUS)) continue;
      const code = padCode(row.CODE || '', 13);
      const name = (row.NAME || '').trim();
      if (!name || code === '0'.repeat(13)) continue;
      const socr = (row.SOCR || '').trim();
      const search = normalizeKladrSearchName(name);
      values.push(code, name, socr, (row.INDEX || '').trim(), code.slice(0, 2), search, true);
      placeholders.push(
        `($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7})`,
      );
      i += 7;
      inserted++;
    }
    if (!placeholders.length) return;
    await pool.query(
      `INSERT INTO kladr_settlement (code, name, socr, postal_index, region_code, search_name, is_actual)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (code) DO NOTHING`,
      values,
    );
  });
  return inserted;
}

async function importStreets(dbfPath: string): Promise<number> {
  await pool.query('TRUNCATE kladr_street');
  let inserted = 0;
  await readDbfRecords(dbfPath, async rows => {
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let i = 0;
    for (const row of rows) {
      if (!isActualStatus(row.STATUS)) continue;
      const code = padCode(row.CODE || '', 17);
      const name = (row.NAME || '').trim();
      if (!name) continue;
      const parent = padCode(code.slice(0, 13), 13);
      const socr = (row.SOCR || '').trim();
      const search = normalizeKladrSearchName(name);
      values.push(code, parent, name, socr, (row.INDEX || '').trim(), search, true);
      placeholders.push(
        `($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7})`,
      );
      i += 7;
      inserted++;
    }
    if (!placeholders.length) return;
    await pool.query(
      `INSERT INTO kladr_street (code, parent_code, name, socr, postal_index, search_name, is_actual)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (code) DO NOTHING`,
      values,
    );
  });
  return inserted;
}

async function importBuildings(dbfPath: string): Promise<number> {
  await pool.query('TRUNCATE kladr_building');
  let inserted = 0;
  await readDbfRecords(dbfPath, async rows => {
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let i = 0;
    for (const row of rows) {
      if (!isActualStatus(row.STATUS)) continue;
      const code = padCode(row.CODE || '', 19);
      const name = (row.NAME || '').trim();
      if (!name) continue;
      const korp = (row.KORP || '').trim();
      const parent = padCode(code.slice(0, 17), 17);
      const label = korp ? `${name}к${korp}` : name;
      const search = normalizeKladrSearchName(label);
      values.push(code, parent, name, korp, search, true);
      placeholders.push(`($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6})`);
      i += 6;
      inserted++;
    }
    if (!placeholders.length) return;
    await pool.query(
      `INSERT INTO kladr_building (code, parent_code, name, korp, search_name, is_actual)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (code) DO NOTHING`,
      values,
    );
  });
  return inserted;
}

export interface KladrImportResult {
  settlement_count: number;
  street_count: number;
  building_count: number;
  source_dir: string;
}

export async function importKladrFromDirectory(sourceDir?: string): Promise<KladrImportResult> {
  const dir = sourceDir || join(getKladrDataDir(), 'extracted');
  const kladrDbf = findDbf(dir, 'KLADR.DBF');
  const streetDbf = findDbf(dir, 'STREET.DBF');
  const domaDbf = findDbf(dir, 'DOMA.DBF');

  if (!kladrDbf) throw new Error(`KLADR.DBF not found in ${dir}`);
  if (!streetDbf) throw new Error(`STREET.DBF not found in ${dir}`);

  const settlement_count = await importSettlements(kladrDbf);
  const street_count = await importStreets(streetDbf);
  const building_count = domaDbf ? await importBuildings(domaDbf) : 0;

  await setMeta('last_import_at', new Date().toISOString());
  await setMeta('settlement_count', String(settlement_count));
  await setMeta('street_count', String(street_count));
  await setMeta('building_count', String(building_count));

  return { settlement_count, street_count, building_count, source_dir: dir };
}

export async function getKladrLocalStats(): Promise<{
  settlement_count: number;
  street_count: number;
  building_count: number;
  last_import_at?: string;
  archive_url?: string;
}> {
  const counts = await Promise.all([
    pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM kladr_settlement'),
    pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM kladr_street'),
    pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM kladr_building'),
    pool.query<{ key: string; value: string }>("SELECT key, value FROM kladr_meta WHERE key IN ('last_import_at','archive_url')"),
  ]);

  const meta: Record<string, string> = {};
  for (const row of counts[3].rows) meta[row.key] = row.value;

  return {
    settlement_count: Number(counts[0].rows[0]?.count || 0),
    street_count: Number(counts[1].rows[0]?.count || 0),
    building_count: Number(counts[2].rows[0]?.count || 0),
    last_import_at: meta.last_import_at,
    archive_url: meta.archive_url,
  };
}

export async function runFullKladrImport(archiveUrl = DEFAULT_KLADR_ARCHIVE_URL): Promise<KladrImportResult> {
  const archive = await downloadKladrArchive(archiveUrl);
  const extracted = extractKladrArchive(archive);
  return importKladrFromDirectory(extracted);
}
