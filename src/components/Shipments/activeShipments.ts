import type { CargoStatus, SupplyLink } from '../../types';

/** Same trackable set as the map vehicle layer (excludes arrived). */
export const ACTIVE_SHIPMENT_STATUSES: CargoStatus[] = ['en_route', 'delayed', 'alert', 'loading'];

export function isActiveShipment(link: SupplyLink): boolean {
  return ACTIVE_SHIPMENT_STATUSES.includes(link.status || 'en_route');
}
