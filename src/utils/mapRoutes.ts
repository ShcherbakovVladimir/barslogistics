import type { Factory, SupplyLink } from '../types';

export type RoutePoint = [number, number];

/** Build a quadratic curve between two factories; parallel routes get alternating offsets. */
export function buildRoutePoints(
  origin: Factory,
  destination: Factory,
  parallelIndex = 0,
): RoutePoint[] {
  const lat1 = origin.latitude;
  const lng1 = origin.longitude;
  const lat2 = destination.latitude;
  const lng2 = destination.longitude;

  if (lat1 === lat2 && lng1 === lng2) {
    return [[lat1, lng1]];
  }

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  const curveSign = parallelIndex % 2 === 0 ? 1 : -1;
  const curveMag = parallelIndex === 0 ? 0 : 0.06 + Math.floor(parallelIndex / 2) * 0.05;
  const controlLat = midLat - dx * curveMag * curveSign;
  const controlLng = midLng + dy * curveMag * curveSign;

  const points: RoutePoint[] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

/** Position along route by progress 0–100 (matches the drawn curve). */
export function pointOnRoute(points: RoutePoint[], progressPct: number): RoutePoint {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  const p = Math.max(0, Math.min(100, progressPct)) / 100;
  const idx = p * (points.length - 1);
  const i = Math.floor(idx);
  const frac = idx - i;

  if (i >= points.length - 1) return points[points.length - 1];

  const [lat1, lng1] = points[i];
  const [lat2, lng2] = points[i + 1];
  return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

/** Running index per origin→destination pair for curve offset. */
export function buildRouteParallelIndex(links: SupplyLink[]): Map<string, number> {
  const running = new Map<string, number>();
  const result = new Map<string, number>();

  for (const link of links) {
    const pairKey = `${link.origin_id}→${link.destination_id}`;
    const idx = running.get(pairKey) ?? 0;
    result.set(link.id, idx);
    running.set(pairKey, idx + 1);
  }
  return result;
}
