import crypto from "crypto";
import { pool } from "../db.js";
import type { TransportAsset, TransportAssetInput, TransportPurpose } from "../../src/types.js";
import {
  TRANSPORT_PURPOSES,
  findTransportType,
} from "../../src/constants/transportAssets.js";
import { unlinkTransportPhotoFile } from "./photos.js";

type TransportAssetRow = {
  id: string;
  name: string;
  purpose: string;
  category: string;
  type_key: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  vehicle_number: string | null;
  trailer_number: string | null;
  container_number: string | null;
  vin: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  inventory_number: string | null;
  waybill_number: string | null;
  driver_info: string | null;
  description: string | null;
  specs_note: string | null;
  site_id: string | null;
  photo_path: string | null;
  photo_mime: string | null;
  photo_updated_at: Date | string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
};

function optionalStr(value: string | null | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function mapRow(row: TransportAssetRow): TransportAsset {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose as TransportPurpose,
    category: row.category,
    type_key: row.type_key,
    brand: optionalStr(row.brand),
    model: optionalStr(row.model),
    year: row.year ?? undefined,
    vehicle_number: optionalStr(row.vehicle_number),
    trailer_number: optionalStr(row.trailer_number),
    container_number: optionalStr(row.container_number),
    vin: optionalStr(row.vin),
    chassis_number: optionalStr(row.chassis_number),
    engine_number: optionalStr(row.engine_number),
    inventory_number: optionalStr(row.inventory_number),
    waybill_number: optionalStr(row.waybill_number),
    driver_info: optionalStr(row.driver_info),
    description: optionalStr(row.description),
    specs_note: optionalStr(row.specs_note),
    site_id: optionalStr(row.site_id),
    has_photo: Boolean(row.photo_path),
    photo_version: row.photo_updated_at ? new Date(row.photo_updated_at).toISOString() : undefined,
    is_active: row.is_active !== false,
    sort_order: row.sort_order ?? 0,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

function normalizePurpose(value: unknown): TransportPurpose {
  const p = String(value || "both");
  if ((TRANSPORT_PURPOSES as string[]).includes(p)) return p as TransportPurpose;
  throw new Error("Invalid purpose");
}

function normalizeTypeKey(typeKey: string, category?: string): { type_key: string; category: string } {
  const key = typeKey.trim();
  const def = findTransportType(key);
  if (!def) throw new Error("Invalid type_key");
  if (category && category !== def.category) throw new Error("Invalid category for type");
  return { type_key: def.key, category: def.category };
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = String(value).trim();
  return t || null;
}

export async function getAllTransportAssets(opts?: {
  activeOnly?: boolean;
  purpose?: TransportPurpose | "all";
  siteId?: string;
}): Promise<TransportAsset[]> {
  const activeOnly = opts?.activeOnly !== false;
  const purpose = opts?.purpose && opts.purpose !== "all" ? opts.purpose : null;
  const siteId = opts?.siteId?.trim() || null;

  const clauses: string[] = [];
  const params: unknown[] = [];

  if (activeOnly) clauses.push("is_active = TRUE");
  if (purpose) {
    params.push(purpose);
    clauses.push(`(purpose = $${params.length} OR purpose = 'both')`);
  }
  if (siteId) {
    params.push(siteId);
    clauses.push(`site_id = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query<TransportAssetRow>(
    `SELECT * FROM transport_assets ${where} ORDER BY sort_order, name`,
    params,
  );
  return rows.map(mapRow);
}

export async function getTransportAssetById(id: string): Promise<TransportAsset | null> {
  const { rows } = await pool.query<TransportAssetRow>(
    `SELECT * FROM transport_assets WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createTransportAsset(input: TransportAssetInput): Promise<TransportAsset> {
  const name = input.name?.trim();
  if (!name) throw new Error("Name is required");
  const purpose = normalizePurpose(input.purpose);
  const { type_key, category } = normalizeTypeKey(input.type_key, input.category);

  const id = input.id?.trim() || `ta_${crypto.randomUUID()}`;
  const year =
    input.year != null && Number.isFinite(Number(input.year)) ? Math.floor(Number(input.year)) : null;

  const { rows } = await pool.query<TransportAssetRow>(
    `INSERT INTO transport_assets (
       id, name, purpose, category, type_key, brand, model, year,
       vehicle_number, trailer_number, container_number, vin, chassis_number, engine_number,
       inventory_number, waybill_number, driver_info, description, specs_note, site_id,
       is_active, sort_order
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,
       $9,$10,$11,$12,$13,$14,
       $15,$16,$17,$18,$19,$20,
       $21,$22
     ) RETURNING *`,
    [
      id,
      name,
      purpose,
      category,
      type_key,
      trimOrNull(input.brand),
      trimOrNull(input.model),
      year,
      trimOrNull(input.vehicle_number),
      trimOrNull(input.trailer_number),
      trimOrNull(input.container_number),
      trimOrNull(input.vin),
      trimOrNull(input.chassis_number),
      trimOrNull(input.engine_number),
      trimOrNull(input.inventory_number),
      trimOrNull(input.waybill_number),
      trimOrNull(input.driver_info),
      trimOrNull(input.description),
      trimOrNull(input.specs_note),
      trimOrNull(input.site_id),
      input.is_active !== false,
      input.sort_order ?? 0,
    ],
  );
  const created = rows[0];
  if (!created) throw new Error("Failed to create transport asset");
  return mapRow(created);
}

export async function updateTransportAsset(
  id: string,
  input: Partial<TransportAssetInput>,
): Promise<TransportAsset | null> {
  const existing = await getTransportAssetById(id);
  if (!existing) return null;

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  if (!name) throw new Error("Name is required");

  const purpose =
    input.purpose !== undefined ? normalizePurpose(input.purpose) : existing.purpose;
  const typeKey = input.type_key !== undefined ? input.type_key : existing.type_key;
  const { type_key, category } = normalizeTypeKey(typeKey, input.category ?? existing.category);

  const year =
    input.year !== undefined
      ? input.year == null || input.year === ("" as unknown as number)
        ? null
        : Number.isFinite(Number(input.year))
          ? Math.floor(Number(input.year))
          : existing.year ?? null
      : existing.year ?? null;

  const { rows } = await pool.query<TransportAssetRow>(
    `UPDATE transport_assets SET
       name = $2,
       purpose = $3,
       category = $4,
       type_key = $5,
       brand = $6,
       model = $7,
       year = $8,
       vehicle_number = $9,
       trailer_number = $10,
       container_number = $11,
       vin = $12,
       chassis_number = $13,
       engine_number = $14,
       inventory_number = $15,
       waybill_number = $16,
       driver_info = $17,
       description = $18,
       specs_note = $19,
       site_id = $20,
       is_active = $21,
       sort_order = $22,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      name,
      purpose,
      category,
      type_key,
      input.brand !== undefined ? trimOrNull(input.brand) : existing.brand ?? null,
      input.model !== undefined ? trimOrNull(input.model) : existing.model ?? null,
      year,
      input.vehicle_number !== undefined
        ? trimOrNull(input.vehicle_number)
        : existing.vehicle_number ?? null,
      input.trailer_number !== undefined
        ? trimOrNull(input.trailer_number)
        : existing.trailer_number ?? null,
      input.container_number !== undefined
        ? trimOrNull(input.container_number)
        : existing.container_number ?? null,
      input.vin !== undefined ? trimOrNull(input.vin) : existing.vin ?? null,
      input.chassis_number !== undefined
        ? trimOrNull(input.chassis_number)
        : existing.chassis_number ?? null,
      input.engine_number !== undefined
        ? trimOrNull(input.engine_number)
        : existing.engine_number ?? null,
      input.inventory_number !== undefined
        ? trimOrNull(input.inventory_number)
        : existing.inventory_number ?? null,
      input.waybill_number !== undefined
        ? trimOrNull(input.waybill_number)
        : existing.waybill_number ?? null,
      input.driver_info !== undefined
        ? trimOrNull(input.driver_info)
        : existing.driver_info ?? null,
      input.description !== undefined
        ? trimOrNull(input.description)
        : existing.description ?? null,
      input.specs_note !== undefined
        ? trimOrNull(input.specs_note)
        : existing.specs_note ?? null,
      input.site_id !== undefined ? trimOrNull(input.site_id) : existing.site_id ?? null,
      input.is_active !== undefined ? input.is_active !== false : existing.is_active !== false,
      input.sort_order !== undefined ? input.sort_order : existing.sort_order ?? 0,
    ],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteTransportAsset(
  id: string,
): Promise<{ ok: boolean; soft?: boolean; error?: string }> {
  const { rows } = await pool.query<{ photo_path: string | null }>(
    `SELECT photo_path FROM transport_assets WHERE id = $1`,
    [id],
  );
  if (!rows[0]) return { ok: false, error: "Transport asset not found" };

  const usage = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM supply_links WHERE transport_asset_id = $1`,
    [id],
  );
  const inUse = Number(usage.rows[0]?.count ?? 0) > 0;

  if (inUse) {
    await pool.query(
      `UPDATE transport_assets SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [id],
    );
    return { ok: true, soft: true };
  }

  await pool.query(`DELETE FROM transport_assets WHERE id = $1`, [id]);
  await unlinkTransportPhotoFile(rows[0].photo_path);
  return { ok: true, soft: false };
}
