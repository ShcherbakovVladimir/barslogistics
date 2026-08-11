import type { PoolClient } from "pg";
import type { Factory, SupplyLink, FactoryType, CargoStatus, MapDataImportResult, MapDataSettings } from "../../src/types.js";
import { cleanRefId } from "../../src/data/initialData.js";
import { pool } from "../db.js";
import { getNestedValue } from "./helpers.js";
import { getMapDataSettings, updateMapDataSettingsState } from "./settings.js";
import { resolveEtaFields } from "../etaUtils.js";

const FACTORY_TYPES = new Set<FactoryType>(["gok", "port", "steel_mill", "slag_dump", "coal_mine"]);
const LINK_SOURCES = new Set<SupplyLink["source"]>(["own", "rzd"]);
const CARGO_STATUSES = new Set<CargoStatus>(["en_route", "delayed", "arrived", "loading", "alert"]);

export type MapDataImportMode = "merge" | "replace";

export interface MapDataPayload {
  factories?: unknown[];
  supply_links?: unknown[];
  supplyLinks?: unknown[];
  shipments?: unknown[];
}

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function asString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

export function normalizeFactory(raw: unknown): { factory: Factory | null; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { factory: null, error: "Invalid factory record" };
  }

  const o = raw as Record<string, unknown>;
  const id = asString(pick(o, "id"));
  const name = asString(pick(o, "name"));
  const type = asString(pick(o, "type")) as FactoryType;
  const latitude = asNumber(pick(o, "latitude", "lat"));
  const longitude = asNumber(pick(o, "longitude", "lng", "lon"));

  if (!id || !name) return { factory: null, error: `Factory missing id or name` };
  if (!FACTORY_TYPES.has(type)) return { factory: null, error: `Factory ${id}: invalid type "${type}"` };
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { factory: null, error: `Factory ${id}: missing coordinates` };
  }

  return {
    factory: {
      id,
      name,
      type,
      latitude,
      longitude,
      region: asString(pick(o, "region")),
      country: asString(pick(o, "country")),
      is_ours: asBool(pick(o, "is_ours", "isOurs")),
      description: asString(pick(o, "description")),
      holding: asString(pick(o, "holding")),
    },
  };
}

export function normalizeSupplyLink(raw: unknown): { link: SupplyLink | null; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { link: null, error: "Invalid supply link record" };
  }

  const o = raw as Record<string, unknown>;
  const id = asString(pick(o, "id"));
  const origin_id = cleanRefId(asString(pick(o, "origin_id", "originId", "originID")));
  const destination_id = cleanRefId(asString(pick(o, "destination_id", "destinationId", "destinationID")));
  const cargo_type = asString(pick(o, "cargo_type", "cargoType", "cargo"));
  const volume = asNumber(pick(o, "volume"));
  const source = asString(pick(o, "source"), "own") as SupplyLink["source"];

  if (!id) return { link: null, error: "Supply link missing id" };
  if (!origin_id || !destination_id) {
    return { link: null, error: `Route ${id}: missing origin_id or destination_id` };
  }
  if (!cargo_type) return { link: null, error: `Route ${id}: missing cargo_type` };
  if (!LINK_SOURCES.has(source)) return { link: null, error: `Route ${id}: invalid source "${source}"` };

  const statusRaw = asString(pick(o, "status"), "");
  const status = statusRaw && CARGO_STATUSES.has(statusRaw as CargoStatus)
    ? (statusRaw as CargoStatus)
    : undefined;

  const etaRaw = asString(pick(o, "eta")) || undefined;
  const etaAtRaw = asString(pick(o, "eta_at", "etaAt")) || undefined;
  const etaResolved = etaAtRaw
    ? { eta: etaRaw ?? null, eta_at: new Date(etaAtRaw) }
    : etaRaw
      ? resolveEtaFields(etaRaw)
      : { eta: null, eta_at: null };
  const etaAt =
    etaResolved.eta_at && !Number.isNaN(etaResolved.eta_at.getTime())
      ? etaResolved.eta_at.toISOString()
      : undefined;

  return {
    link: {
      id,
      origin_id,
      destination_id,
      cargo_type,
      volume,
      unit: asString(pick(o, "unit"), "т"),
      source,
      period: asString(pick(o, "period"), "2025"),
      status,
      current_lat: pick(o, "current_lat", "currentLat", "lat") != null
        ? asNumber(pick(o, "current_lat", "currentLat", "lat"))
        : undefined,
      current_lng: pick(o, "current_lng", "currentLng", "lng") != null
        ? asNumber(pick(o, "current_lng", "currentLng", "lng"))
        : undefined,
      speed_kmh: pick(o, "speed_kmh", "speedKmh", "speed") != null
        ? asNumber(pick(o, "speed_kmh", "speedKmh", "speed"))
        : undefined,
      progress_pct: pick(o, "progress_pct", "progressPct", "progress") != null
        ? asNumber(pick(o, "progress_pct", "progressPct", "progress"))
        : undefined,
      eta: etaResolved.eta ?? etaRaw,
      eta_at: etaAt,
      carrier_name: asString(pick(o, "carrier_name", "carrierName")) || undefined,
      driver_info: asString(pick(o, "driver_info", "driverInfo")) || undefined,
      delay_reason: asString(pick(o, "delay_reason", "delayReason")) || undefined,
      last_updated: asString(pick(o, "last_updated", "lastUpdated")) || undefined,
      external_tracking_id: asString(pick(o, "external_tracking_id", "externalTrackingId")) || undefined,
      tracker_id: asString(pick(o, "tracker_id", "trackerId")) || undefined,
    },
  };
}

export function parseMapDataPayload(body: unknown): MapDataPayload {
  if (!body || typeof body !== "object") return {};
  const root = body as Record<string, unknown>;
  const data = root.data && typeof root.data === "object"
    ? (root.data as Record<string, unknown>)
    : root;

  return {
    factories: Array.isArray(data.factories) ? data.factories : undefined,
    supply_links: Array.isArray(data.supply_links)
      ? data.supply_links
      : Array.isArray(data.supplyLinks)
        ? data.supplyLinks
        : Array.isArray(data.shipments)
          ? data.shipments
          : undefined,
  };
}

async function upsertSupplyLink(client: PoolClient, link: SupplyLink): Promise<void> {
  await client.query(
    `INSERT INTO supply_links (
      id, origin_id, destination_id, cargo_type, volume, unit, period, status,
      progress_pct, current_lat, current_lng, speed_kmh, eta, eta_at, carrier_name,
      driver_info, delay_reason, source, last_updated, external_tracking_id, tracker_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON CONFLICT (id) DO UPDATE SET
      origin_id = EXCLUDED.origin_id,
      destination_id = EXCLUDED.destination_id,
      cargo_type = EXCLUDED.cargo_type,
      volume = EXCLUDED.volume,
      unit = EXCLUDED.unit,
      period = EXCLUDED.period,
      status = COALESCE(EXCLUDED.status, supply_links.status),
      progress_pct = COALESCE(EXCLUDED.progress_pct, supply_links.progress_pct),
      current_lat = COALESCE(EXCLUDED.current_lat, supply_links.current_lat),
      current_lng = COALESCE(EXCLUDED.current_lng, supply_links.current_lng),
      speed_kmh = COALESCE(EXCLUDED.speed_kmh, supply_links.speed_kmh),
      eta = COALESCE(EXCLUDED.eta, supply_links.eta),
      eta_at = COALESCE(EXCLUDED.eta_at, supply_links.eta_at),
      carrier_name = COALESCE(EXCLUDED.carrier_name, supply_links.carrier_name),
      driver_info = COALESCE(EXCLUDED.driver_info, supply_links.driver_info),
      delay_reason = COALESCE(EXCLUDED.delay_reason, supply_links.delay_reason),
      source = EXCLUDED.source,
      last_updated = COALESCE(EXCLUDED.last_updated::timestamptz, NOW()),
      external_tracking_id = COALESCE(EXCLUDED.external_tracking_id, supply_links.external_tracking_id),
      tracker_id = COALESCE(EXCLUDED.tracker_id, supply_links.tracker_id)`,
    [
      link.id,
      link.origin_id,
      link.destination_id,
      link.cargo_type,
      link.volume,
      link.unit,
      link.period,
      link.status ?? null,
      link.progress_pct ?? null,
      link.current_lat ?? null,
      link.current_lng ?? null,
      link.speed_kmh ?? null,
      link.eta ?? null,
      link.eta_at ?? null,
      link.carrier_name ?? null,
      link.driver_info ?? null,
      link.delay_reason ?? null,
      link.source,
      link.last_updated ?? new Date().toISOString(),
      link.external_tracking_id ?? null,
      link.tracker_id ?? null,
    ]
  );
}

export async function importMapData(
  payload: MapDataPayload,
  mode: MapDataImportMode = "merge"
): Promise<MapDataImportResult> {
  const result: MapDataImportResult = {
    mode,
    factories_upserted: 0,
    supply_links_upserted: 0,
    factories_skipped: 0,
    supply_links_skipped: 0,
    errors: [],
  };

  if ((payload.factories?.length ?? 0) > 0) {
    result.factories_skipped = payload.factories!.length;
    result.errors.push(
      "Factory import via JSON is disabled. Manage sites in Admin → Site directories (PostgreSQL).",
    );
  }

  const links: SupplyLink[] = [];
  for (const raw of payload.supply_links ?? []) {
    const { link, error } = normalizeSupplyLink(raw);
    if (link) links.push(link);
    else {
      result.supply_links_skipped += 1;
      if (error) result.errors.push(error);
    }
  }

  if (links.length === 0) {
    if (result.errors.length === 0) {
      throw new Error("No valid supply_links in payload");
    }
    return result;
  }

  const { rows } = await pool.query<{ id: string }>("SELECT id FROM factories WHERE COALESCE(is_active, TRUE) = TRUE");
  const factoryIds = new Set(rows.map(r => r.id));

  const validLinks = links.filter(link => {
    if (factoryIds.has(link.origin_id) && factoryIds.has(link.destination_id)) return true;
    result.supply_links_skipped += 1;
    result.errors.push(
      `Route ${link.id}: unknown origin_id (${link.origin_id}) or destination_id (${link.destination_id}) — add sites in the database first`,
    );
    return false;
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (mode === "replace") {
      await client.query("DELETE FROM supply_links");
    }

    for (const link of validLinks) {
      await upsertSupplyLink(client, link);
      result.supply_links_upserted += 1;
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return result;
}

function buildAuthHeaders(settings: MapDataSettings): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!settings.api_key || settings.auth_type === "none") return headers;

  switch (settings.auth_type) {
    case "bearer":
      headers.Authorization = `Bearer ${settings.api_key}`;
      break;
    case "header":
      headers["X-API-Key"] = settings.api_key;
      break;
    default:
      break;
  }
  return headers;
}

function buildFetchUrl(settings: MapDataSettings): string {
  if (!settings.api_endpoint) throw new Error("API endpoint not configured");
  if (settings.auth_type === "query" && settings.api_key) {
    const url = new URL(settings.api_endpoint);
    url.searchParams.set("api_key", settings.api_key);
    return url.toString();
  }
  return settings.api_endpoint;
}

export async function fetchMapDataFromApi(settings: MapDataSettings): Promise<MapDataPayload> {
  const res = await fetch(buildFetchUrl(settings), {
    method: "GET",
    headers: buildAuthHeaders(settings),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = await res.json();
  const root = settings.sync_path ? getNestedValue(json, settings.sync_path) : json;
  const container = root && typeof root === "object" ? (root as Record<string, unknown>) : json as Record<string, unknown>;

  const factoriesRaw = getNestedValue(container, settings.factories_path || "factories");
  const linksRaw =
    getNestedValue(container, settings.supply_links_path || "supply_links")
    ?? getNestedValue(container, "supplyLinks")
    ?? getNestedValue(container, "shipments");

  return {
    factories: Array.isArray(factoriesRaw) ? factoriesRaw : undefined,
    supply_links: Array.isArray(linksRaw) ? linksRaw : undefined,
  };
}

export async function syncMapDataFromApi(mode: MapDataImportMode = "merge"): Promise<MapDataImportResult> {
  const settings = await getMapDataSettings();
  if (!settings.enabled) throw new Error("Map data API integration is disabled");
  if (!settings.api_endpoint) throw new Error("API endpoint not configured");

  try {
    const payload = await fetchMapDataFromApi(settings);
    const result = await importMapData(payload, mode);
    await updateMapDataSettingsState({
      last_sync_at: new Date().toISOString(),
      last_error: undefined,
      last_factories_count: result.factories_upserted,
      last_links_count: result.supply_links_upserted,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await updateMapDataSettingsState({ last_error: message });
    throw error;
  }
}

export function getMapDataTemplate(): MapDataPayload {
  return {
    factories: [
      {
        id: "example_gok_001",
        name: "Пример ГОК",
        type: "gok",
        latitude: 55.75,
        longitude: 60.0,
        region: "Челябинская область",
        country: "РФ",
        is_ours: false,
        description: "Железорудный концентрат",
        holding: "",
      },
      {
        id: "example_port_001",
        name: "Пример порт",
        type: "port",
        latitude: 44.72,
        longitude: 37.78,
        region: "Краснодарский край",
        country: "РФ",
        is_ours: false,
        description: "Морской порт",
        holding: "",
      },
    ],
    supply_links: [
      {
        id: "example_route_001",
        origin_id: "example_gok_001",
        destination_id: "example_port_001",
        cargo_type: "Железорудный концентрат",
        volume: 120000,
        unit: "т",
        source: "rzd",
        period: "2025",
        status: "en_route",
      },
    ],
  };
}
