import crypto from "crypto";
import fs from "fs";
import path from "path";
import type {
  ShipmentDocument,
  ShipmentDocumentType,
  SupplyLink,
  TransportMode,
  User,
} from "../../src/types.js";
import { pool } from "../db.js";
import {
  decodeUploadFilename,
  safeStoredBasename,
} from "../chat/filename.js";
import {
  canCreateShipmentEvent,
  canViewShipmentEvents,
} from "../shipmentEvents.js";
import { getSupplyLinkById, updateSupplyLink } from "../repositories.js";
import { getShipmentMaxFileBytes, shipmentFileDir } from "./files.js";

const DOC_TYPES = new Set<ShipmentDocumentType>([
  "waybill",
  "cmr",
  "invoice",
  "packing_list",
  "customs",
  "certificate",
  "photo",
  "other",
]);

const TRANSPORT_MODES = new Set<TransportMode>([
  "road",
  "rail",
  "sea",
  "air",
  "multimodal",
]);

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

type DocRow = {
  id: string;
  shipment_id: string;
  uploaded_by: string;
  uploaded_by_name?: string | null;
  doc_type: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: string | number;
  note: string | null;
  created_at: Date | string;
};

function mapDocument(row: DocRow): ShipmentDocument {
  return {
    id: row.id,
    shipment_id: row.shipment_id,
    uploaded_by: row.uploaded_by,
    uploaded_by_name: row.uploaded_by_name || "",
    doc_type: (DOC_TYPES.has(row.doc_type as ShipmentDocumentType)
      ? row.doc_type
      : "other") as ShipmentDocumentType,
    original_name: decodeUploadFilename(String(row.original_name)),
    mime_type: row.mime_type,
    size_bytes: Number(row.size_bytes) || 0,
    note: row.note || "",
    created_at: new Date(row.created_at).toISOString(),
  };
}

async function assertCanView(shipmentId: string, user: User): Promise<SupplyLink> {
  const link = await getSupplyLinkById(shipmentId);
  if (!link) throw new Error("Shipment not found");
  if (!canViewShipmentEvents(user, link)) throw new Error("Forbidden");
  return link;
}

async function assertCanManage(shipmentId: string, user: User): Promise<SupplyLink> {
  const link = await getSupplyLinkById(shipmentId);
  if (!link) throw new Error("Shipment not found");
  if (!canCreateShipmentEvent(user, link)) throw new Error("Forbidden");
  return link;
}

export async function listShipmentDocuments(shipmentId: string, user: User): Promise<ShipmentDocument[]> {
  await assertCanView(shipmentId, user);
  const { rows } = await pool.query<DocRow>(
    `SELECT d.id, d.shipment_id, d.uploaded_by, u.name AS uploaded_by_name,
            d.doc_type, d.original_name, d.mime_type, d.size_bytes, d.note, d.created_at
     FROM shipment_documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.shipment_id = $1
     ORDER BY d.created_at DESC`,
    [shipmentId],
  );
  return rows.map(mapDocument);
}

export async function saveShipmentDocument(
  user: User,
  shipmentId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  options?: { doc_type?: string; note?: string },
): Promise<ShipmentDocument> {
  await assertCanManage(shipmentId, user);
  if (file.size <= 0) throw new Error("Empty file");
  if (file.size > getShipmentMaxFileBytes()) {
    throw new Error(`File exceeds limit of ${getShipmentMaxFileBytes()} bytes`);
  }

  const docTypeRaw = options?.doc_type ? String(options.doc_type) : "other";
  const docType: ShipmentDocumentType = DOC_TYPES.has(docTypeRaw as ShipmentDocumentType)
    ? (docTypeRaw as ShipmentDocumentType)
    : "other";

  const id = makeId("sdoc");
  const displayName = decodeUploadFilename(file.originalname);
  const safeBase = safeStoredBasename(displayName);
  const storedName = `${id}_${safeBase}`;
  const dir = shipmentFileDir(shipmentId);
  const storagePath = path.join(dir, storedName);
  fs.writeFileSync(storagePath, file.buffer, { mode: 0o640 });

  await pool.query(
    `INSERT INTO shipment_documents (
       id, shipment_id, uploaded_by, doc_type,
       original_name, stored_name, mime_type, size_bytes, storage_path, note
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      shipmentId,
      user.id,
      docType,
      displayName,
      storedName,
      file.mimetype || null,
      file.size,
      storagePath,
      options?.note?.trim() || "",
    ],
  );

  const list = await listShipmentDocuments(shipmentId, user);
  const saved = list.find((d) => d.id === id);
  if (!saved) throw new Error("Document save failed");
  return saved;
}

export async function getShipmentDocumentForDownload(
  documentId: string,
  user: User,
): Promise<{ storagePath: string; originalName: string; mimeType: string | null }> {
  const { rows } = await pool.query(
    `SELECT d.storage_path, d.original_name, d.mime_type, d.shipment_id
     FROM shipment_documents d
     WHERE d.id = $1`,
    [documentId],
  );
  const row = rows[0];
  if (!row) throw new Error("Document not found");
  await assertCanView(String(row.shipment_id), user);
  if (!fs.existsSync(String(row.storage_path))) throw new Error("File missing on disk");
  return {
    storagePath: String(row.storage_path),
    originalName: decodeUploadFilename(String(row.original_name)),
    mimeType: row.mime_type != null ? String(row.mime_type) : null,
  };
}

export async function deleteShipmentDocument(documentId: string, user: User): Promise<string> {
  const { rows } = await pool.query(
    `SELECT * FROM shipment_documents WHERE id = $1`,
    [documentId],
  );
  const row = rows[0];
  if (!row) throw new Error("Document not found");
  await assertCanManage(String(row.shipment_id), user);

  await pool.query(`DELETE FROM shipment_documents WHERE id = $1`, [documentId]);
  try {
    if (row.storage_path && fs.existsSync(String(row.storage_path))) {
      fs.unlinkSync(String(row.storage_path));
    }
  } catch {
    // best-effort disk cleanup
  }
  return String(row.shipment_id);
}

function optionalTrim(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "";
  return String(value).trim();
}

function optionalTimestamp(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new Error("Invalid timestamp");
  return d.toISOString();
}

export type LogisticsPatch = {
  transport_mode?: TransportMode | null;
  transport_asset_id?: string | null;
  vehicle_number?: string;
  trailer_number?: string;
  container_number?: string;
  seal_number?: string;
  waybill_number?: string;
  planned_departure_at?: string | null;
  planned_arrival_at?: string | null;
  actual_departure_at?: string | null;
  actual_arrival_at?: string | null;
  logistics_notes?: string;
  driver_info?: string;
};

export function parseLogisticsBody(body: Record<string, unknown>): LogisticsPatch {
  const patch: LogisticsPatch = {};

  if (body.transport_mode !== undefined) {
    if (body.transport_mode === null || body.transport_mode === "") {
      patch.transport_mode = null;
    } else {
      const mode = String(body.transport_mode);
      if (!TRANSPORT_MODES.has(mode as TransportMode)) {
        throw new Error("Invalid transport_mode");
      }
      patch.transport_mode = mode as TransportMode;
    }
  }

  if (body.transport_asset_id !== undefined) {
    if (body.transport_asset_id === null || body.transport_asset_id === "") {
      patch.transport_asset_id = null;
    } else {
      patch.transport_asset_id = String(body.transport_asset_id).trim();
    }
  }

  if (body.vehicle_number !== undefined) patch.vehicle_number = optionalTrim(body.vehicle_number);
  if (body.trailer_number !== undefined) patch.trailer_number = optionalTrim(body.trailer_number);
  if (body.container_number !== undefined) patch.container_number = optionalTrim(body.container_number);
  if (body.seal_number !== undefined) patch.seal_number = optionalTrim(body.seal_number);
  if (body.waybill_number !== undefined) patch.waybill_number = optionalTrim(body.waybill_number);
  if (body.logistics_notes !== undefined) patch.logistics_notes = optionalTrim(body.logistics_notes);
  if (body.driver_info !== undefined) patch.driver_info = optionalTrim(body.driver_info);

  if (body.planned_departure_at !== undefined) {
    patch.planned_departure_at = optionalTimestamp(body.planned_departure_at);
  }
  if (body.planned_arrival_at !== undefined) {
    patch.planned_arrival_at = optionalTimestamp(body.planned_arrival_at);
  }
  if (body.actual_departure_at !== undefined) {
    patch.actual_departure_at = optionalTimestamp(body.actual_departure_at);
  }
  if (body.actual_arrival_at !== undefined) {
    patch.actual_arrival_at = optionalTimestamp(body.actual_arrival_at);
  }

  return patch;
}

export async function updateShipmentLogistics(
  shipmentId: string,
  user: User,
  body: Record<string, unknown>,
): Promise<SupplyLink> {
  await assertCanManage(shipmentId, user);
  const patch = parseLogisticsBody(body);
  const updated = await updateSupplyLink(shipmentId, patch as Partial<SupplyLink>, {
    user_id: user.id,
    username: user.username,
    action: "logistics_update",
    changes: JSON.stringify(patch),
  });
  if (!updated) throw new Error("Shipment not found");
  return updated;
}

export { DOC_TYPES, TRANSPORT_MODES };
