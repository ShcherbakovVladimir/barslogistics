import type { SupplyLink } from '../types';

export type ShipmentSortKey =
  | 'date_desc'
  | 'date_asc'
  | 'eta_asc'
  | 'eta_desc'
  | 'updated_desc';

function parseShipmentDate(link: SupplyLink): number {
  const raw = link.shipment_date || link.period;
  if (!raw) return 0;
  const iso = raw.length === 4 ? `${raw}-01-01` : raw;
  const ts = Date.parse(iso);
  return Number.isNaN(ts) ? 0 : ts;
}

function parseEtaDate(link: SupplyLink): number {
  if (link.eta_at) {
    const ts = Date.parse(link.eta_at);
    if (!Number.isNaN(ts)) return ts;
  }
  if (link.eta?.trim()) {
    const ts = Date.parse(link.eta);
    if (!Number.isNaN(ts)) return ts;
  }
  return Number.MAX_SAFE_INTEGER;
}

function parseUpdatedDate(link: SupplyLink): number {
  if (!link.last_updated) return 0;
  const ts = Date.parse(link.last_updated);
  return Number.isNaN(ts) ? 0 : ts;
}

export function compareShipments(a: SupplyLink, b: SupplyLink, sortBy: ShipmentSortKey): number {
  switch (sortBy) {
    case 'date_asc':
      return parseShipmentDate(a) - parseShipmentDate(b);
    case 'date_desc':
      return parseShipmentDate(b) - parseShipmentDate(a);
    case 'eta_asc':
      return parseEtaDate(a) - parseEtaDate(b);
    case 'eta_desc':
      return parseEtaDate(b) - parseEtaDate(a);
    case 'updated_desc':
      return parseUpdatedDate(b) - parseUpdatedDate(a);
    default:
      return 0;
  }
}

export function sortShipments(links: SupplyLink[], sortBy: ShipmentSortKey): SupplyLink[] {
  return [...links].sort((a, b) => compareShipments(a, b, sortBy));
}
