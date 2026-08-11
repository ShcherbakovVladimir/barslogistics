import type { SupplyLink } from '../types';

/**
 * Attribute shipment volume to one factory (avoids double-counting origin + destination).
 * Priority: site_id → origin (if ours) → destination (if ours) → origin.
 */
export function primaryVolumeFactoryId(
  link: SupplyLink,
  ourSiteIds?: Set<string>,
): string | null {
  if (ourSiteIds && ourSiteIds.size > 0) {
    if (link.site_id && ourSiteIds.has(link.site_id)) return link.site_id;
    if (ourSiteIds.has(link.origin_id)) return link.origin_id;
    if (ourSiteIds.has(link.destination_id)) return link.destination_id;
    return null;
  }
  return link.origin_id || null;
}

export function addPrimaryVolume(
  map: Map<string, number>,
  link: SupplyLink,
  ourSiteIds?: Set<string>,
): void {
  const factoryId = primaryVolumeFactoryId(link, ourSiteIds);
  const vol = link.volume ?? 0;
  if (!factoryId || vol <= 0) return;
  map.set(factoryId, (map.get(factoryId) ?? 0) + vol);
}
