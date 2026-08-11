import type { Factory, SupplyLink, User } from "../src/types.js";
import {
  getUserSiteIds,
  hasFullMapAccess,
  isFactoryInUserScope,
  isShipmentInUserScope,
  maskSupplyLinkFinancials,
} from "../src/utils/permissions.js";

export function filterSupplyLinksForUser(links: SupplyLink[], user: User): SupplyLink[] {
  return links.filter(link => isShipmentInUserScope(link, user));
}

export function maskSupplyLinksForUser(links: SupplyLink[], user: User): SupplyLink[] {
  return links.map(link => maskSupplyLinkFinancials(link, user));
}

/** Filter by role/site scope and strip financial fields the user cannot see. */
export function scopeSupplyLinksForUser(links: SupplyLink[], user: User): SupplyLink[] {
  return maskSupplyLinksForUser(filterSupplyLinksForUser(links, user), user);
}

export function filterFactoriesForUser(
  factories: Factory[],
  scopedLinks: SupplyLink[],
  user: User,
): Factory[] {
  if (hasFullMapAccess(user.role)) return factories;

  const linkedIds = new Set<string>();
  for (const link of scopedLinks) {
    linkedIds.add(link.origin_id);
    linkedIds.add(link.destination_id);
  }

  return factories.filter(factory => isFactoryInUserScope(factory, user, linkedIds));
}

type WsPayload = Record<string, unknown>;

function shipmentFromPayload(
  payload: WsPayload,
  shipmentScope?: Map<string, SupplyLink>,
): SupplyLink | null {
  const embedded = payload.shipment as SupplyLink | undefined;
  if (embedded?.id) return embedded;

  const shipmentId = payload.shipment_id as string | undefined;
  if (shipmentId && shipmentScope?.has(shipmentId)) {
    return shipmentScope.get(shipmentId)!;
  }
  return null;
}

function isShipmentPayloadInScope(
  payload: WsPayload,
  user: User,
  shipmentScope?: Map<string, SupplyLink>,
): boolean {
  const link = shipmentFromPayload(payload, shipmentScope);
  if (link) return isShipmentInUserScope(link, user);
  return hasFullMapAccess(user.role);
}

function filterLiveTelemetryPayload(
  payload: WsPayload,
  user: User,
  shipmentScope?: Map<string, SupplyLink>,
): WsPayload {
  const shipments = payload.shipments as Array<{ id: string }> | undefined;
  if (!Array.isArray(shipments)) return payload;

  const visible = shipments.filter(update => {
    const link = shipmentScope?.get(update.id);
    if (link) return isShipmentInUserScope(link, user);
    return hasFullMapAccess(user.role);
  });

  return { ...payload, shipments: visible };
}

export function shouldDeliverWebSocketMessage(
  payload: WsPayload,
  user: User,
  shipmentScope?: Map<string, SupplyLink>,
): boolean {
  const type = payload.type as string;

  switch (type) {
    case "FACTORY_ADDED":
    case "FACTORY_UPDATED": {
      const factory = payload.factory as Factory | undefined;
      return factory ? isFactoryInUserScope(factory, user) : hasFullMapAccess(user.role);
    }
    case "FACTORY_DELETED": {
      const factoryId = payload.factoryId as string | undefined;
      if (!factoryId) return hasFullMapAccess(user.role);
      const siteIds = getUserSiteIds(user);
      return hasFullMapAccess(user.role) || siteIds.includes(factoryId);
    }
    case "SHIPMENT_EVENT":
    case "SHIPMENT_STATUS_UPDATE":
    case "CARGO_ARRIVED":
      return isShipmentPayloadInScope(payload, user, shipmentScope);
    case "LIVE_TELEMETRY_UPDATE": {
      const filtered = filterLiveTelemetryPayload(payload, user, shipmentScope);
      const list = filtered.shipments as unknown[] | undefined;
      return Array.isArray(list) && list.length > 0;
    }
    case "MAP_DATA_IMPORTED":
    case "PRODUCTS_UPDATED":
    case "SALES_MANAGERS_UPDATED":
    case "CARRIERS_UPDATED":
    case "SITES_MERGED":
      return true;
    case "CHAT_MESSAGE":
    case "CHAT_READ": {
      const ids = payload.participant_ids as string[] | undefined;
      return Array.isArray(ids) && ids.includes(user.id);
    }
    default:
      return hasFullMapAccess(user.role);
  }
}

export function personalizeWebSocketPayload(
  payload: WsPayload,
  user: User,
  shipmentScope?: Map<string, SupplyLink>,
): WsPayload {
  const type = payload.type as string;

  if (type === "LIVE_TELEMETRY_UPDATE") {
    return filterLiveTelemetryPayload(payload, user, shipmentScope);
  }

  if (type === "SHIPMENT_EVENT" && payload.shipment) {
    return {
      ...payload,
      shipment: maskSupplyLinkFinancials(payload.shipment as SupplyLink, user),
    };
  }

  return payload;
}

export function scopeSupplyLinkForUser(link: SupplyLink, user: User): SupplyLink | null {
  if (!isShipmentInUserScope(link, user)) return null;
  return maskSupplyLinkFinancials(link, user);
}

/** Validate that a user may create/affect a shipment touching the given endpoints. */
export function assertShipmentCreateInScope(
  link: Pick<SupplyLink, "origin_id" | "destination_id" | "site_id">,
  user: User,
): boolean {
  if (hasFullMapAccess(user.role)) return true;
  const siteIds = new Set(getUserSiteIds(user));
  if (siteIds.size === 0) return false;
  if (siteIds.has(link.origin_id) || siteIds.has(link.destination_id)) return true;
  if (link.site_id != null && siteIds.has(link.site_id)) return true;
  return false;
}
