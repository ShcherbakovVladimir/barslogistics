import { pool } from "../db.js";
import type {
  CargoStatus,
  Factory,
  ShipmentEvent,
  ShipmentEventSource,
  SupplyLink,
  TelemetryPoint,
  TelemetrySettings,
  ThirdPartyCarrier,
} from "../../src/types.js";
import { getNestedValue } from "./helpers.js";
import { getTelemetrySettings, setTelemetrySyncResult } from "./settings.js";
import { fetchCarrierShipments, mapCarrierRow, type CarrierRow } from "./carriers.js";
import { getSupplyLinkById, getSupplyLinksByIds } from "../repositories.js";
import { recordTelemetryAuditEvent } from "../shipmentEvents.js";
import { checkEtaOverdueShipments, type EtaDelayResult } from "../etaCheck.js";

export type TelemetryUpdate = {
  id: string;
  current_lat: number;
  current_lng: number;
  progress_pct: number;
  speed_kmh?: number;
  status: string;
  arrived_now?: boolean;
  cargo_type?: string;
  status_changed?: boolean;
  previous_status?: string;
  event?: ShipmentEvent;
};

export type TelemetryTickResult = {
  updates: TelemetryUpdate[];
  etaDelays: EtaDelayResult[];
};

type ShipmentContext = {
  id: string;
  origin_id: string;
  destination_id: string;
  status: string | null;
  progress_pct: number | null;
};

const STATUS_MAP: Record<string, CargoStatus> = {
  en_route: "en_route",
  in_transit: "en_route",
  transit: "en_route",
  moving: "en_route",
  delayed: "delayed",
  delay: "delayed",
  arrived: "arrived",
  delivered: "arrived",
  complete: "arrived",
  completed: "arrived",
  loading: "loading",
  load: "loading",
};

function normalizeStatus(raw: unknown): CargoStatus | null {
  if (typeof raw !== "string") return null;
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key] || null;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickField(record: Record<string, unknown>, field: string): unknown {
  if (!field) return undefined;
  if (field.includes(".")) return getNestedValue(record, field);
  return record[field] ?? record[field.toLowerCase()];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRouteProgress(
  origin: Factory,
  destination: Factory,
  lat: number,
  lng: number
): number {
  const total = haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
  if (total < 0.01) return 100;
  const traveled = haversineKm(origin.latitude, origin.longitude, lat, lng);
  return Math.min(100, Math.max(0, Math.round((traveled / total) * 100)));
}

function extractPoint(
  record: Record<string, unknown>,
  settings: TelemetrySettings,
  carrier?: CarrierRow
): TelemetryPoint | null {
  const latField = carrier?.lat_field || settings.lat_field;
  const lngField = carrier?.lng_field || settings.lng_field;
  const speedField = carrier?.speed_field || settings.speed_field;
  const idField = carrier?.id_field || settings.id_field;

  const lat = toNumber(pickField(record, latField) ?? record.latitude ?? record.current_lat);
  const lng = toNumber(pickField(record, lngField) ?? record.longitude ?? record.current_lng);
  if (lat == null || lng == null) return null;

  const externalId = pickField(record, idField);
  const trackerId = record.tracker_id ?? record.device_id ?? record.imei;
  const shipmentId = record.shipment_id ?? record.shipmentId;

  return {
    shipment_id: shipmentId != null ? String(shipmentId) : undefined,
    external_tracking_id: externalId != null ? String(externalId) : undefined,
    tracker_id: trackerId != null ? String(trackerId) : undefined,
    lat,
    lng,
    speed_kmh: toNumber(pickField(record, speedField) ?? record.speed) ?? undefined,
    status: typeof pickField(record, carrier?.status_field || "status") === "string"
      ? String(pickField(record, carrier?.status_field || "status"))
      : undefined,
    progress_pct: toNumber(record.progress_pct ?? record.progress) ?? undefined,
  };
}

async function resolveShipmentIdsBatch(points: TelemetryPoint[]): Promise<Map<TelemetryPoint, string>> {
  const result = new Map<TelemetryPoint, string>();
  const candidates = new Set<string>();

  for (const point of points) {
    for (const id of [point.shipment_id, point.external_tracking_id, point.tracker_id]) {
      if (id) candidates.add(id);
    }
  }
  if (candidates.size === 0) return result;

  const candidateList = [...candidates];
  const { rows } = await pool.query<{ id: string; external_tracking_id: string | null; tracker_id: string | null }>(
    `SELECT id, external_tracking_id, tracker_id FROM supply_links
     WHERE id = ANY($1::text[])
        OR external_tracking_id = ANY($1::text[])
        OR tracker_id = ANY($1::text[])`,
    [candidateList],
  );

  const lookup = new Map<string, string>();
  for (const row of rows) {
    lookup.set(row.id, row.id);
    if (row.external_tracking_id) lookup.set(row.external_tracking_id, row.id);
    if (row.tracker_id) lookup.set(row.tracker_id, row.id);
  }

  for (const point of points) {
    for (const id of [point.shipment_id, point.external_tracking_id, point.tracker_id]) {
      if (!id) continue;
      const shipmentId = lookup.get(id);
      if (shipmentId) {
        result.set(point, shipmentId);
        break;
      }
    }
  }

  return result;
}

async function loadShipmentContextsBatch(
  shipmentIds: string[],
): Promise<Map<string, ShipmentContext & { cargo_type: string | null }>> {
  if (shipmentIds.length === 0) return new Map();
  const { rows } = await pool.query<ShipmentContext & { cargo_type: string | null }>(
    "SELECT id, origin_id, destination_id, status, progress_pct, cargo_type FROM supply_links WHERE id = ANY($1::text[])",
    [shipmentIds],
  );
  return new Map(rows.map(row => [row.id, row]));
}

async function resolveShipmentId(point: TelemetryPoint): Promise<string | null> {
  const map = await resolveShipmentIdsBatch([point]);
  return map.get(point) ?? null;
}

async function loadShipmentContext(shipmentId: string): Promise<(ShipmentContext & { cargo_type: string | null }) | null> {
  const { rows } = await pool.query<ShipmentContext & { cargo_type: string | null }>(
    "SELECT id, origin_id, destination_id, status, progress_pct, cargo_type FROM supply_links WHERE id = $1",
    [shipmentId]
  );
  return rows[0] ?? null;
}

async function loadFactoryMap(): Promise<Map<string, Factory>> {
  const { rows } = await pool.query<Factory>("SELECT * FROM factories");
  return new Map(rows.map((f) => [f.id, f]));
}

export type ApplyTelemetryOptions = {
  eventSource?: ShipmentEventSource;
  /** When syncing from a carrier API, link carrier_id and external_tracking_id on first match */
  carrierId?: string;
};

async function applyTelemetryPointCore(
  point: TelemetryPoint,
  shipmentId: string,
  shipment: ShipmentContext & { cargo_type: string | null },
  cfg: TelemetrySettings,
  factoryMap: Map<string, Factory>,
  options?: ApplyTelemetryOptions,
  existingLink?: SupplyLink,
): Promise<TelemetryUpdate | null> {
  const previousStatus = shipment.status || "en_route";
  let status = normalizeStatus(point.status) || (shipment.status as CargoStatus) || "en_route";
  let progress = point.progress_pct ?? shipment.progress_pct ?? 0;

  if (cfg.calculate_progress) {
    const origin = factoryMap.get(shipment.origin_id);
    const destination = factoryMap.get(shipment.destination_id);
    if (origin && destination) {
      progress = calculateRouteProgress(origin, destination, point.lat, point.lng);
      if (progress >= cfg.arrived_threshold_pct && status === "en_route") {
        status = "arrived";
        progress = 100;
      }
    }
  }

  const trackingRef = point.external_tracking_id ?? point.tracker_id ?? point.shipment_id ?? null;

  const { rows } = await pool.query<{
    id: string;
    current_lat: number;
    current_lng: number;
    progress_pct: number;
    speed_kmh: number | null;
    status: string;
  }>(
    `UPDATE supply_links
     SET current_lat = $2,
         current_lng = $3,
         speed_kmh = COALESCE($4, speed_kmh),
         progress_pct = $5,
         status = $6,
         carrier_id = COALESCE(carrier_id, $7),
         external_tracking_id = COALESCE(external_tracking_id, $8),
         last_updated = NOW()
     WHERE id = $1
     RETURNING id, current_lat, current_lng, progress_pct, speed_kmh, status`,
    [
      shipmentId,
      point.lat,
      point.lng,
      point.speed_kmh ?? null,
      progress,
      status,
      options?.carrierId ?? null,
      trackingRef,
    ],
  );

  const row = rows[0];
  if (!row) return null;

  const update: TelemetryUpdate = {
    id: row.id,
    current_lat: Number(row.current_lat),
    current_lng: Number(row.current_lng),
    progress_pct: Number(row.progress_pct),
    speed_kmh: row.speed_kmh != null ? Number(row.speed_kmh) : undefined,
    status: row.status,
    arrived_now: row.status === "arrived" && previousStatus !== "arrived",
    cargo_type: shipment.cargo_type || undefined,
  };

  if (status !== previousStatus) {
    const existing = existingLink ?? await getSupplyLinkById(shipmentId);
    if (existing) {
      update.status_changed = true;
      update.previous_status = previousStatus;
      update.event = await recordTelemetryAuditEvent({
        shipmentId,
        oldStatus: previousStatus as CargoStatus,
        newStatus: status,
        lat: point.lat,
        lng: point.lng,
        speed_kmh: point.speed_kmh,
        progress_pct: progress,
        existing,
        source: options?.eventSource ?? "telemetry",
      });
    }
  }

  return update;
}

export async function applyTelemetryPoint(
  point: TelemetryPoint,
  settings?: TelemetrySettings,
  options?: ApplyTelemetryOptions,
): Promise<TelemetryUpdate | null> {
  const cfg = settings ?? (await getTelemetrySettings());
  const shipmentId = await resolveShipmentId(point);
  if (!shipmentId) return null;

  const shipment = await loadShipmentContext(shipmentId);
  if (!shipment) return null;

  const factoryMap = cfg.calculate_progress ? await loadFactoryMap() : new Map<string, Factory>();
  return applyTelemetryPointCore(point, shipmentId, shipment, cfg, factoryMap, options);
}

export async function processTelemetryPoints(points: TelemetryPoint[]): Promise<TelemetryUpdate[]> {
  const settings = await getTelemetrySettings();
  const validPoints = points.filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (validPoints.length === 0) return [];

  const shipmentIdByPoint = await resolveShipmentIdsBatch(validPoints);
  const shipmentIds = [...new Set(shipmentIdByPoint.values())];
  const [contexts, factoryMap, existingLinks] = await Promise.all([
    loadShipmentContextsBatch(shipmentIds),
    settings.calculate_progress ? loadFactoryMap() : Promise.resolve(new Map<string, Factory>()),
    getSupplyLinksByIds(shipmentIds),
  ]);
  const linkById = new Map(existingLinks.map(link => [link.id, link]));

  const updates: TelemetryUpdate[] = [];
  for (const point of validPoints) {
    const shipmentId = shipmentIdByPoint.get(point);
    if (!shipmentId) continue;
    const shipment = contexts.get(shipmentId);
    if (!shipment) continue;
    const update = await applyTelemetryPointCore(
      point,
      shipmentId,
      shipment,
      settings,
      factoryMap,
      undefined,
      linkById.get(shipmentId),
    );
    if (update) updates.push(update);
  }

  return updates;
}

export type CarrierSyncResult = {
  carrier: ThirdPartyCarrier;
  updates: TelemetryUpdate[];
  recordsFetched: number;
  message: string;
};

async function applyCarrierShipmentRecords(
  carrier: CarrierRow,
  settings: TelemetrySettings,
): Promise<{ updates: TelemetryUpdate[]; recordsFetched: number }> {
  const shipments = await fetchCarrierShipments(carrier);
  const updates: TelemetryUpdate[] = [];

  for (const item of shipments) {
    if (!item || typeof item !== "object") continue;
    const point = extractPoint(item as Record<string, unknown>, settings, carrier);
    if (!point) continue;
    const update = await applyTelemetryPoint(point, settings, {
      eventSource: "carrier",
      carrierId: carrier.id,
    });
    if (update) updates.push(update);
  }

  return { updates, recordsFetched: shipments.length };
}

/** Pull GPS/status from one carrier API through applyTelemetryPoint + shipment_events audit. */
export async function syncCarrierById(carrierId: string): Promise<CarrierSyncResult> {
  const { rows } = await pool.query<CarrierRow>("SELECT * FROM carriers WHERE id = $1", [carrierId]);
  const carrier = rows[0];
  if (!carrier) throw new Error("Carrier not found");
  if (carrier.is_active === false) throw new Error("Carrier is inactive");
  if (carrier.enabled === false) throw new Error("Carrier integration is disabled");

  await pool.query(
    "UPDATE carriers SET status = 'syncing', last_sync_status = 'running' WHERE id = $1",
    [carrierId],
  );

  try {
    const settings = await getTelemetrySettings();
    const { updates, recordsFetched } = await applyCarrierShipmentRecords(carrier, settings);

    await pool.query(
      `UPDATE carriers SET
        status = 'connected',
        last_sync = NOW(),
        active_shipments_count = $2,
        last_error = NULL,
        last_sync_status = $3
       WHERE id = $1`,
      [carrierId, recordsFetched, `OK: ${updates.length} updated`],
    );

    const { rows: updatedRows } = await pool.query<CarrierRow>("SELECT * FROM carriers WHERE id = $1", [carrierId]);
    return {
      carrier: mapCarrierRow(updatedRows[0]),
      updates,
      recordsFetched,
      message: `Synced ${recordsFetched} records, updated ${updates.length} shipments`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await pool.query(
      "UPDATE carriers SET status = 'error', last_error = $2, last_sync_status = $2, last_sync = NOW() WHERE id = $1",
      [carrierId, msg],
    );
    const { rows: errRows } = await pool.query<CarrierRow>("SELECT * FROM carriers WHERE id = $1", [carrierId]);
    throw Object.assign(new Error(msg), { carrier: mapCarrierRow(errRows[0]) });
  }
}

export async function syncCarriersTelemetry(): Promise<TelemetryUpdate[]> {
  const settings = await getTelemetrySettings();
  const { rows: carriers } = await pool.query<CarrierRow>(
    "SELECT * FROM carriers WHERE enabled IS DISTINCT FROM FALSE AND api_endpoint IS NOT NULL AND api_endpoint <> ''",
  );

  const allUpdates: TelemetryUpdate[] = [];

  for (const carrier of carriers) {
    try {
      const { updates, recordsFetched } = await applyCarrierShipmentRecords(carrier, settings);
      allUpdates.push(...updates);

      await pool.query(
        `UPDATE carriers SET
          status = 'connected',
          last_sync = NOW(),
          active_shipments_count = $2,
          last_error = NULL,
          last_sync_status = $3
         WHERE id = $1`,
        [carrier.id, recordsFetched, `GPS: ${updates.length} updated`],
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await pool.query(
        "UPDATE carriers SET status = 'error', last_error = $2, last_sync_status = $2, last_sync = NOW() WHERE id = $1",
        [carrier.id, msg],
      );
    }
  }

  return allUpdates;
}

export async function runTelemetrySync(): Promise<TelemetryUpdate[]> {
  const settings = await getTelemetrySettings();
  if (!settings.enabled) return [];

  try {
    let updates: TelemetryUpdate[] = [];
    if (settings.sync_carriers) {
      updates = await syncCarriersTelemetry();
    }
    await setTelemetrySyncResult(updates.length);
    return updates;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await setTelemetrySyncResult(0, msg);
    throw error;
  }
}

export function verifyWebhookSecret(headerValue: string | undefined, settings: TelemetrySettings): boolean {
  if (!settings.webhook_enabled) return false;
  if (!settings.webhook_secret) return false;
  return headerValue === settings.webhook_secret;
}

export function parseWebhookBody(body: unknown): TelemetryPoint[] {
  if (!body || typeof body !== "object") return [];

  const payload = body as Record<string, unknown>;
  const rawPoints = Array.isArray(payload.points)
    ? payload.points
    : Array.isArray(payload.shipments)
      ? payload.shipments
      : Array.isArray(payload.data)
        ? payload.data
        : [payload];

  const points: TelemetryPoint[] = [];
  for (const item of rawPoints) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const lat = toNumber(record.lat ?? record.latitude ?? record.current_lat);
    const lng = toNumber(record.lng ?? record.longitude ?? record.current_lng);
    if (lat == null || lng == null) continue;
    points.push({
      shipment_id: record.shipment_id != null ? String(record.shipment_id) : undefined,
      external_tracking_id: record.external_tracking_id != null
        ? String(record.external_tracking_id)
        : record.id != null ? String(record.id) : undefined,
      tracker_id: record.tracker_id != null ? String(record.tracker_id) : undefined,
      lat,
      lng,
      speed_kmh: toNumber(record.speed_kmh ?? record.speed) ?? undefined,
      status: typeof record.status === "string" ? record.status : undefined,
      progress_pct: toNumber(record.progress_pct ?? record.progress) ?? undefined,
    });
  }
  return points;
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null;

export function startTelemetryScheduler(
  onTick: (result: TelemetryTickResult) => void | Promise<void>,
): void {
  if (schedulerTimer) return;

  const tick = async () => {
    try {
      const settings = await getTelemetrySettings();
      if (!settings.enabled) return;
      const updates = await runTelemetrySync();
      const etaDelays = await checkEtaOverdueShipments();
      if (updates.length > 0 || etaDelays.length > 0) {
        await onTick({ updates, etaDelays });
      }
    } catch (error) {
      console.error("Telemetry sync error:", error);
    }
  };

  void getTelemetrySettings().then((settings) => {
    const intervalMs = Math.max(10, settings.poll_interval_sec) * 1000;
    console.log(`Telemetry scheduler: real GPS sync every ${settings.poll_interval_sec}s`);
    void tick();
    schedulerTimer = setInterval(() => void tick(), intervalMs);
  });
}

export function stopTelemetryScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
