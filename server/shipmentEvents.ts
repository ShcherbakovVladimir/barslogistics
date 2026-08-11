import crypto from "crypto";
import type { CargoStatus, ShipmentEvent, ShipmentEventInput, ShipmentEventSource, SupplyLink, User } from "../src/types.js";
import { CARGO_STATUSES } from "../src/types.js";
import { isShipmentInUserScope } from "../src/utils/permissions.js";
import { pool } from "./db.js";
import { SYSTEM_ACTOR } from "./systemActor.js";
import {
  applyShipmentEventUpdates,
  getSupplyLinkById,
  insertShipmentEventRecord,
} from "./repositories.js";

export { SYSTEM_ACTOR };

const VALID_EVENT_TYPES = new Set(["status_change", "comment", "delay", "early", "eta_update"]);
const VALID_TIMING = new Set(["on_time", "delay", "early"]);

export function canCreateShipmentEvent(user: User, link: SupplyLink): boolean {
  if (user.role === "admin" || user.role === "manager") return true;
  if (user.role === "site_manager") return isShipmentInUserScope(link, user);
  return false;
}

export function canViewShipmentEvents(user: User, link: SupplyLink): boolean {
  if (user.role === "admin" || user.role === "key_person" || user.role === "manager") return true;
  if (user.role === "site_manager") return isShipmentInUserScope(link, user);
  return false;
}

function resolveStatus(input: ShipmentEventInput, existing: SupplyLink): CargoStatus | undefined {
  if (input.new_status && CARGO_STATUSES.includes(input.new_status)) {
    return input.new_status;
  }
  if (input.event_type === "delay") return "delayed";
  if (input.event_type === "early" && existing.status === "delayed") return "en_route";
  return undefined;
}

function resolveTimingKind(input: ShipmentEventInput): ShipmentEvent["timing_kind"] | undefined {
  if (input.timing_kind && VALID_TIMING.has(input.timing_kind)) return input.timing_kind;
  if (input.event_type === "delay") return "delay";
  if (input.event_type === "early") return "early";
  if (input.event_type === "status_change" || input.event_type === "comment") return "on_time";
  return undefined;
}

export async function recordShipmentEvent(
  shipmentId: string,
  input: ShipmentEventInput,
  user: Pick<User, "id" | "username" | "name">,
  source: ShipmentEvent["source"] = "manual",
): Promise<{ event: ShipmentEvent; shipment: SupplyLink }> {
  if (!VALID_EVENT_TYPES.has(input.event_type)) {
    throw new Error("Invalid event type");
  }

  const existing = await getSupplyLinkById(shipmentId);
  if (!existing) {
    throw new Error("Shipment not found");
  }

  if (input.event_type === "status_change" && !input.new_status) {
    throw new Error("Status is required for status change events");
  }

  if (input.event_type === "comment" && !input.comment?.trim()) {
    throw new Error("Comment is required");
  }

  if ((input.event_type === "delay" || input.event_type === "early") && !input.comment?.trim() && !input.delay_reason?.trim()) {
    throw new Error("Comment or delay reason is required");
  }

  const newStatus = resolveStatus(input, existing);
  const timingKind = resolveTimingKind(input);

  const event: ShipmentEvent = {
    id: `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    shipment_id: shipmentId,
    event_type: input.event_type,
    old_status: existing.status,
    new_status: newStatus,
    timing_kind: timingKind,
    delay_reason: input.delay_reason?.trim() || undefined,
    delay_hours: input.delay_hours != null ? Number(input.delay_hours) : undefined,
    early_hours: input.early_hours != null ? Number(input.early_hours) : undefined,
    comment: input.comment?.trim() || undefined,
    eta_before: existing.eta,
    eta_after: input.eta_after?.trim() || undefined,
    origin_id: input.origin_id || existing.origin_id,
    destination_id: input.destination_id || existing.destination_id,
    product_id: input.product_id || existing.product_id,
    user_id: user.id,
    username: user.username,
    source,
    created_at: new Date().toISOString(),
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await insertShipmentEventRecord(client, event);
    const shipment = await applyShipmentEventUpdates(client, shipmentId, event);
    if (!shipment) {
      throw new Error("Failed to update shipment");
    }

    await client.query(
      `INSERT INTO shipment_change_logs (id, shipment_id, user_id, username, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log_${event.id}`,
        shipmentId,
        user.id,
        user.username,
        "update",
        JSON.stringify({
          event_type: event.event_type,
          old_status: event.old_status,
          new_status: event.new_status,
          timing_kind: event.timing_kind,
          comment: event.comment,
          delay_reason: event.delay_reason,
        }),
      ],
    );

    await client.query("COMMIT");
    return { event, shipment };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Audit-only event when telemetry already updated supply_links (no duplicate mutation). */
export async function recordTelemetryAuditEvent(params: {
  shipmentId: string;
  oldStatus: CargoStatus;
  newStatus: CargoStatus;
  lat: number;
  lng: number;
  speed_kmh?: number;
  progress_pct: number;
  existing: SupplyLink;
  source?: ShipmentEventSource;
}): Promise<ShipmentEvent> {
  const {
    shipmentId,
    oldStatus,
    newStatus,
    lat,
    lng,
    speed_kmh,
    progress_pct,
    existing,
    source = "telemetry",
  } = params;

  const speedPart = speed_kmh != null ? `, ${Math.round(speed_kmh)} km/h` : "";
  const comment = `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}${speedPart}, ${progress_pct}%`;

  const event: ShipmentEvent = {
    id: `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    shipment_id: shipmentId,
    event_type: newStatus === "delayed" ? "delay" : "status_change",
    old_status: oldStatus,
    new_status: newStatus,
    timing_kind: newStatus === "delayed" ? "delay" : newStatus === "arrived" ? "on_time" : "on_time",
    delay_reason: newStatus === "delayed" ? comment : undefined,
    comment,
    eta_before: existing.eta,
    origin_id: existing.origin_id,
    destination_id: existing.destination_id,
    product_id: existing.product_id,
    user_id: SYSTEM_ACTOR.id,
    username: SYSTEM_ACTOR.username,
    source,
    created_at: new Date().toISOString(),
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await insertShipmentEventRecord(client, event);
    await client.query(
      `INSERT INTO shipment_change_logs (id, shipment_id, user_id, username, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log_${event.id}`,
        shipmentId,
        SYSTEM_ACTOR.id,
        SYSTEM_ACTOR.username,
        "update",
        JSON.stringify({
          event_type: event.event_type,
          old_status: event.old_status,
          new_status: event.new_status,
          source: event.source,
          comment: event.comment,
        }),
      ],
    );
    await client.query("COMMIT");
    return event;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Backward-compatible status update via event pipeline */
export async function recordStatusChangeEvent(
  shipmentId: string,
  status: CargoStatus,
  user: Pick<User, "id" | "username" | "name">,
  delayReason?: string,
  source: ShipmentEvent["source"] = "manual",
): Promise<{ event: ShipmentEvent; shipment: SupplyLink }> {
  const timing_kind = status === "delayed" ? "delay" as const : "on_time" as const;
  return recordShipmentEvent(
    shipmentId,
    {
      event_type: status === "delayed" ? "delay" : "status_change",
      new_status: status,
      timing_kind,
      delay_reason: delayReason,
      comment: delayReason,
    },
    user,
    source,
  );
}
