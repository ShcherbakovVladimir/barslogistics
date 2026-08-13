import type { PoolClient } from 'pg';
import type { Factory, Product, SalesManager, SupplyLink, User } from '../../src/types.js';
import { mapCargoTypeToProductId } from '../../src/constants/products.js';
import { pool } from '../db.js';
import { getAllFactories, getAllSalesManagers, getFactoryById } from '../repositories.js';
import {
  computeFileHash,
  computeRowContentHash,
  makeBatchId,
  parseInternalShipmentsCsv,
  type ParsedInternalShipmentRow,
} from './parseCsv.js';
import { geocodeRussianAddress } from '../geocoding/ruAddressGeocoder.js';
import { upsertSite, resolveFactoryId } from '../siteRegistry.js';

export interface ShipmentImportResult {
  batch: {
    id: string;
    filename: string;
    file_hash: string;
    row_count: number;
    inserted_count: number;
    duplicate_count: number;
    skipped_count: number;
    error_count: number;
    status: string;
    created_at: string;
  };
  inserted: number;
  duplicates: number;
  skipped: number;
  errors: string[];
  skipped_file?: boolean;
  counterparties_created: number;
  date_from?: string;
  date_to?: string;
}

export interface ShipmentCsvPreviewResult {
  filename: string;
  links: SupplyLink[];
  factories: Factory[];
  errors: string[];
  skipped: number;
  row_count: number;
  date_from?: string;
  date_to?: string;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSite(siteName: string, factories: Factory[]): Factory | null {
  const norm = normalizeName(siteName);
  const ours = factories.filter(f => f.is_ours);

  let hit = ours.find(f => normalizeName(f.name) === norm);
  if (hit) return hit;

  hit = ours.find(f => {
    const fn = normalizeName(f.name);
    return fn.includes(norm) || norm.includes(fn);
  });
  if (hit) return hit;

  const aliases: Record<string, string> = {
    'бмз транзит': 'бмз транзит',
    'красный октябрь': 'красный октябрь',
    'чусовой': 'чусовой',
    'липецк': 'липецк',
    'волжский': 'волжский',
  };
  const aliasTarget = aliases[norm];
  if (aliasTarget) {
    hit = ours.find(f => normalizeName(f.name) === aliasTarget);
    if (hit) return hit;
  }

  return null;
}

function makeCounterpartyId(consignee: string, address: string): string {
  const normAddr = address
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s*ул\.?\s*новая\s*\d+/gi, ', ул. новая')
    .trim();
  const slug = `${consignee}|${normAddr}`.toLowerCase();
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return `cp_imp_${Math.abs(h).toString(36)}`;
}

function extractRegionFromAddress(address: string, fallback: string): string {
  if (!address) return fallback;
  const first = address.split(',')[0]?.trim() || '';
  if (/\b(обл\.|область|край|респ\.|республика|ао|округ)/i.test(first)) return first;
  const cityMatch = address.match(/(?:^|[,\s])(?:г\.|город|р\.?\s*п\.?)\s*([^,;]+)/i);
  if (cityMatch?.[1]) return cityMatch[1].trim();
  return fallback;
}

async function ensureCounterparty(
  client: PoolClient,
  row: ParsedInternalShipmentRow,
  origin: Factory,
  cache: Map<string, string>,
): Promise<{ id: string; created: boolean }> {
  const label = row.consignee || row.deliveryAddress || 'Получатель';
  const address = row.deliveryAddress || row.consignee || '';
  const cacheKey = `${label}|${address}`.toLowerCase();
  const existingId = cache.get(cacheKey);
  if (existingId) return { id: existingId, created: false };

  const id = makeCounterpartyId(label, address);
  const existing = await getFactoryById(id);
  if (existing) {
    cache.set(cacheKey, id);
    return { id, created: false };
  }

  const deliveryAddress = address || label;
  const geo = await geocodeRussianAddress(deliveryAddress, {
    regionHint: origin.region,
    label,
  });

  const factory: Factory = {
    id,
    name: label.trim(),
    type: 'port',
    latitude: geo.latitude,
    longitude: geo.longitude,
    region: geo.region || extractRegionFromAddress(deliveryAddress, origin.region),
    country: origin.country || 'РФ',
    is_ours: false,
    description: row.description || '',
    holding: '',
    address: geo.normalized_address || deliveryAddress,
    kladr_id: geo.kladr_id,
    geocode_source: geo.geocode_source,
    is_active: true,
    enterprise_status: 'active',
  };

  const upsertResult = await upsertSite(client, factory, 'shipment_import');
  const resolvedId = (await resolveFactoryId(client, factory.id)) ?? factory.id;

  cache.set(cacheKey, resolvedId);
  return { id: resolvedId, created: upsertResult === 'inserted' };
}

/** Build ephemeral counterparty for map preview — no DB writes. */
async function resolvePreviewCounterparty(
  row: ParsedInternalShipmentRow,
  origin: Factory,
  allFactories: Factory[],
  cache: Map<string, Factory>,
): Promise<Factory> {
  const label = row.consignee || row.deliveryAddress || 'Получатель';
  const address = row.deliveryAddress || row.consignee || '';
  const cacheKey = `${label}|${address}`.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const id = `cp_prev_${makeCounterpartyId(label, address).replace(/^cp_imp_/, '')}`;
  const existingByName = allFactories.find(f => {
    if (f.is_ours) return false;
    const fn = normalizeName(f.name);
    const ln = normalizeName(label);
    return fn === ln || fn.includes(ln) || ln.includes(fn);
  });
  if (existingByName) {
    cache.set(cacheKey, existingByName);
    return existingByName;
  }

  const deliveryAddress = address || label;
  const geo = await geocodeRussianAddress(deliveryAddress, {
    regionHint: origin.region,
    label,
  });

  const factory: Factory = {
    id,
    name: label.trim(),
    type: 'port',
    latitude: geo.latitude || row.latitude || origin.latitude,
    longitude: geo.longitude || row.longitude || origin.longitude,
    region: geo.region || extractRegionFromAddress(deliveryAddress, origin.region),
    country: origin.country || 'РФ',
    is_ours: false,
    description: row.description || '',
    holding: '',
    address: geo.normalized_address || deliveryAddress,
    kladr_id: geo.kladr_id,
    geocode_source: geo.geocode_source,
    is_active: true,
    enterprise_status: 'active',
  };

  cache.set(cacheKey, factory);
  return factory;
}

function userCanImportRow(user: User, site: Factory): boolean {
  if (user.role === 'admin' || user.role === 'manager') return true;
  if (user.role === 'site_manager') {
    const siteIds = new Set(
      user.assigned_site_ids?.length
        ? user.assigned_site_ids
        : user.site_id
          ? [user.site_id]
          : [],
    );
    return siteIds.has(site.id);
  }
  return false;
}

function resolveSalesManager(
  row: ParsedInternalShipmentRow,
  salesManagers: SalesManager[],
): {
  sales_manager_id?: string;
  manager_id?: string;
  manager_name?: string;
} {
  const norm = normalizeName(row.managerName);
  if (norm) {
    const hit = salesManagers.find(m => {
      const full = normalizeName(m.full_name);
      const last = normalizeName(m.last_name);
      return full.includes(norm) || norm.includes(full) || last.includes(norm) || norm.includes(last);
    });
    if (hit) {
      return {
        sales_manager_id: hit.id,
        manager_id: hit.id,
        manager_name: hit.full_name,
      };
    }
  }
  if (row.managerName?.trim()) {
    return { manager_name: row.managerName.trim() };
  }
  return {};
}

export async function deleteImportedInternalShipments(): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM shipment_change_logs
       WHERE shipment_id IN (SELECT id FROM supply_links WHERE id LIKE 'sh_imp_%')`,
    );
    const result = await client.query(`DELETE FROM supply_links WHERE id LIKE 'sh_imp_%'`);
    await client.query('DELETE FROM shipment_import_batches');
    await client.query('COMMIT');
    return result.rowCount ?? 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function replaceInternalShipmentsFromCsv(
  csvText: string,
  filename: string,
  uploader: User,
  products: Product[],
): Promise<ShipmentImportResult & { deleted: number }> {
  const deleted = await deleteImportedInternalShipments();
  const result = await importInternalShipmentsCsv(csvText, filename, uploader, products);
  return { ...result, deleted };
}

export async function importInternalShipmentsCsv(
  csvText: string,
  filename: string,
  uploader: User,
  products: Product[],
): Promise<ShipmentImportResult> {
  const fileHash = computeFileHash(csvText);
  const existingBatch = await pool.query(
    'SELECT id, filename FROM shipment_import_batches WHERE file_hash = $1',
    [fileHash],
  );
  if (existingBatch.rows.length > 0) {
    const row = existingBatch.rows[0];
    return {
      batch: {
        id: String(row.id),
        filename: String(row.filename),
        file_hash: fileHash,
        row_count: 0,
        inserted_count: 0,
        duplicate_count: 0,
        skipped_count: 0,
        error_count: 0,
        status: 'skipped',
        created_at: new Date().toISOString(),
      },
      inserted: 0,
      duplicates: 0,
      skipped: 0,
      errors: [],
      skipped_file: true,
      counterparties_created: 0,
      date_from: undefined,
      date_to: undefined,
    };
  }

  const { rows, errors: parseErrors } = parseInternalShipmentsCsv(csvText);
  const firstRow = rows[0];
  const dateFrom = firstRow ? rows.reduce((min, r) => (r.shipmentDate < min ? r.shipmentDate : min), firstRow.shipmentDate) : undefined;
  const dateTo = firstRow ? rows.reduce((max, r) => (r.shipmentDate > max ? r.shipmentDate : max), firstRow.shipmentDate) : undefined;
  const factories = await getAllFactories();
  const salesManagers = await getAllSalesManagers(false);
  const batchId = makeBatchId();
  let inserted = 0;
  let duplicates = 0;
  let skipped = 0;
  let counterpartiesCreated = 0;
  const errors = [...parseErrors];
  const counterpartyCache = new Map<string, string>();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const site = matchSite(row.siteName, factories);
      if (!site) {
        skipped++;
        errors.push(`Row ${i + 2}: site not found «${row.siteName}»`);
        continue;
      }
      if (!userCanImportRow(uploader, site)) {
        skipped++;
        errors.push(`Row ${i + 2}: no access to site «${row.siteName}»`);
        continue;
      }

      const contentHash = computeRowContentHash(row);
      const dup = await client.query(
        'SELECT id FROM supply_links WHERE content_hash = $1',
        [contentHash],
      );
      if (dup.rows.length > 0) {
        duplicates++;
        continue;
      }

      const { id: destId, created: cpCreated } = await ensureCounterparty(client, row, site, counterpartyCache);
      if (cpCreated) counterpartiesCreated++;

      const cargoText = [row.cargoGroup, row.description].filter(Boolean).join(' — ');
      const productId = mapCargoTypeToProductId(cargoText || row.cargoGroup, products);
      const product = products.find(p => p.id === productId);
      const manager = resolveSalesManager(row, salesManagers);

      const shipmentId = `sh_imp_${contentHash.slice(0, 10)}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const link: SupplyLink = {
        id: shipmentId,
        origin_id: site.id,
        destination_id: destId,
        cargo_type: row.description || product?.name_ru || row.cargoGroup || productId,
        product_id: productId,
        flow_type: 'internal',
        volume: row.volume,
        unit: 'т',
        source: 'own',
        period: row.shipmentDate.slice(0, 4),
        shipment_date: row.shipmentDate,
        status: 'arrived',
        sales_manager_id: manager.sales_manager_id,
        manager_id: manager.manager_id,
        manager_name: manager.manager_name,
        created_by: uploader.id,
        site_id: site.id,
        driver_info: row.deliveryAddress || undefined,
      };

      await client.query(
        `INSERT INTO supply_links (
          id, origin_id, destination_id, cargo_type, product_id, flow_type, volume, unit, period,
          shipment_date, manager_id, manager_name, sales_manager_id, created_by, site_id, status, source, content_hash, last_updated
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())`,
        [
          link.id,
          link.origin_id,
          link.destination_id,
          link.cargo_type,
          link.product_id,
          link.flow_type,
          link.volume,
          link.unit,
          link.period,
          link.shipment_date,
          link.manager_id ?? null,
          link.manager_name ?? null,
          link.sales_manager_id ?? null,
          link.created_by,
          link.site_id,
          link.status,
          link.source,
          contentHash,
        ],
      );
      inserted++;
    }

    await client.query(
      `INSERT INTO shipment_import_batches (
        id, filename, file_hash, uploaded_by, row_count, inserted_count,
        duplicate_count, skipped_count, error_count, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        batchId,
        filename,
        fileHash,
        uploader.username,
        rows.length,
        inserted,
        duplicates,
        skipped,
        errors.length,
        'completed',
      ],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    batch: {
      id: batchId,
      filename,
      file_hash: fileHash,
      row_count: rows.length,
      inserted_count: inserted,
      duplicate_count: duplicates,
      skipped_count: skipped,
      error_count: errors.length,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    inserted,
    duplicates,
    skipped,
    errors: errors.slice(0, 50),
    counterparties_created: counterpartiesCreated,
    date_from: dateFrom,
    date_to: dateTo,
  };
}

/** Resolve CSV to map-ready shipments without writing to the database. */
export async function previewInternalShipmentsCsv(
  csvText: string,
  filename: string,
  uploader: User,
  products: Product[],
): Promise<ShipmentCsvPreviewResult> {
  const { rows, errors: parseErrors } = parseInternalShipmentsCsv(csvText);
  const firstRow = rows[0];
  const dateFrom = firstRow
    ? rows.reduce((min, r) => (r.shipmentDate < min ? r.shipmentDate : min), firstRow.shipmentDate)
    : undefined;
  const dateTo = firstRow
    ? rows.reduce((max, r) => (r.shipmentDate > max ? r.shipmentDate : max), firstRow.shipmentDate)
    : undefined;

  const factories = await getAllFactories();
  const salesManagers = await getAllSalesManagers(false);
  const errors = [...parseErrors];
  let skipped = 0;
  const links: SupplyLink[] = [];
  const ephemeralFactories: Factory[] = [];
  const counterpartyCache = new Map<string, Factory>();
  const seenEphemeralIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const site = matchSite(row.siteName, factories);
    if (!site) {
      skipped++;
      errors.push(`Row ${i + 2}: site not found «${row.siteName}»`);
      continue;
    }
    if (!userCanImportRow(uploader, site)) {
      skipped++;
      errors.push(`Row ${i + 2}: no access to site «${row.siteName}»`);
      continue;
    }

    const dest = await resolvePreviewCounterparty(row, site, factories, counterpartyCache);
    if (dest.id.startsWith('cp_prev_') && !seenEphemeralIds.has(dest.id)) {
      seenEphemeralIds.add(dest.id);
      ephemeralFactories.push(dest);
    }

    const cargoText = [row.cargoGroup, row.description].filter(Boolean).join(' — ');
    const productId = mapCargoTypeToProductId(cargoText || row.cargoGroup, products);
    const product = products.find(p => p.id === productId);
    const manager = resolveSalesManager(row, salesManagers);
    const contentHash = computeRowContentHash(row);

    links.push({
      id: `sh_prev_${contentHash.slice(0, 10)}_${i}`,
      origin_id: site.id,
      destination_id: dest.id,
      cargo_type: row.description || product?.name_ru || row.cargoGroup || productId,
      product_id: productId,
      flow_type: 'internal',
      volume: row.volume,
      unit: 'т',
      source: 'own',
      period: row.shipmentDate.slice(0, 4),
      shipment_date: row.shipmentDate,
      status: 'arrived',
      sales_manager_id: manager.sales_manager_id,
      manager_id: manager.manager_id,
      manager_name: manager.manager_name,
      created_by: uploader.id,
      site_id: site.id,
      driver_info: row.deliveryAddress || undefined,
    });
  }

  return {
    filename,
    links,
    factories: ephemeralFactories,
    errors: errors.slice(0, 50),
    skipped,
    row_count: rows.length,
    date_from: dateFrom,
    date_to: dateTo,
  };
}

export async function getShipmentImportBatches(limit = 20): Promise<ShipmentImportResult['batch'][]> {
  const { rows } = await pool.query(
    `SELECT * FROM shipment_import_batches ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map(r => ({
    id: String(r.id),
    filename: String(r.filename),
    file_hash: String(r.file_hash),
    row_count: Number(r.row_count),
    inserted_count: Number(r.inserted_count),
    duplicate_count: Number(r.duplicate_count),
    skipped_count: Number(r.skipped_count),
    error_count: Number(r.error_count),
    status: String(r.status),
    created_at: new Date(r.created_at as string).toISOString(),
  }));
}
