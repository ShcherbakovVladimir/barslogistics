import { pool } from "./db.js";
import { rawFactories, getCleanSupplyLinks } from "../src/data/initialData.js";
import { getServerT } from "../src/i18n/translations.js";
import { hashPassword, verifyPassword, getDefaultPassword } from "./auth.js";
import { isSeedDemoDataEnabled } from "./seedConfig.js";
import { formatEtaDisplay, resolveEtaFields } from "./etaUtils.js";
import crypto from "crypto";
import type {
  Factory,
  SupplyLink,
  EventLog,
  User,
  BackupItem,
  ThirdPartyCarrier,
  UserRole,
  UserCreateInput,
  UserUpdateInput,
  SiteCategoryInfo,
  ShipmentEvent,
  CargoStatus,
  Product,
  ProductInput,
  SalesManager,
  SalesManagerInput,
  AccountStatus,
} from "../src/types.js";
import { DEFAULT_PRODUCT_CATALOG } from "../src/constants/products.js";
import type { PoolClient } from "pg";
import { upsertSite, resolveFactoryId as resolveSiteFactoryId } from "./siteRegistry.js";
import { buildCanonicalKey } from "../src/utils/siteCanonicalKey.js";
import { buildPaginatedResult, type PaginatedResult } from "./pagination.js";

type FactoryRow = {
  id: string;
  name: string;
  type: string;
  holding: string | null;
  country: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  is_ours: boolean;
  description: string | null;
  enterprise_status?: string | null;
  code?: string | null;
  address?: string | null;
  kladr_id?: string | null;
  geocode_source?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  canonical_key?: string | null;
  edit_count?: number | null;
};

type SupplyLinkRow = {
  id: string;
  origin_id: string;
  destination_id: string;
  cargo_type: string | null;
  product_id?: string | null;
  flow_type?: string | null;
  volume: string | number | null;
  unit: string | null;
  period: string | null;
  shipment_date?: string | Date | null;
  amount?: string | number | null;
  manager_id?: string | null;
  manager_name?: string | null;
  sales_manager_id?: string | null;
  created_by?: string | null;
  site_id?: string | null;
  status: string | null;
  progress_pct: number | null;
  current_lat: number | null;
  current_lng: number | null;
  speed_kmh: string | number | null;
  eta: string | null;
  eta_at?: Date | string | null;
  carrier_name: string | null;
  carrier_id: string | null;
  driver_info: string | null;
  delay_reason: string | null;
  source: string | null;
  last_updated: Date | string | null;
  transport_mode?: string | null;
  vehicle_number?: string | null;
  trailer_number?: string | null;
  container_number?: string | null;
  seal_number?: string | null;
  waybill_number?: string | null;
  planned_departure_at?: Date | string | null;
  planned_arrival_at?: Date | string | null;
  actual_departure_at?: Date | string | null;
  actual_arrival_at?: Date | string | null;
  logistics_notes?: string | null;
};

function mapFactory(row: FactoryRow): Factory {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Factory["type"],
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    region: row.region || "",
    country: row.country || "",
    is_ours: Boolean(row.is_ours),
    description: row.description || "",
    holding: row.holding || "",
    code: row.code || "",
    address: row.address || "",
    kladr_id: row.kladr_id || undefined,
    geocode_source: row.geocode_source || undefined,
    is_active: row.is_active !== false,
    sort_order: row.sort_order ?? 0,
    edit_count: row.edit_count ?? 0,
    enterprise_status: row.enterprise_status
      ? (row.enterprise_status as Factory["enterprise_status"])
      : undefined,
  };
}

function mapSupplyLink(row: SupplyLinkRow): SupplyLink {
  return {
    id: row.id,
    origin_id: row.origin_id,
    destination_id: row.destination_id,
    cargo_type: row.cargo_type || "",
    product_id: row.product_id || undefined,
    flow_type: (row.flow_type as SupplyLink["flow_type"]) || undefined,
    volume: Number(row.volume ?? 0),
    unit: row.unit || "т",
    source: (row.source as SupplyLink["source"]) || "own",
    period: row.period || "2025",
    shipment_date: row.shipment_date ? new Date(row.shipment_date).toISOString().slice(0, 10) : undefined,
    amount: row.amount != null ? Number(row.amount) : undefined,
    manager_id: row.manager_id || undefined,
    manager_name: row.manager_name || undefined,
    sales_manager_id: row.sales_manager_id || undefined,
    created_by: row.created_by || undefined,
    site_id: row.site_id || undefined,
    status: (row.status as SupplyLink["status"]) || undefined,
    current_lat: row.current_lat != null ? Number(row.current_lat) : undefined,
    current_lng: row.current_lng != null ? Number(row.current_lng) : undefined,
    speed_kmh: row.speed_kmh != null ? Number(row.speed_kmh) : undefined,
    progress_pct: row.progress_pct ?? undefined,
    eta: row.eta || (row.eta_at ? formatEtaDisplay(new Date(row.eta_at)) : undefined),
    eta_at: row.eta_at ? new Date(row.eta_at).toISOString() : undefined,
    carrier_name: row.carrier_name || undefined,
    carrier_id: row.carrier_id || undefined,
    driver_info: row.driver_info || undefined,
    delay_reason: row.delay_reason || undefined,
    last_updated: row.last_updated ? new Date(row.last_updated).toISOString() : undefined,
    transport_mode: (row.transport_mode as SupplyLink["transport_mode"]) || undefined,
    vehicle_number: row.vehicle_number || undefined,
    trailer_number: row.trailer_number || undefined,
    container_number: row.container_number || undefined,
    seal_number: row.seal_number || undefined,
    waybill_number: row.waybill_number || undefined,
    planned_departure_at: row.planned_departure_at
      ? new Date(row.planned_departure_at).toISOString()
      : undefined,
    planned_arrival_at: row.planned_arrival_at
      ? new Date(row.planned_arrival_at).toISOString()
      : undefined,
    actual_departure_at: row.actual_departure_at
      ? new Date(row.actual_departure_at).toISOString()
      : undefined,
    actual_arrival_at: row.actual_arrival_at
      ? new Date(row.actual_arrival_at).toISOString()
      : undefined,
    logistics_notes: row.logistics_notes || undefined,
  };
}

function mapEventLog(row: {
  id: string;
  timestamp: Date | string;
  user_id: string | null;
  username: string | null;
  role: string | null;
  action: string | null;
  category: string | null;
  details: string | null;
  ip_address: string | null;
}): EventLog {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp).toISOString(),
    user_id: row.user_id || "",
    username: row.username || "",
    role: (row.role as UserRole) || "viewer",
    action: row.action || "",
    category: (row.category as EventLog["category"]) || "system",
    details: row.details || "",
    ip_address: row.ip_address || undefined,
  };
}

function mapUser(row: {
  id: string;
  username: string;
  name: string | null;
  role: string | null;
  email: string | null;
  telegram_chat_id: string | null;
  notifications_enabled: boolean | null;
  site_id?: string | null;
  assigned_site_ids?: string[] | null;
  email_verified?: boolean | null;
  account_status?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: Date | string | null;
}): User {
  const status = (row.account_status as AccountStatus) || "active";
  const hasAvatar = Boolean(row.avatar_path);
  const avatarVersion = row.avatar_updated_at
    ? new Date(row.avatar_updated_at).toISOString()
    : undefined;
  return {
    id: row.id,
    username: row.username,
    name: row.name || "",
    role: (row.role as UserRole) || "local_employee",
    email: row.email || "",
    telegram_chat_id: row.telegram_chat_id || undefined,
    notifications_enabled: row.notifications_enabled ?? true,
    site_id: row.site_id || undefined,
    assigned_site_ids: row.assigned_site_ids?.length ? row.assigned_site_ids : undefined,
    email_verified: row.email_verified ?? true,
    account_status: status === "pending" || status === "rejected" ? status : "active",
    has_avatar: hasAvatar,
    avatar_version: hasAvatar ? avatarVersion : undefined,
  };
}

function mapBackup(row: {
  id: string;
  created_at: Date | string;
  size_bytes: string | number | null;
  type: string | null;
  filename: string | null;
  description: string | null;
  storage_path?: string | null;
  cloud_uploaded?: boolean | null;
  cloud_provider?: string | null;
}): BackupItem {
  return {
    id: row.id,
    created_at: new Date(row.created_at).toISOString(),
    size_bytes: Number(row.size_bytes ?? 0),
    type: (row.type as BackupItem["type"]) || "manual",
    filename: row.filename || "",
    description: row.description || "",
    storage_path: row.storage_path || undefined,
    cloud_uploaded: row.cloud_uploaded ?? false,
    cloud_provider: row.cloud_provider || undefined,
  };
}

function mapCarrier(row: {
  id: string;
  name: string;
  code: string | null;
  category?: string | null;
  status: string | null;
  last_sync: Date | string | null;
  active_shipments_count: number | null;
  api_endpoint: string | null;
}): ThirdPartyCarrier {
  return {
    id: row.id,
    name: row.name,
    code: row.code || "",
    category: (row.category as ThirdPartyCarrier["category"]) || "other",
    status: (row.status as ThirdPartyCarrier["status"]) || "connected",
    last_sync: row.last_sync ? new Date(row.last_sync).toISOString() : new Date().toISOString(),
    active_shipments_count: row.active_shipments_count ?? 0,
    api_endpoint: row.api_endpoint || "",
  };
}

const BOOTSTRAP_USERS: User[] = [
  { id: "u_admin", username: "admin", name: "Александр Волков", role: "admin", email: "admin@logistics.ru", notifications_enabled: true },
  { id: "u_key", username: "keyperson", name: "Елена Смирнова", role: "key_person", email: "key@logistics.ru", notifications_enabled: false },
  { id: "u_mgr", username: "manager", name: "Дмитрий Соколов", role: "manager", email: "manager@logistics.ru", notifications_enabled: true },
  { id: "u_site", username: "sitemanager", name: "Игорь Кузнецов", role: "site_manager", email: "site@logistics.ru", notifications_enabled: true, site_id: "aQOWlcH4hpZYSUfRL1M0marke" },
  { id: "u_local", username: "employee", name: "Иван Петров", role: "local_employee", email: "employee@logistics.ru", notifications_enabled: true, site_id: "aQOWlcH4hpZYSUfRL1M0marke" },
];

/** Create default user accounts when the users table is empty (runs regardless of SEED_DEMO_DATA). */
export async function seedUsersIfEmpty(): Promise<void> {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
  if (Number(rows[0].count) > 0) return;

  const passwordHash = await hashPassword(getDefaultPassword());
  for (const user of BOOTSTRAP_USERS) {
    await pool.query(
      `INSERT INTO users (id, username, name, role, email, notifications_enabled, password_hash, site_id, assigned_site_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [user.id, user.username, user.name, user.role, user.email, user.notifications_enabled, passwordHash, user.site_id ?? null, user.assigned_site_ids ?? []],
    );
  }
  console.log(`Bootstrap users created: ${BOOTSTRAP_USERS.length} account(s)`);
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  if (!isSeedDemoDataEnabled()) {
    console.log("SEED_DEMO_DATA is disabled — skipping demo factories, shipments and sample carriers");
    return;
  }

  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM factories");
  if (Number(rows[0].count) > 0) return;

  const st = getServerT("ru");
  const supplyLinks = getCleanSupplyLinks({ syntheticTelemetry: true });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const factory of rawFactories) {
      await upsertSite(client, factory, "demo_seed");
    }

    for (const link of supplyLinks) {
      await client.query(
        `INSERT INTO supply_links (
          id, origin_id, destination_id, cargo_type, product_id, flow_type, volume, unit, period,
          shipment_date, amount, manager_name, site_id, status, progress_pct, current_lat, current_lng,
          speed_kmh, eta, eta_at, carrier_name, driver_info, delay_reason, source, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
        [
          link.id,
          link.origin_id,
          link.destination_id,
          link.cargo_type,
          link.product_id ?? null,
          link.flow_type ?? null,
          link.volume,
          link.unit,
          link.period,
          link.shipment_date ?? null,
          link.amount ?? null,
          link.manager_name ?? null,
          link.site_id ?? null,
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
          link.last_updated ?? null,
        ],
      );
    }

    for (const user of BOOTSTRAP_USERS) {
      const passwordHash = await hashPassword(getDefaultPassword());
      await client.query(
        `INSERT INTO users (id, username, name, role, email, notifications_enabled, password_hash, site_id, assigned_site_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.username, user.name, user.role, user.email, user.notifications_enabled, passwordHash, user.site_id ?? null, user.assigned_site_ids ?? []],
      );
    }

    const carriers: ThirdPartyCarrier[] = [
      { id: "c_own", name: "Собственный автопарк", code: "OWN", category: "own", status: "connected", last_sync: new Date().toISOString(), active_shipments_count: 0, api_endpoint: "" },
      { id: "c_rzd", name: "РЖД Логистика (АСУ ЭTRAN)", code: "RZD", category: "rzd", status: "connected", last_sync: new Date().toISOString(), active_shipments_count: 28, api_endpoint: "https://api.rzd-logistics.ru/v2/tracking" },
      { id: "c_dellin", name: "Деловые Линии API", code: "DELLIN", category: "other", status: "connected", last_sync: new Date().toISOString(), active_shipments_count: 12, api_endpoint: "https://api.dellin.ru/v1/cargo" },
      { id: "c_fesco", name: "FESCO Intermodal Tracking", code: "FESCO", category: "other", status: "connected", last_sync: new Date().toISOString(), active_shipments_count: 8, api_endpoint: "https://my.fesco.com/api/tracking" },
      { id: "c_pgk", name: "Первая Грузовая Компания", code: "PGK", category: "other", status: "connected", last_sync: new Date().toISOString(), active_shipments_count: 3, api_endpoint: "https://api.pgkweb.ru/v3/dispatches" },
    ];

    for (const carrier of carriers) {
      await client.query(
        `INSERT INTO carriers (id, name, code, category, status, last_sync, active_shipments_count, api_endpoint, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [carrier.id, carrier.name, carrier.code, carrier.category, carrier.status, carrier.last_sync, carrier.active_shipments_count, carrier.api_endpoint, carrier.sort_order ?? 0, true]
      );
    }

    await client.query(
      `INSERT INTO event_logs (id, timestamp, user_id, username, role, action, category, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        "log_init_001",
        new Date().toISOString(),
        "u_system",
        st("audit.systemUser"),
        "admin",
        st("server.logInit"),
        "system",
        st("server.logInitDetails", {
          factories: rawFactories.length,
          shipments: supplyLinks.length,
        }),
        "127.0.0.1",
      ]
    );

    await client.query("COMMIT");
    console.log(`Demo database seeded: ${rawFactories.length} factories, ${supplyLinks.length} supply links (synthetic telemetry)`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllFactories(): Promise<Factory[]> {
  const { rows } = await pool.query<FactoryRow>(
    "SELECT * FROM factories WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY sort_order, name"
  );
  return rows.map(mapFactory);
}

export async function getFactoriesPaginated(options: {
  page: number;
  pageSize: number;
  search?: string;
  includeInactive?: boolean;
}): Promise<PaginatedResult<Factory>> {
  const { page, pageSize, search = "", includeInactive = false } = options;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (!includeInactive) {
    conditions.push("COALESCE(is_active, TRUE) = TRUE");
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(name ILIKE $${idx} OR COALESCE(country, '') ILIKE $${idx} OR COALESCE(region, '') ILIKE $${idx} OR COALESCE(holding, '') ILIKE $${idx})`,
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM factories ${where}`,
    params,
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? "0", 10) || 0;
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await pool.query<FactoryRow>(
    `SELECT * FROM factories ${where} ORDER BY sort_order, name LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return buildPaginatedResult(rows.map(mapFactory), total, page, pageSize);
}

export async function getAllFactoriesAdmin(): Promise<Factory[]> {
  const { rows } = await pool.query<FactoryRow>(
    "SELECT * FROM factories ORDER BY type, sort_order, name"
  );
  return rows.map(mapFactory);
}

export async function getSiteCategories(): Promise<SiteCategoryInfo[]> {
  const { rows } = await pool.query<SiteCategoryInfo>(
    "SELECT id, name_ru, name_en, sort_order FROM site_categories ORDER BY sort_order"
  );
  return rows;
}

export async function createFactory(factory: Factory): Promise<Factory> {
  const canonicalKey = buildCanonicalKey(factory);
  await pool.query(
    `INSERT INTO factories (
      id, name, type, holding, country, region, latitude, longitude,
      is_ours, description, code, address, is_active, sort_order, canonical_key, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
    [
      factory.id,
      factory.name,
      factory.type,
      factory.holding || "",
      factory.country,
      factory.region,
      factory.latitude,
      factory.longitude,
      factory.is_ours,
      factory.description,
      factory.code || "",
      factory.address || "",
      factory.is_active !== false,
      factory.sort_order ?? 0,
      canonicalKey,
    ]
  );
  return factory;
}

export async function updateFactory(id: string, factory: Partial<Factory>): Promise<Factory | null> {
  const resolvedId = await resolveSiteFactoryId(pool, id);
  if (!resolvedId) return null;

  const { rows } = await pool.query<FactoryRow>(
    'SELECT * FROM factories WHERE id = $1 AND COALESCE(is_active, TRUE) = TRUE',
    [resolvedId],
  );
  if (!rows[0]) return null;
  const existing = mapFactory(rows[0]);

  const updated: Factory = {
    ...existing,
    ...factory,
    id: resolvedId,
  };
  const canonicalKey = buildCanonicalKey(updated);

  const result = await pool.query(
    `UPDATE factories SET
      name = $2, type = $3, holding = $4, country = $5, region = $6,
      latitude = $7, longitude = $8, is_ours = $9, description = $10,
      code = $11, address = $12, kladr_id = $13, geocode_source = $14,
      is_active = $15, sort_order = $16, canonical_key = $17,
      edit_count = COALESCE(edit_count, 0) + 1, updated_at = NOW()
     WHERE id = $1 AND COALESCE(is_active, TRUE) = TRUE`,
    [
      resolvedId,
      updated.name,
      updated.type,
      updated.holding || "",
      updated.country,
      updated.region,
      updated.latitude,
      updated.longitude,
      updated.is_ours,
      updated.description,
      updated.code || "",
      updated.address || "",
      updated.kladr_id || "",
      updated.geocode_source || "",
      updated.is_active !== false,
      updated.sort_order ?? 0,
      canonicalKey,
    ],
  );
  if ((result.rowCount ?? 0) === 0) return null;

  return { ...updated, edit_count: (existing.edit_count ?? 0) + 1 };
}

export async function deleteFactory(id: string): Promise<{ ok: boolean; error?: string }> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM supply_links
     WHERE origin_id = $1 OR destination_id = $1`,
    [id]
  );
  if (Number(rows[0].count) > 0) {
    return { ok: false, error: "Factory is referenced by supply links" };
  }

  const result = await pool.query("DELETE FROM factories WHERE id = $1", [id]);
  if ((result.rowCount ?? 0) === 0) {
    return { ok: false, error: "Factory not found" };
  }
  return { ok: true };
}

export async function upsertFactoryFromDirectory(
  client: PoolClient,
  factory: Factory
): Promise<"inserted" | "updated" | "merged"> {
  return upsertSite(client, factory, "site_directory");
}

export async function getFactoryById(id: string): Promise<Factory | null> {
  const resolvedId = await resolveSiteFactoryId(pool, id);
  const lookupId = resolvedId ?? id;
  const { rows } = await pool.query<FactoryRow>("SELECT * FROM factories WHERE id = $1", [lookupId]);
  return rows[0] ? mapFactory(rows[0]) : null;
}

export async function getAllSupplyLinks(): Promise<SupplyLink[]> {
  const { rows } = await pool.query<SupplyLinkRow>("SELECT * FROM supply_links ORDER BY id");
  return rows.map(mapSupplyLink);
}

export async function getSupplyLinksPaginated(options: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<SupplyLink>> {
  const { page, pageSize, search = "", status } = options;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(cargo_type ILIKE $${idx} OR COALESCE(carrier_name, '') ILIKE $${idx} OR COALESCE(source, '') ILIKE $${idx})`,
    );
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM supply_links ${where}`,
    params,
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? "0", 10) || 0;
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await pool.query<SupplyLinkRow>(
    `SELECT * FROM supply_links ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return buildPaginatedResult(rows.map(mapSupplyLink), total, page, pageSize);
}

export async function getSupplyLinkById(id: string): Promise<SupplyLink | null> {
  const { rows } = await pool.query<SupplyLinkRow>("SELECT * FROM supply_links WHERE id = $1", [id]);
  return rows[0] ? mapSupplyLink(rows[0]) : null;
}

export async function getSupplyLinksByIds(ids: string[]): Promise<SupplyLink[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query<SupplyLinkRow>(
    "SELECT * FROM supply_links WHERE id = ANY($1::text[])",
    [ids],
  );
  return rows.map(mapSupplyLink);
}

type ShipmentEventRow = {
  id: string;
  shipment_id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  timing_kind: string | null;
  delay_reason: string | null;
  delay_hours: string | number | null;
  early_hours: string | number | null;
  comment: string | null;
  eta_before: string | null;
  eta_after: string | null;
  origin_id: string | null;
  destination_id: string | null;
  product_id: string | null;
  actual_departure_at?: Date | string | null;
  actual_arrival_at?: Date | string | null;
  progress_pct?: string | number | null;
  transport_mode?: string | null;
  vehicle_number?: string | null;
  trailer_number?: string | null;
  container_number?: string | null;
  waybill_number?: string | null;
  driver_info?: string | null;
  apply_transport_to_shipment?: boolean | null;
  user_id: string;
  username: string;
  source: string;
  created_at: Date | string;
};

function mapShipmentEvent(row: ShipmentEventRow): ShipmentEvent {
  return {
    id: row.id,
    shipment_id: row.shipment_id,
    event_type: row.event_type as ShipmentEvent["event_type"],
    old_status: (row.old_status as CargoStatus) || undefined,
    new_status: (row.new_status as CargoStatus) || undefined,
    timing_kind: (row.timing_kind as ShipmentEvent["timing_kind"]) || undefined,
    delay_reason: row.delay_reason || undefined,
    delay_hours: row.delay_hours != null ? Number(row.delay_hours) : undefined,
    early_hours: row.early_hours != null ? Number(row.early_hours) : undefined,
    comment: row.comment || undefined,
    eta_before: row.eta_before || undefined,
    eta_after: row.eta_after || undefined,
    origin_id: row.origin_id || undefined,
    destination_id: row.destination_id || undefined,
    product_id: row.product_id || undefined,
    actual_departure_at: row.actual_departure_at
      ? new Date(row.actual_departure_at).toISOString()
      : undefined,
    actual_arrival_at: row.actual_arrival_at
      ? new Date(row.actual_arrival_at).toISOString()
      : undefined,
    progress_pct: row.progress_pct != null ? Number(row.progress_pct) : undefined,
    transport_mode: (row.transport_mode as ShipmentEvent["transport_mode"]) || undefined,
    vehicle_number: row.vehicle_number || undefined,
    trailer_number: row.trailer_number || undefined,
    container_number: row.container_number || undefined,
    waybill_number: row.waybill_number || undefined,
    driver_info: row.driver_info || undefined,
    apply_transport_to_shipment: Boolean(row.apply_transport_to_shipment),
    user_id: row.user_id,
    username: row.username,
    source: (row.source as ShipmentEvent["source"]) || "manual",
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function getShipmentEvents(shipmentId: string, limit = 100): Promise<ShipmentEvent[]> {
  const { rows } = await pool.query<ShipmentEventRow>(
    `SELECT * FROM shipment_events WHERE shipment_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [shipmentId, limit],
  );
  return rows.map(mapShipmentEvent);
}

export async function getRecentShipmentEvents(limit = 50): Promise<ShipmentEvent[]> {
  const { rows } = await pool.query<ShipmentEventRow>(
    `SELECT * FROM shipment_events ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map(mapShipmentEvent);
}

export async function getRecentShipmentEventsScoped(
  limit: number,
  siteIds: string[],
): Promise<ShipmentEvent[]> {
  if (siteIds.length === 0) return [];
  const { rows } = await pool.query<ShipmentEventRow>(
    `SELECT e.* FROM shipment_events e
     INNER JOIN supply_links l ON l.id = e.shipment_id
     WHERE l.site_id = ANY($2::text[])
        OR l.origin_id = ANY($2::text[])
        OR l.destination_id = ANY($2::text[])
     ORDER BY e.created_at DESC
     LIMIT $1`,
    [limit, siteIds],
  );
  return rows.map(mapShipmentEvent);
}

export async function insertShipmentEventRecord(
  client: PoolClient,
  event: ShipmentEvent,
): Promise<void> {
  await client.query(
    `INSERT INTO shipment_events (
      id, shipment_id, event_type, old_status, new_status, timing_kind,
      delay_reason, delay_hours, early_hours, comment, eta_before, eta_after,
      origin_id, destination_id, product_id,
      actual_departure_at, actual_arrival_at, progress_pct, transport_mode,
      vehicle_number, trailer_number, container_number, waybill_number, driver_info,
      apply_transport_to_shipment,
      user_id, username, source, created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
      $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
    )`,
    [
      event.id,
      event.shipment_id,
      event.event_type,
      event.old_status ?? null,
      event.new_status ?? null,
      event.timing_kind ?? null,
      event.delay_reason ?? null,
      event.delay_hours ?? null,
      event.early_hours ?? null,
      event.comment ?? null,
      event.eta_before ?? null,
      event.eta_after ?? null,
      event.origin_id ?? null,
      event.destination_id ?? null,
      event.product_id ?? null,
      event.actual_departure_at ?? null,
      event.actual_arrival_at ?? null,
      event.progress_pct ?? null,
      event.transport_mode ?? null,
      event.vehicle_number ?? null,
      event.trailer_number ?? null,
      event.container_number ?? null,
      event.waybill_number ?? null,
      event.driver_info ?? null,
      Boolean(event.apply_transport_to_shipment),
      event.user_id,
      event.username,
      event.source,
      event.created_at,
    ],
  );
}

export async function applyShipmentEventUpdates(
  client: PoolClient,
  shipmentId: string,
  event: ShipmentEvent,
): Promise<SupplyLink | null> {
  const progressPct =
    event.new_status === "arrived"
      ? 100
      : event.progress_pct != null && Number.isFinite(event.progress_pct)
        ? Math.max(0, Math.min(100, Math.round(Number(event.progress_pct))))
        : null;
  const etaResolved = event.eta_after?.trim() ? resolveEtaFields(event.eta_after) : null;
  const applyTransport = Boolean(event.apply_transport_to_shipment);

  const { rows } = await client.query<SupplyLinkRow>(
    `UPDATE supply_links SET
      status = COALESCE($2, status),
      delay_reason = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE delay_reason END,
      eta = COALESCE($4, eta),
      eta_at = COALESCE($5, eta_at),
      progress_pct = COALESCE($6, progress_pct),
      actual_departure_at = COALESCE($7::timestamptz, actual_departure_at),
      actual_arrival_at = COALESCE($8::timestamptz, actual_arrival_at),
      vehicle_number = CASE WHEN $9::boolean AND $10::text IS NOT NULL THEN $10 ELSE vehicle_number END,
      trailer_number = CASE WHEN $9::boolean AND $11::text IS NOT NULL THEN $11 ELSE trailer_number END,
      container_number = CASE WHEN $9::boolean AND $12::text IS NOT NULL THEN $12 ELSE container_number END,
      waybill_number = CASE WHEN $9::boolean AND $13::text IS NOT NULL THEN $13 ELSE waybill_number END,
      driver_info = CASE WHEN $9::boolean AND $14::text IS NOT NULL THEN $14 ELSE driver_info END,
      transport_mode = CASE WHEN $9::boolean AND $15::text IS NOT NULL THEN $15 ELSE transport_mode END,
      last_updated = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      shipmentId,
      event.new_status ?? null,
      event.delay_reason ?? null,
      etaResolved?.eta ?? null,
      etaResolved?.eta_at ?? null,
      progressPct,
      event.actual_departure_at ?? null,
      event.actual_arrival_at ?? null,
      applyTransport,
      event.vehicle_number?.trim() || null,
      event.trailer_number?.trim() || null,
      event.container_number?.trim() || null,
      event.waybill_number?.trim() || null,
      event.driver_info?.trim() || null,
      event.transport_mode ?? null,
    ],
  );
  return rows[0] ? mapSupplyLink(rows[0]) : null;
}

export async function updateSupplyLinkStatus(
  id: string,
  status: string,
  delayReason?: string
): Promise<SupplyLink | null> {
  const progressPct = status === "arrived" ? 100 : undefined;
  const { rows } = await pool.query<SupplyLinkRow>(
    `UPDATE supply_links
     SET status = $2,
         delay_reason = COALESCE($3, delay_reason),
         progress_pct = COALESCE($4, progress_pct),
         last_updated = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, delayReason ?? null, progressPct ?? null]
  );
  return rows[0] ? mapSupplyLink(rows[0]) : null;
}

export async function updateSupplyLink(
  id: string,
  patch: Partial<SupplyLink>,
  log?: { user_id: string; username: string; action: string; changes: string },
): Promise<SupplyLink | null> {
  const existing = await getSupplyLinkById(id);
  if (!existing) return null;

  const updated: SupplyLink = {
    ...existing,
    ...patch,
    id,
  };

  if (updated.origin_id === updated.destination_id) {
    throw new Error("ORIGIN_DEST_SAME");
  }

  const shipmentDate = updated.shipment_date?.trim() || existing.shipment_date;
  const period = shipmentDate ? shipmentDate.slice(0, 4) : updated.period;

  await pool.query(
    `UPDATE supply_links SET
      origin_id = $2,
      destination_id = $3,
      cargo_type = $4,
      product_id = $5,
      flow_type = $6,
      volume = $7,
      unit = $8,
      period = $9,
      shipment_date = $10,
      amount = $11,
      manager_id = $12,
      manager_name = $13,
      sales_manager_id = $14,
      site_id = $15,
      status = $16,
      source = $17,
      carrier_id = $18,
      carrier_name = $19,
      driver_info = $20,
      delay_reason = $21,
      eta = $22,
      transport_mode = $23,
      vehicle_number = $24,
      trailer_number = $25,
      container_number = $26,
      seal_number = $27,
      waybill_number = $28,
      planned_departure_at = $29,
      planned_arrival_at = $30,
      actual_departure_at = $31,
      actual_arrival_at = $32,
      logistics_notes = $33,
      last_updated = NOW()
     WHERE id = $1`,
    [
      id,
      updated.origin_id,
      updated.destination_id,
      updated.cargo_type,
      updated.product_id ?? null,
      updated.flow_type ?? null,
      updated.volume,
      updated.unit,
      period,
      shipmentDate ?? null,
      updated.amount ?? null,
      updated.manager_id ?? null,
      updated.manager_name ?? null,
      updated.sales_manager_id ?? null,
      updated.site_id ?? null,
      updated.status ?? existing.status ?? "en_route",
      updated.source ?? "own",
      updated.carrier_id ?? null,
      updated.carrier_name ?? null,
      updated.driver_info ?? null,
      updated.delay_reason ?? null,
      updated.eta ?? null,
      updated.transport_mode ?? null,
      updated.vehicle_number || null,
      updated.trailer_number || null,
      updated.container_number || null,
      updated.seal_number || null,
      updated.waybill_number || null,
      updated.planned_departure_at || null,
      updated.planned_arrival_at || null,
      updated.actual_departure_at || null,
      updated.actual_arrival_at || null,
      updated.logistics_notes || null,
    ],
  );

  if (log) {
    await pool.query(
      `INSERT INTO shipment_change_logs (id, shipment_id, user_id, username, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`log_${id}_${Date.now()}`, id, log.user_id, log.username, log.action, log.changes],
    );
  }

  return getSupplyLinkById(id);
}

export async function getEnRouteSupplyLinks(): Promise<SupplyLink[]> {
  const { rows } = await pool.query<SupplyLinkRow>(
    `SELECT * FROM supply_links
     WHERE status = 'en_route' AND COALESCE(progress_pct, 0) < 100`
  );
  return rows.map(mapSupplyLink);
}

export async function getShipmentsForEtaCheck(): Promise<SupplyLink[]> {
  const { rows } = await pool.query<SupplyLinkRow>(
    `SELECT * FROM supply_links
     WHERE status IN ('en_route', 'loading')
       AND (eta_at IS NOT NULL OR (eta IS NOT NULL AND TRIM(eta) <> ''))
       AND COALESCE(progress_pct, 0) < 98`,
  );
  return rows.map(mapSupplyLink);
}

export async function updateSupplyLinkTelemetry(
  id: string,
  fields: {
    progress_pct: number;
    current_lat: number;
    current_lng: number;
    speed_kmh?: number;
    status: string;
  }
): Promise<SupplyLink | null> {
  const { rows } = await pool.query<SupplyLinkRow>(
    `UPDATE supply_links
     SET progress_pct = $2, current_lat = $3, current_lng = $4, speed_kmh = COALESCE($5, speed_kmh), status = $6, last_updated = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, fields.progress_pct, fields.current_lat, fields.current_lng, fields.speed_kmh ?? null, fields.status]
  );
  return rows[0] ? mapSupplyLink(rows[0]) : null;
}

export async function getEventLogs(limit = 500): Promise<EventLog[]> {
  const { rows } = await pool.query(
    `SELECT * FROM event_logs ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  );
  return rows.map(mapEventLog);
}

export async function insertEventLog(log: Omit<EventLog, "timestamp"> & { timestamp?: string }): Promise<EventLog> {
  const timestamp = log.timestamp || new Date().toISOString();
  await pool.query(
    `INSERT INTO event_logs (id, timestamp, user_id, username, role, action, category, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [log.id, timestamp, log.user_id, log.username, log.role, log.action, log.category, log.details, log.ip_address ?? null]
  );

  await pool.query(
    `DELETE FROM event_logs
     WHERE id NOT IN (
       SELECT id FROM event_logs ORDER BY timestamp DESC LIMIT 500
     )`
  );

  return { ...log, timestamp } as EventLog;
}

export async function getAllUsers(): Promise<User[]> {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY username");
  return rows.map(mapUser);
}

export async function getAllBackups(): Promise<BackupItem[]> {
  const { rows } = await pool.query("SELECT * FROM backups ORDER BY created_at DESC");
  return rows.map(mapBackup);
}

export async function createBackupRecord(backup: BackupItem): Promise<BackupItem> {
  await pool.query(
    `INSERT INTO backups (id, created_at, size_bytes, type, filename, description)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [backup.id, backup.created_at, backup.size_bytes, backup.type, backup.filename, backup.description]
  );
  return backup;
}

export async function estimateDatabaseSizeBytes(): Promise<number> {
  const { rows } = await pool.query<{ size: string }>(
  `SELECT pg_database_size(current_database())::text AS size`
  );
  return Number(rows[0]?.size ?? 0);
}

export async function getAllCarriers(): Promise<ThirdPartyCarrier[]> {
  const { rows } = await pool.query("SELECT * FROM carriers ORDER BY name");
  return rows.map(mapCarrier);
}

export async function getCarriersPaginated(options: {
  page: number;
  pageSize: number;
  search?: string;
  activeOnly?: boolean;
}): Promise<PaginatedResult<ThirdPartyCarrier>> {
  const { page, pageSize, search = "", activeOnly = false } = options;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (activeOnly) {
    conditions.push("COALESCE(status, 'active') != 'inactive'");
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(`(name ILIKE $${idx} OR COALESCE(code, '') ILIKE $${idx})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM carriers ${where}`,
    params,
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? "0", 10) || 0;
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await pool.query(
    `SELECT * FROM carriers ${where} ORDER BY name LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return buildPaginatedResult(rows.map(mapCarrier), total, page, pageSize);
}

export async function updateCarrierSync(carrierId: string): Promise<ThirdPartyCarrier | null> {
  const { rows } = await pool.query(
    `UPDATE carriers SET last_sync = NOW() WHERE id = $1 RETURNING *`,
    [carrierId]
  );
  if (rows[0]) return mapCarrier(rows[0]);

  const fallback = await pool.query(`UPDATE carriers SET last_sync = NOW() WHERE id = (
    SELECT id FROM carriers ORDER BY name LIMIT 1
  ) RETURNING *`);
  return fallback.rows[0] ? mapCarrier(fallback.rows[0]) : null;
}

export async function getCarrierById(carrierId: string): Promise<ThirdPartyCarrier | null> {
  const { rows } = await pool.query("SELECT * FROM carriers WHERE id = $1", [carrierId]);
  return rows[0] ? mapCarrier(rows[0]) : null;
}

export type AuthLoginFailure = "INVALID_CREDENTIALS" | "EMAIL_NOT_VERIFIED" | "PENDING_APPROVAL" | "REJECTED";

export type AuthLoginResult =
  | { ok: true; user: User }
  | { ok: false; code: AuthLoginFailure };

const EMAIL_CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function authToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function authenticateUser(username: string, password: string): Promise<AuthLoginResult> {
  const { rows } = await pool.query<{ password_hash: string | null } & Parameters<typeof mapUser>[0]>(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );
  const row = rows[0];
  if (!row?.password_hash) return { ok: false, code: "INVALID_CREDENTIALS" };
  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return { ok: false, code: "INVALID_CREDENTIALS" };

  const user = mapUser(row);
  if (!user.email_verified) return { ok: false, code: "EMAIL_NOT_VERIFIED" };
  if (user.account_status === "pending") return { ok: false, code: "PENDING_APPROVAL" };
  if (user.account_status === "rejected") return { ok: false, code: "REJECTED" };
  return { ok: true, user };
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND email IS NOT NULL AND email <> ''",
    [email.trim()],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function countAdminUsers(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'",
  );
  return Number(rows[0]?.count ?? 0);
}

/** Find or create a local user for a portal AD account (samaccountname). */
export async function ensurePortalUser(input: {
  username: string;
  name: string;
  role: UserRole;
}): Promise<User> {
  const username = input.username.trim();
  const name = input.name.trim() || username;
  const role = input.role;

  const existing = await getUserByUsername(username);
  if (existing) {
    if (existing.account_status === "rejected") {
      throw new Error("REJECTED");
    }
    const isPortalAccount = existing.email.endsWith("@portal.local") || existing.id.startsWith("u_portal_");
    if (isPortalAccount && (existing.name !== name || existing.role !== role)) {
      await pool.query(
        `UPDATE users SET name = $1, role = $2
         WHERE id = $3 AND account_status = 'active'`,
        [name, role, existing.id],
      );
      const refreshed = await getUserByUsername(username);
      return refreshed ?? existing;
    }
    return existing;
  }

  const id = `u_portal_${crypto.randomBytes(6).toString("hex")}`;
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
  const email = `${username}@portal.local`;

  await pool.query(
    `INSERT INTO users (
      id, username, name, role, email, notifications_enabled,
      password_hash, email_verified, account_status
    ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, TRUE, 'active')
     ON CONFLICT (username) DO NOTHING`,
    [id, username, name, role, email, passwordHash],
  );

  let user = await getUserByUsername(username);
  if (!user) {
    // Race: another request created the row between SELECT and INSERT.
    await new Promise(resolve => setTimeout(resolve, 50));
    user = await getUserByUsername(username);
  }
  if (!user) throw new Error("CREATE_FAILED");
  if (user.account_status === "rejected") throw new Error("REJECTED");
  return user;
}

export async function createUser(input: UserCreateInput): Promise<User> {
  const existing = await getUserByUsername(input.username);
  if (existing) throw new Error("USERNAME_TAKEN");

  const email = input.email.trim();
  if (email) {
    const emailTaken = await getUserByEmail(email);
    if (emailTaken) throw new Error("EMAIL_TAKEN");
  }

  const id = `u_${crypto.randomBytes(6).toString("hex")}`;
  const passwordHash = await hashPassword(input.password);

  await pool.query(
    `INSERT INTO users (
      id, username, name, role, email, telegram_chat_id, notifications_enabled,
      password_hash, site_id, assigned_site_ids, email_verified, account_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, 'active')`,
    [
      id,
      input.username.trim(),
      input.name.trim(),
      input.role,
      email,
      input.telegram_chat_id?.trim() || null,
      input.notifications_enabled ?? true,
      passwordHash,
      input.site_id || null,
      input.assigned_site_ids ?? [],
    ],
  );

  const user = await getUserById(id);
  if (!user) throw new Error("CREATE_FAILED");
  return user;
}

export type RegisterUserInput = {
  username: string;
  name: string;
  email: string;
  password: string;
};

export async function registerUser(input: RegisterUserInput): Promise<{ user: User; confirmToken: string }> {
  const username = input.username.trim();
  const name = input.name.trim();
  const email = input.email.trim();
  if (!username || !name || !email || !input.password) throw new Error("VALIDATION");
  if (input.password.length < 8) throw new Error("PASSWORD_WEAK");

  if (await getUserByUsername(username)) throw new Error("USERNAME_TAKEN");
  if (await getUserByEmail(email)) throw new Error("EMAIL_TAKEN");

  const id = `u_${crypto.randomBytes(6).toString("hex")}`;
  const passwordHash = await hashPassword(input.password);
  const confirmToken = authToken();
  const expires = new Date(Date.now() + EMAIL_CONFIRM_TTL_MS);

  await pool.query(
    `INSERT INTO users (
      id, username, name, role, email, notifications_enabled, password_hash,
      email_verified, account_status, email_confirm_token, email_confirm_expires
    ) VALUES ($1, $2, $3, 'local_employee', $4, TRUE, $5, FALSE, 'pending', $6, $7)`,
    [id, username, name, email, passwordHash, confirmToken, expires.toISOString()],
  );

  const user = await getUserById(id);
  if (!user) throw new Error("CREATE_FAILED");
  return { user, confirmToken };
}

export async function confirmEmailByToken(token: string): Promise<User | null> {
  if (!token?.trim()) return null;
  const { rows } = await pool.query(
    `SELECT * FROM users
     WHERE email_confirm_token = $1
       AND email_confirm_expires IS NOT NULL
       AND email_confirm_expires > NOW()`,
    [token.trim()],
  );
  const row = rows[0];
  if (!row) return null;

  await pool.query(
    `UPDATE users SET
       email_verified = TRUE,
       email_confirm_token = NULL,
       email_confirm_expires = NULL
     WHERE id = $1`,
    [row.id],
  );
  return getUserById(row.id);
}

export async function requestPasswordReset(email: string): Promise<{ user: User; resetToken: string } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  return issuePasswordResetForUser(user);
}

export async function requestPasswordResetByUserId(
  userId: string,
): Promise<{ user: User; resetToken: string } | null> {
  const user = await getUserById(userId);
  if (!user?.email) return null;
  return issuePasswordResetForUser(user);
}

async function issuePasswordResetForUser(user: User): Promise<{ user: User; resetToken: string }> {
  const resetToken = authToken();
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await pool.query(
    `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
    [resetToken, expires.toISOString(), user.id],
  );
  return { user, resetToken };
}

export type SelfProfileUpdateInput = {
  name?: string;
  telegram_chat_id?: string | null;
  notifications_enabled?: boolean;
};

export async function updateSelfProfile(
  userId: string,
  input: SelfProfileUpdateInput,
): Promise<User | null> {
  const current = await getUserById(userId);
  if (!current) return null;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const set = (col: string, val: unknown) => {
    fields.push(`${col} = $${idx++}`);
    values.push(val);
  };

  if (input.name != null) {
    const name = input.name.trim();
    if (!name) throw new Error("VALIDATION");
    set("name", name);
  }
  if (input.telegram_chat_id !== undefined) {
    set("telegram_chat_id", input.telegram_chat_id?.trim() || null);
  }
  if (input.notifications_enabled !== undefined) {
    set("notifications_enabled", input.notifications_enabled);
  }

  if (fields.length === 0) return current;

  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, values);
  return getUserById(userId);
}

export async function resetPasswordByToken(token: string, password: string): Promise<User | null> {
  if (!token?.trim() || !password) return null;
  if (password.length < 8) throw new Error("PASSWORD_WEAK");

  const { rows } = await pool.query(
    `SELECT * FROM users
     WHERE password_reset_token = $1
       AND password_reset_expires IS NOT NULL
       AND password_reset_expires > NOW()`,
    [token.trim()],
  );
  const row = rows[0];
  if (!row) return null;

  const passwordHash = await hashPassword(password);
  await pool.query(
    `UPDATE users SET
       password_hash = $1,
       password_reset_token = NULL,
       password_reset_expires = NULL
     WHERE id = $2`,
    [passwordHash, row.id],
  );
  return getUserById(row.id);
}

export async function approveUser(id: string): Promise<User | null> {
  const current = await getUserById(id);
  if (!current) return null;
  await pool.query(
    `UPDATE users SET account_status = 'active', email_verified = TRUE WHERE id = $1`,
    [id],
  );
  return getUserById(id);
}

export async function rejectUser(id: string): Promise<User | null> {
  const current = await getUserById(id);
  if (!current) return null;
  await pool.query(`UPDATE users SET account_status = 'rejected' WHERE id = $1`, [id]);
  return getUserById(id);
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<User | null> {
  const current = await getUserById(id);
  if (!current) return null;

  if (input.username && input.username !== current.username) {
    const taken = await getUserByUsername(input.username);
    if (taken && taken.id !== id) throw new Error("USERNAME_TAKEN");
  }

  if (input.role && input.role !== "admin" && current.role === "admin") {
    const admins = await countAdminUsers();
    if (admins <= 1) throw new Error("LAST_ADMIN");
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const set = (col: string, val: unknown) => {
    fields.push(`${col} = $${idx++}`);
    values.push(val);
  };

  if (input.username != null) set("username", input.username.trim());
  if (input.name != null) set("name", input.name.trim());
  if (input.role != null) set("role", input.role);
  if (input.email != null) set("email", input.email.trim());
  if (input.telegram_chat_id !== undefined) set("telegram_chat_id", input.telegram_chat_id?.trim() || null);
  if (input.notifications_enabled !== undefined) set("notifications_enabled", input.notifications_enabled);
  if (input.site_id !== undefined) set("site_id", input.site_id || null);
  if (input.assigned_site_ids !== undefined) set("assigned_site_ids", input.assigned_site_ids);
  if (input.password) {
    const passwordHash = await hashPassword(input.password);
    set("password_hash", passwordHash);
  }

  if (fields.length === 0) return current;

  values.push(id);
  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, values);
  return getUserById(id);
}

export async function deleteUser(id: string, actorId?: string): Promise<boolean> {
  if (actorId && actorId === id) throw new Error("SELF_DELETE");

  const user = await getUserById(id);
  if (!user) return false;

  if (user.role === "admin") {
    const admins = await countAdminUsers();
    if (admins <= 1) throw new Error("LAST_ADMIN");
  }

  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function ensureUserPasswords(): Promise<void> {
  const { rows } = await pool.query<{ id: string; username: string }>(
    "SELECT id, username FROM users WHERE password_hash IS NULL OR password_hash = ''"
  );
  if (rows.length === 0) return;

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `WARNING: ${rows.length} user(s) have no password_hash — set passwords manually (skipped shared default in production)`,
    );
    return;
  }

  for (const row of rows) {
    const passwordHash = await hashPassword(getDefaultPassword());
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, row.id]);
  }
  console.log(`Set dev default passwords for ${rows.length} user(s) (NODE_ENV !== production)`);
}

export async function createShipment(
  link: SupplyLink,
  log?: { user_id: string; username: string; action: string; changes: string },
): Promise<SupplyLink> {
  await pool.query(
    `INSERT INTO supply_links (
      id, origin_id, destination_id, cargo_type, product_id, flow_type, volume, unit, period,
      shipment_date, amount, manager_id, manager_name, sales_manager_id, created_by, site_id, status, source,
      carrier_id, carrier_name, last_updated
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())`,
    [
      link.id,
      link.origin_id,
      link.destination_id,
      link.cargo_type,
      link.product_id ?? null,
      link.flow_type ?? null,
      link.volume,
      link.unit,
      link.period,
      link.shipment_date ?? null,
      link.amount ?? null,
      link.manager_id ?? null,
      link.manager_name ?? null,
      link.sales_manager_id ?? null,
      link.created_by ?? null,
      link.site_id ?? null,
      link.status ?? 'en_route',
      link.source ?? 'own',
      link.carrier_id ?? null,
      link.carrier_name ?? null,
    ],
  );

  if (log) {
    await pool.query(
      `INSERT INTO shipment_change_logs (id, shipment_id, user_id, username, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`log_${link.id}`, link.id, log.user_id, log.username, log.action, log.changes],
    );
  }

  return link;
}

export async function getShipmentChangeLogs(limit = 100): Promise<{
  id: string;
  shipment_id: string;
  user_id: string;
  username: string;
  action: string;
  changes: string;
  timestamp: string;
}[]> {
  const { rows } = await pool.query(
    `SELECT * FROM shipment_change_logs ORDER BY timestamp DESC LIMIT $1`,
    [limit],
  );
  return rows.map((r: { id: string; shipment_id: string; user_id: string; username: string; action: string; changes: string; timestamp: Date | string }) => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

type ProductRow = {
  id: string;
  name_ru: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
};

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name_ru: row.name_ru,
    name_en: row.name_en,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

export async function seedProductsIfEmpty(): Promise<void> {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
  if (Number(rows[0].count) > 0) return;

  for (const p of DEFAULT_PRODUCT_CATALOG) {
    await pool.query(
      `INSERT INTO products (id, name_ru, name_en, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name_ru, p.name_en, p.sort_order ?? 0, p.is_active !== false],
    );
  }
}

export async function getAllProducts(activeOnly = true): Promise<Product[]> {
  const sql = activeOnly
    ? `SELECT * FROM products WHERE is_active = TRUE ORDER BY sort_order, name_ru`
    : `SELECT * FROM products ORDER BY sort_order, name_ru`;
  const { rows } = await pool.query<ProductRow>(sql);
  return rows.map(rowToProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { rows } = await pool.query<ProductRow>(`SELECT * FROM products WHERE id = $1`, [id]);
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const sortOrder = input.sort_order ?? 0;
  const isActive = input.is_active !== false;
  const { rows } = await pool.query<ProductRow>(
    `INSERT INTO products (id, name_ru, name_en, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.id, input.name_ru.trim(), input.name_en.trim(), sortOrder, isActive],
  );
  return rowToProduct(rows[0]);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const nameRu = input.name_ru?.trim() ?? existing.name_ru;
  const nameEn = input.name_en?.trim() ?? existing.name_en;
  const sortOrder = input.sort_order ?? existing.sort_order ?? 0;
  const isActive = input.is_active ?? existing.is_active !== false;

  const { rows } = await pool.query<ProductRow>(
    `UPDATE products
     SET name_ru = $2, name_en = $3, sort_order = $4, is_active = $5, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, nameRu, nameEn, sortOrder, isActive],
  );
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string; soft?: boolean }> {
  const existing = await getProductById(id);
  if (!existing) return { ok: false, error: "Product not found" };

  const usage = await pool.query<{ count: string }>(
    `SELECT (
       (SELECT COUNT(*) FROM supply_links WHERE product_id = $1) +
       (SELECT COUNT(*) FROM shipment_events WHERE product_id = $1)
     )::text AS count`,
    [id],
  );
  const inUse = Number(usage.rows[0].count) > 0;

  if (inUse) {
    await pool.query(`UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    return { ok: true, soft: true };
  }

  await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
  return { ok: true, soft: false };
}

type SalesManagerRow = {
  id: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  position: string;
  full_name: string;
  sort_order: number | null;
  is_active: boolean | null;
};

function buildSalesManagerFullName(lastName: string, firstName: string, middleName: string): string {
  return [lastName, firstName, middleName].map(part => part.trim()).filter(Boolean).join(' ');
}

function rowToSalesManager(row: SalesManagerRow): SalesManager {
  return {
    id: row.id,
    last_name: row.last_name,
    first_name: row.first_name,
    middle_name: row.middle_name || '',
    position: row.position || '',
    full_name: row.full_name,
    sort_order: row.sort_order ?? 0,
    is_active: row.is_active !== false,
  };
}

export async function getAllSalesManagers(activeOnly = true): Promise<SalesManager[]> {
  const sql = activeOnly
    ? `SELECT * FROM sales_managers WHERE is_active = TRUE ORDER BY sort_order, last_name, first_name`
    : `SELECT * FROM sales_managers ORDER BY sort_order, last_name, first_name`;
  const { rows } = await pool.query<SalesManagerRow>(sql);
  return rows.map(rowToSalesManager);
}

export async function getSalesManagerById(id: string): Promise<SalesManager | null> {
  const { rows } = await pool.query<SalesManagerRow>(`SELECT * FROM sales_managers WHERE id = $1`, [id]);
  return rows[0] ? rowToSalesManager(rows[0]) : null;
}

export async function createSalesManager(input: SalesManagerInput): Promise<SalesManager> {
  const fullName = buildSalesManagerFullName(input.last_name, input.first_name, input.middle_name || '');
  const sortOrder = input.sort_order ?? 0;
  const isActive = input.is_active !== false;
  const { rows } = await pool.query<SalesManagerRow>(
    `INSERT INTO sales_managers (id, last_name, first_name, middle_name, position, full_name, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.id.trim(),
      input.last_name.trim(),
      input.first_name.trim(),
      (input.middle_name || '').trim(),
      (input.position || '').trim(),
      fullName,
      sortOrder,
      isActive,
    ],
  );
  return rowToSalesManager(rows[0]);
}

export async function updateSalesManager(id: string, input: Partial<SalesManagerInput>): Promise<SalesManager | null> {
  const existing = await getSalesManagerById(id);
  if (!existing) return null;

  const lastName = input.last_name?.trim() ?? existing.last_name;
  const firstName = input.first_name?.trim() ?? existing.first_name;
  const middleName = input.middle_name?.trim() ?? existing.middle_name;
  const position = input.position?.trim() ?? existing.position;
  const sortOrder = input.sort_order ?? existing.sort_order ?? 0;
  const isActive = input.is_active ?? existing.is_active !== false;
  const fullName = buildSalesManagerFullName(lastName, firstName, middleName);

  const { rows } = await pool.query<SalesManagerRow>(
    `UPDATE sales_managers
     SET last_name = $2, first_name = $3, middle_name = $4, position = $5, full_name = $6,
         sort_order = $7, is_active = $8, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, lastName, firstName, middleName, position, fullName, sortOrder, isActive],
  );
  return rows[0] ? rowToSalesManager(rows[0]) : null;
}

export async function deleteSalesManager(id: string): Promise<{ ok: boolean; error?: string; soft?: boolean }> {
  const existing = await getSalesManagerById(id);
  if (!existing) return { ok: false, error: "Sales manager not found" };

  const usage = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM supply_links WHERE sales_manager_id = $1`,
    [id],
  );
  const inUse = Number(usage.rows[0].count) > 0;

  if (inUse) {
    await pool.query(`UPDATE sales_managers SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    return { ok: true, soft: true };
  }

  await pool.query(`DELETE FROM sales_managers WHERE id = $1`, [id]);
  return { ok: true, soft: false };
}
