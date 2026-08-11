/**
 * Client-side avg delivery hours — mirrors server/analytics.ts fetchAvgDeliveryHours
 * using shipment_date → last_updated for arrived shipments (no shipment_events on client).
 */
import type { SupplyLink } from '../types';

export function computeAvgDeliveryHours(links: SupplyLink[]): number {
  const hours: number[] = [];

  for (const link of links) {
    if (!link.shipment_date || link.status !== 'arrived') continue;
    const start = new Date(`${link.shipment_date}T00:00:00`).getTime();
    const end = link.last_updated ? new Date(link.last_updated).getTime() : Number.NaN;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    hours.push((end - start) / 3_600_000);
  }

  if (hours.length === 0) return 0;
  return Math.round((hours.reduce((sum, h) => sum + h, 0) / hours.length) * 10) / 10;
}
