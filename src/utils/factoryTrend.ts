import type { Factory, FilterState, Product, SupplyLink, User } from '../types';
import { matchesShipmentLinkFilters } from './mapFilter';
import { getPreviousYearPeriod, matchesPeriodFilter } from './periodFilter';
import { addPrimaryVolume } from './shipmentVolume';

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export type FactorySalesTrendDirection = 'up' | 'down' | 'flat' | 'none';

export interface FactorySalesTrend {
  currentVolume: number;
  previousVolume: number;
  direction: FactorySalesTrendDirection;
}

const VOLUME_EPS = 0.01;

function resolveDirection(current: number, previous: number): FactorySalesTrendDirection {
  if (current <= VOLUME_EPS && previous <= VOLUME_EPS) return 'none';
  const delta = current - previous;
  if (Math.abs(delta) <= VOLUME_EPS) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

/**
 * YoY sales trend per factory: selected period vs the same slot in the previous year.
 * Volume is attributed once per shipment (origin factory).
 */
export function computeFactorySalesTrends(
  factories: Factory[],
  supplyLinks: SupplyLink[],
  filters: FilterState,
  user?: User | null,
  products?: Product[],
): Map<string, FactorySalesTrend> {
  const result = new Map<string, FactorySalesTrend>();
  if (filters.viewMode !== 'shipments') return result;

  const factoryMap = new Map(factories.map(f => [f.id, f]));
  const currentPeriod = filters.period;
  const previousPeriod = getPreviousYearPeriod(currentPeriod);

  const currentVolumes = new Map<string, number>();
  const previousVolumes = new Map<string, number>();

  for (const link of supplyLinks) {
    if (!matchesShipmentLinkFilters(link, factoryMap, filters, user, products)) continue;

    const vol = link.volume ?? 0;
    if (vol <= 0) continue;

    if (matchesPeriodFilter(link, currentPeriod)) {
      addPrimaryVolume(currentVolumes, link);
    }
    if (matchesPeriodFilter(link, previousPeriod)) {
      addPrimaryVolume(previousVolumes, link);
    }
  }

  const factoryIds = new Set<string>([
    ...currentVolumes.keys(),
    ...previousVolumes.keys(),
  ]);

  for (const factoryId of factoryIds) {
    const currentVolume = currentVolumes.get(factoryId) ?? 0;
    const previousVolume = previousVolumes.get(factoryId) ?? 0;
    const direction = resolveDirection(currentVolume, previousVolume);
    if (direction === 'none') continue;
    result.set(factoryId, { currentVolume, previousVolume, direction });
  }

  return result;
}

export function buildFactoryTrendBadgeHtml(direction: FactorySalesTrendDirection, title?: string): string {
  if (direction === 'none') return '';

  const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';

  if (direction === 'up') {
    return `
      <span class="factory-trend-badge factory-trend-up"${titleAttr}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M5 1.5L8.5 6H1.5L5 1.5Z" fill="currentColor"/>
        </svg>
      </span>`;
  }

  if (direction === 'down') {
    return `
      <span class="factory-trend-badge factory-trend-down"${titleAttr}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M5 8.5L1.5 4H8.5L5 8.5Z" fill="currentColor"/>
        </svg>
      </span>`;
  }

  return `
    <span class="factory-trend-badge factory-trend-flat"${titleAttr}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <rect x="1.5" y="4.25" width="7" height="1.5" rx="0.75" fill="currentColor"/>
      </svg>
    </span>`;
}
