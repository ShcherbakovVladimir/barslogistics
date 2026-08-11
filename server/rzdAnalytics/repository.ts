import type { PoolClient } from 'pg';
import { pool } from '../db.js';
import type {
  RzdAggregatedRoute,
  RzdAnalyticsFilters,
  RzdAnalyticsRecord,
  RzdAnalyticsSummary,
  RzdImportBatch,
  RzdImportResult,
  RzdStation,
} from '../../src/types.js';
import {
  computeFileHash,
  computeRowContentHash,
  makeBatchId,
  makeRecordId,
  parseRzdAnalyticsCsv,
  type ParsedRzdRow,
} from './parseCsv.js';
import { makeStationId } from './regionCoords.js';
import { makeNameStationId, resolveStationCoords } from './stationDirectory.js';

interface StationUpsert {
  id: string;
  esr_code: string | null;
  name: string;
  region: string;
  country: string;
  railway: string | null;
  latitude: number;
  longitude: number;
}

async function rowToStation(row: ParsedRzdRow, kind: 'origin' | 'dest'): Promise<StationUpsert> {
  if (kind === 'origin') {
    const region = row.originRegion || row.originCountry;
    const code = row.originStationCode?.trim() || null;
    const coords = await resolveStationCoords({
      esrCode: code,
      name: row.originStationName,
      region,
    });
    return {
      id: makeStationId(code, row.originStationName, region),
      esr_code: code && code !== '10' ? code : null,
      name: row.originStationName,
      region,
      country: row.originCountry,
      railway: row.originRailway || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }
  const region = row.destRegion || row.destCountry;
  const coords = await resolveStationCoords({
    name: row.destStationName,
    region,
  });
  return {
    id: makeNameStationId(row.destStationName, region),
    esr_code: null,
    name: row.destStationName,
    region,
    country: row.destCountry,
    railway: null,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

async function upsertStation(client: PoolClient, s: StationUpsert): Promise<string> {
  await client.query(
    `INSERT INTO rzd_stations (id, esr_code, name, region, country, railway, latitude, longitude, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       region = COALESCE(EXCLUDED.region, rzd_stations.region),
       country = COALESCE(EXCLUDED.country, rzd_stations.country),
       railway = COALESCE(EXCLUDED.railway, rzd_stations.railway),
       esr_code = COALESCE(EXCLUDED.esr_code, rzd_stations.esr_code),
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       updated_at = NOW()`,
    [s.id, s.esr_code, s.name, s.region, s.country, s.railway, s.latitude, s.longitude],
  );
  return s.id;
}

function mapBatch(row: Record<string, unknown>): RzdImportBatch {
  return {
    id: String(row.id),
    filename: String(row.filename),
    file_hash: String(row.file_hash),
    uploaded_by: row.uploaded_by != null ? String(row.uploaded_by) : undefined,
    row_count: Number(row.row_count),
    inserted_count: Number(row.inserted_count),
    duplicate_count: Number(row.duplicate_count),
    error_count: Number(row.error_count),
    status: String(row.status) as RzdImportBatch['status'],
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function mapRecord(row: Record<string, unknown>): RzdAnalyticsRecord {
  return {
    id: String(row.id),
    batch_id: String(row.batch_id),
    content_hash: String(row.content_hash),
    shipment_date: String(row.shipment_date).slice(0, 10),
    cargo_code: row.cargo_code != null ? String(row.cargo_code) : undefined,
    cargo_name: String(row.cargo_name),
    origin_country: row.origin_country != null ? String(row.origin_country) : undefined,
    origin_region: row.origin_region != null ? String(row.origin_region) : undefined,
    origin_station_name: String(row.origin_station_name),
    origin_station_code: row.origin_station_code != null ? String(row.origin_station_code) : undefined,
    origin_railway: row.origin_railway != null ? String(row.origin_railway) : undefined,
    dest_country: row.dest_country != null ? String(row.dest_country) : undefined,
    dest_region: row.dest_region != null ? String(row.dest_region) : undefined,
    dest_station_name: String(row.dest_station_name),
    shipper: row.shipper != null ? String(row.shipper) : undefined,
    consignee: row.consignee != null ? String(row.consignee) : undefined,
    volume: Number(row.volume),
    unit: String(row.unit || 't'),
    origin_station_id: row.origin_station_id != null ? String(row.origin_station_id) : undefined,
    dest_station_id: row.dest_station_id != null ? String(row.dest_station_id) : undefined,
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function mapStation(row: Record<string, unknown>): RzdStation {
  return {
    id: String(row.id),
    esr_code: row.esr_code != null ? String(row.esr_code) : undefined,
    name: String(row.name),
    region: row.region != null ? String(row.region) : undefined,
    country: row.country != null ? String(row.country) : undefined,
    railway: row.railway != null ? String(row.railway) : undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

export async function importRzdAnalyticsCsv(
  csvText: string,
  filename: string,
  uploadedBy?: string,
): Promise<RzdImportResult> {
  const fileHash = computeFileHash(csvText);
  const existing = await pool.query('SELECT id, filename FROM rzd_import_batches WHERE file_hash = $1', [fileHash]);
  if (existing.rows.length > 0) {
    const batch = mapBatch(existing.rows[0]);
    return {
      batch,
      inserted: 0,
      duplicates: 0,
      errors: [],
      skipped_file: true,
      message: `File already imported as "${batch.filename}"`,
    };
  }

  const { rows, errors: parseErrors } = parseRzdAnalyticsCsv(csvText);
  const batchId = makeBatchId();
  const client = await pool.connect();

  let inserted = 0;
  let duplicates = 0;
  const insertErrors = [...parseErrors];

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO rzd_import_batches (id, filename, file_hash, uploaded_by, row_count, status)
       VALUES ($1, $2, $3, $4, $5, 'processing')`,
      [batchId, filename, fileHash, uploadedBy ?? null, rows.length],
    );

    for (const row of rows) {
      try {
        const originStation = await rowToStation(row, 'origin');
        const destStation = await rowToStation(row, 'dest');
        const originId = await upsertStation(client, originStation);
        const destId = await upsertStation(client, destStation);
        const contentHash = computeRowContentHash(row);
        const res = await client.query(
          `INSERT INTO rzd_analytics_records (
            id, batch_id, content_hash, shipment_date, cargo_code, cargo_name,
            origin_country, origin_region, origin_station_name, origin_station_code, origin_railway,
            dest_country, dest_region, dest_station_name, shipper, consignee, volume,
            origin_station_id, dest_station_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          ON CONFLICT (content_hash) DO NOTHING`,
          [
            makeRecordId(), batchId, contentHash, row.shipmentDate, row.cargoCode || null, row.cargoName,
            row.originCountry, row.originRegion || null, row.originStationName, row.originStationCode || null, row.originRailway || null,
            row.destCountry, row.destRegion || null, row.destStationName, row.shipper || null, row.consignee || null, row.volume,
            originId, destId,
          ],
        );
        if (res.rowCount === 0) duplicates++;
        else inserted++;
      } catch (err) {
        insertErrors.push(err instanceof Error ? err.message : String(err));
      }
    }

    await client.query(
      `UPDATE rzd_import_batches SET
        inserted_count = $2, duplicate_count = $3, error_count = $4, status = 'completed'
       WHERE id = $1`,
      [batchId, inserted, duplicates, insertErrors.length],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const batchRes = await pool.query('SELECT * FROM rzd_import_batches WHERE id = $1', [batchId]);
  return {
    batch: mapBatch(batchRes.rows[0]),
    inserted,
    duplicates,
    errors: insertErrors.slice(0, 20),
    skipped_file: false,
  };
}

function buildFilterClause(filters: RzdAnalyticsFilters, startIdx = 1): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let idx = startIdx;

  if (filters.dateFrom) {
    clauses.push(`r.shipment_date >= $${idx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push(`r.shipment_date <= $${idx++}`);
    params.push(filters.dateTo);
  }
  if (filters.cargoCode) {
    clauses.push(`r.cargo_code = $${idx++}`);
    params.push(filters.cargoCode);
  }
  if (filters.cargoSearch) {
    clauses.push(`r.cargo_name ILIKE $${idx++}`);
    params.push(`%${filters.cargoSearch}%`);
  }
  if (filters.originRegion) {
    clauses.push(`r.origin_region ILIKE $${idx++}`);
    params.push(`%${filters.originRegion}%`);
  }
  if (filters.destRegion) {
    clauses.push(`r.dest_region ILIKE $${idx++}`);
    params.push(`%${filters.destRegion}%`);
  }
  if (filters.shipperSearch) {
    clauses.push(`r.shipper ILIKE $${idx++}`);
    params.push(`%${filters.shipperSearch}%`);
  }
  if (filters.consigneeSearch) {
    clauses.push(`r.consignee ILIKE $${idx++}`);
    params.push(`%${filters.consigneeSearch}%`);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

export async function getRzdAnalyticsSummary(filters: RzdAnalyticsFilters = {}): Promise<RzdAnalyticsSummary> {
  const { sql, params } = buildFilterClause(filters);
  const res = await pool.query(
    `SELECT
      COUNT(*)::int AS record_count,
      COALESCE(SUM(r.volume), 0)::float AS total_volume,
      COUNT(DISTINCT r.origin_station_id || '|' || r.dest_station_id || '|' || r.cargo_code)::int AS route_count
     FROM rzd_analytics_records r ${sql}`,
    params,
  );
  const row = res.rows[0];
  const batchesRes = await pool.query('SELECT COUNT(*)::int AS c FROM rzd_import_batches');
  const stationsRes = await pool.query('SELECT COUNT(*)::int AS c FROM rzd_stations');
  return {
    record_count: Number(row.record_count),
    total_volume: Number(row.total_volume),
    route_count: Number(row.route_count),
    station_count: Number(stationsRes.rows[0].c),
    batch_count: Number(batchesRes.rows[0].c),
  };
}

export async function getRzdAggregatedRoutes(filters: RzdAnalyticsFilters = {}, limit = 500): Promise<RzdAggregatedRoute[]> {
  const { sql, params } = buildFilterClause(filters);
  const res = await pool.query(
    `SELECT
      r.origin_station_id,
      r.dest_station_id,
      os.name AS origin_name,
      ds.name AS dest_name,
      os.latitude AS origin_lat,
      os.longitude AS origin_lng,
      ds.latitude AS dest_lat,
      ds.longitude AS dest_lng,
      os.region AS origin_region,
      ds.region AS dest_region,
      r.cargo_code,
      MAX(r.cargo_name) AS cargo_name,
      COUNT(*)::int AS shipment_count,
      SUM(r.volume)::float AS total_volume
     FROM rzd_analytics_records r
     JOIN rzd_stations os ON os.id = r.origin_station_id
     JOIN rzd_stations ds ON ds.id = r.dest_station_id
     ${sql}
     GROUP BY r.origin_station_id, r.dest_station_id, os.name, ds.name,
              os.latitude, os.longitude, ds.latitude, ds.longitude,
              os.region, ds.region, r.cargo_code
     ORDER BY total_volume DESC
     LIMIT $${params.length + 1}`,
    [...params, limit],
  );
  return res.rows.map(row => ({
    origin_station_id: String(row.origin_station_id),
    dest_station_id: String(row.dest_station_id),
    origin_name: String(row.origin_name),
    dest_name: String(row.dest_name),
    origin_lat: Number(row.origin_lat),
    origin_lng: Number(row.origin_lng),
    dest_lat: Number(row.dest_lat),
    dest_lng: Number(row.dest_lng),
    origin_region: row.origin_region != null ? String(row.origin_region) : undefined,
    dest_region: row.dest_region != null ? String(row.dest_region) : undefined,
    cargo_code: row.cargo_code != null ? String(row.cargo_code) : undefined,
    cargo_name: row.cargo_name != null ? String(row.cargo_name) : undefined,
    shipment_count: Number(row.shipment_count),
    total_volume: Number(row.total_volume),
  }));
}

export async function getRzdAnalyticsRecords(
  filters: RzdAnalyticsFilters = {},
  page = 1,
  pageSize = 50,
): Promise<{ records: RzdAnalyticsRecord[]; total: number }> {
  const { sql, params } = buildFilterClause(filters);
  const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM rzd_analytics_records r ${sql}`, params);
  const offset = (page - 1) * pageSize;
  const res = await pool.query(
    `SELECT r.* FROM rzd_analytics_records r ${sql}
     ORDER BY r.shipment_date DESC, r.volume DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset],
  );
  return {
    records: res.rows.map(mapRecord),
    total: Number(countRes.rows[0].c),
  };
}

export async function getRzdImportBatches(): Promise<RzdImportBatch[]> {
  const res = await pool.query('SELECT * FROM rzd_import_batches ORDER BY created_at DESC LIMIT 50');
  return res.rows.map(mapBatch);
}

export async function getRzdFilterOptions(): Promise<{
  cargo_codes: { code: string; name: string; count: number }[];
  origin_regions: string[];
  dest_regions: string[];
}> {
  const cargoRes = await pool.query(
    `SELECT cargo_code AS code, MAX(cargo_name) AS name, COUNT(*)::int AS count
     FROM rzd_analytics_records WHERE cargo_code IS NOT NULL
     GROUP BY cargo_code ORDER BY count DESC LIMIT 100`,
  );
  const originRes = await pool.query(
    `SELECT DISTINCT origin_region FROM rzd_analytics_records
     WHERE origin_region IS NOT NULL AND origin_region <> '' ORDER BY 1 LIMIT 100`,
  );
  const destRes = await pool.query(
    `SELECT DISTINCT dest_region FROM rzd_analytics_records
     WHERE dest_region IS NOT NULL AND dest_region <> '' ORDER BY 1 LIMIT 100`,
  );
  return {
    cargo_codes: cargoRes.rows.map(r => ({ code: String(r.code), name: String(r.name), count: Number(r.count) })),
    origin_regions: originRes.rows.map(r => String(r.origin_region)),
    dest_regions: destRes.rows.map(r => String(r.dest_region)),
  };
}

export async function getRzdStations(filters: RzdAnalyticsFilters = {}): Promise<RzdStation[]> {
  const { sql, params } = buildFilterClause(filters);
  const res = await pool.query(
    `SELECT DISTINCT s.* FROM rzd_stations s
     JOIN rzd_analytics_records r ON r.origin_station_id = s.id OR r.dest_station_id = s.id
     ${sql}
     ORDER BY s.name LIMIT 300`,
    params,
  );
  return res.rows.map(mapStation);
}
