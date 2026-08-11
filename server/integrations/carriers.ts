import { pool } from "../db.js";
import type {
  ThirdPartyCarrier,
  CarrierCategory,
  CarrierInput,
  CarrierIntegrationSpec,
  CarrierSettingsUpdate,
} from "../../src/types.js";
import { getNestedValue } from "./helpers.js";

export type CarrierRow = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  status: string | null;
  last_sync: Date | string | null;
  active_shipments_count: number | null;
  api_endpoint: string | null;
  enabled: boolean | null;
  api_key: string | null;
  auth_type: string | null;
  sync_path: string | null;
  id_field: string | null;
  status_field: string | null;
  lat_field: string | null;
  lng_field: string | null;
  speed_field: string | null;
  last_error: string | null;
  last_sync_status: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  description: string | null;
};

export function mapCarrierRow(row: CarrierRow): ThirdPartyCarrier {
  const category = (row.category as CarrierCategory) || "other";
  return {
    id: row.id,
    name: row.name,
    code: row.code || "",
    category,
    status: (row.status as ThirdPartyCarrier["status"]) || "connected",
    last_sync: row.last_sync ? new Date(row.last_sync).toISOString() : new Date().toISOString(),
    active_shipments_count: row.active_shipments_count ?? 0,
    api_endpoint: row.api_endpoint || "",
    enabled: row.enabled ?? true,
    auth_type: (row.auth_type as ThirdPartyCarrier["auth_type"]) || "bearer",
    sync_path: row.sync_path || "",
    id_field: row.id_field || "id",
    status_field: row.status_field || "status",
    lat_field: row.lat_field || "lat",
    lng_field: row.lng_field || "lng",
    speed_field: row.speed_field || "speed_kmh",
    api_key_set: Boolean(row.api_key),
    last_error: row.last_error || undefined,
    last_sync_status: row.last_sync_status || undefined,
    sort_order: row.sort_order ?? 0,
    is_active: row.is_active !== false,
    description: row.description || undefined,
  };
}

function buildAuthHeaders(carrier: CarrierRow): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!carrier.api_key || carrier.auth_type === "none") return headers;

  switch (carrier.auth_type) {
    case "bearer":
      headers.Authorization = `Bearer ${carrier.api_key}`;
      break;
    case "header":
      headers["X-API-Key"] = carrier.api_key;
      break;
    default:
      break;
  }
  return headers;
}

function buildUrl(carrier: CarrierRow): string {
  if (!carrier.api_endpoint) throw new Error("API endpoint not configured");
  if (carrier.auth_type === "query" && carrier.api_key) {
    const url = new URL(carrier.api_endpoint);
    url.searchParams.set("api_key", carrier.api_key);
    return url.toString();
  }
  return carrier.api_endpoint;
}

export async function fetchCarrierShipments(carrier: CarrierRow): Promise<Record<string, unknown>[]> {
  if (!carrier.api_endpoint) throw new Error("API endpoint not configured");

  const res = await fetch(buildUrl(carrier), {
    method: "GET",
    headers: buildAuthHeaders(carrier),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = await res.json();
  const shipmentsRaw = getNestedValue(json, carrier.sync_path || "") ?? json;
  return Array.isArray(shipmentsRaw) ? shipmentsRaw as Record<string, unknown>[] : [];
}

export async function updateCarrierSettings(
  carrierId: string,
  data: CarrierSettingsUpdate,
): Promise<ThirdPartyCarrier> {
  const { rows: existing } = await pool.query<CarrierRow>("SELECT * FROM carriers WHERE id = $1", [carrierId]);
  if (!existing[0]) throw new Error("Carrier not found");

  const apiKey = data.api_key?.startsWith("****") ? existing[0].api_key : data.api_key;

  await pool.query(
    `UPDATE carriers SET
      name = COALESCE($2, name),
      code = COALESCE($3, code),
      category = COALESCE($4, category),
      description = COALESCE($5, description),
      sort_order = COALESCE($6, sort_order),
      is_active = COALESCE($7, is_active),
      api_endpoint = COALESCE($8, api_endpoint),
      api_key = COALESCE($9, api_key),
      enabled = COALESCE($10, enabled),
      auth_type = COALESCE($11, auth_type),
      sync_path = COALESCE($12, sync_path),
      id_field = COALESCE($13, id_field),
      status_field = COALESCE($14, status_field),
      lat_field = COALESCE($15, lat_field),
      lng_field = COALESCE($16, lng_field),
      speed_field = COALESCE($17, speed_field)
     WHERE id = $1`,
    [
      carrierId,
      data.name ?? null,
      data.code ?? null,
      data.category ?? null,
      data.description ?? null,
      data.sort_order ?? null,
      data.is_active ?? null,
      data.api_endpoint ?? null,
      apiKey ?? null,
      data.enabled ?? null,
      data.auth_type ?? null,
      data.sync_path ?? null,
      data.id_field ?? null,
      data.status_field ?? null,
      data.lat_field ?? null,
      data.lng_field ?? null,
      data.speed_field ?? null,
    ],
  );

  const { rows } = await pool.query<CarrierRow>("SELECT * FROM carriers WHERE id = $1", [carrierId]);
  return mapCarrierRow(rows[0]);
}

export async function getAllCarriersDetailed(activeOnly = false): Promise<ThirdPartyCarrier[]> {
  const sql = activeOnly
    ? `SELECT * FROM carriers WHERE is_active IS DISTINCT FROM FALSE ORDER BY sort_order, name`
    : `SELECT * FROM carriers ORDER BY sort_order, name`;
  const { rows } = await pool.query<CarrierRow>(sql);
  return rows.map(mapCarrierRow);
}

export async function getCarrierByIdDetailed(carrierId: string): Promise<ThirdPartyCarrier | null> {
  const { rows } = await pool.query<CarrierRow>("SELECT * FROM carriers WHERE id = $1", [carrierId]);
  return rows[0] ? mapCarrierRow(rows[0]) : null;
}

export async function createCarrier(input: CarrierInput): Promise<ThirdPartyCarrier> {
  const { rows } = await pool.query<CarrierRow>(
    `INSERT INTO carriers (
      id, name, code, category, description, sort_order, is_active,
      status, api_endpoint, enabled, auth_type, sync_path,
      id_field, status_field, lat_field, lng_field, speed_field, api_key,
      last_sync, active_shipments_count
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'connected',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),0)
    RETURNING *`,
    [
      input.id,
      input.name.trim(),
      input.code.trim().toUpperCase(),
      input.category,
      input.description?.trim() || "",
      input.sort_order ?? 0,
      input.is_active !== false,
      input.api_endpoint?.trim() || "",
      input.enabled !== false,
      input.auth_type || "bearer",
      input.sync_path || "",
      input.id_field || "id",
      input.status_field || "status",
      input.lat_field || "lat",
      input.lng_field || "lng",
      input.speed_field || "speed_kmh",
      input.api_key || null,
    ],
  );
  return mapCarrierRow(rows[0]);
}

export async function deleteCarrier(id: string): Promise<{ ok: boolean; error?: string; soft?: boolean }> {
  const existing = await getCarrierByIdDetailed(id);
  if (!existing) return { ok: false, error: "Carrier not found" };

  const usage = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM supply_links WHERE carrier_id = $1`,
    [id],
  );
  const inUse = Number(usage.rows[0].count) > 0;

  if (inUse) {
    await pool.query(`UPDATE carriers SET is_active = FALSE, enabled = FALSE WHERE id = $1`, [id]);
    return { ok: true, soft: true };
  }

  await pool.query(`DELETE FROM carriers WHERE id = $1`, [id]);
  return { ok: true, soft: false };
}

export function buildCarrierIntegrationSpec(
  carrier: ThirdPartyCarrier,
  baseUrl: string,
): CarrierIntegrationSpec {
  const origin = baseUrl.replace(/\/$/, "");
  return {
    id: carrier.id,
    name: carrier.name,
    code: carrier.code,
    category: carrier.category,
    enabled: carrier.enabled !== false,
    api_endpoint: carrier.api_endpoint,
    auth_type: carrier.auth_type || "bearer",
    sync_path: carrier.sync_path || "",
    id_field: carrier.id_field || "id",
    status_field: carrier.status_field || "status",
    lat_field: carrier.lat_field || "lat",
    lng_field: carrier.lng_field || "lng",
    speed_field: carrier.speed_field || "speed_kmh",
    pull_sync_url: `${origin}/api/integrations/carriers/sync`,
    telemetry_push_url: `${origin}/api/telemetry/push`,
    telemetry_webhook_url: `${origin}/api/telemetry/webhook`,
    openapi_url: `${origin}/api/openapi.json`,
  };
}

export async function refreshCarrierShipmentCounts(): Promise<void> {
  await pool.query(`
    UPDATE carriers c SET active_shipments_count = sub.cnt
    FROM (
      SELECT carrier_id, COUNT(*)::int AS cnt
      FROM supply_links
      WHERE carrier_id IS NOT NULL AND status IN ('en_route', 'delayed', 'loading')
      GROUP BY carrier_id
    ) sub
    WHERE c.id = sub.carrier_id
  `);
}
