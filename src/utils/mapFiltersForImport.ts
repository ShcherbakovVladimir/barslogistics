import type { FilterState, SupplyLink } from '../types';
import { createDefaultFilterState } from './mapFilterDefaults';
import { defaultPeriodFilter } from './periodFilter';

/** Map filters that reveal internally imported shipments (date range derived from data). */
export function mapFiltersForImportedShipments(
  links: SupplyLink[],
  overrides?: Partial<FilterState>,
): FilterState {
  const imported = links.filter(
    l => l.id.startsWith('sh_imp_') || l.id.startsWith('sh_prev_') || l.flow_type === 'internal',
  );

  if (imported.length === 0) {
    return createDefaultFilterState({
      viewMode: 'shipments',
      searchQuery: '',
      contours: [],
      ourSites: [],
      flowTypes: [],
      products: [],
      statuses: [],
      period: defaultPeriodFilter(),
      ...overrides,
    });
  }

  const dates = imported
    .map(l => l.shipment_date)
    .filter((d): d is string => Boolean(d))
    .sort();

  const start = dates[0];
  const end = dates[dates.length - 1];
  const period = start && end
    ? {
        mode: 'range' as const,
        granularity: 'year' as const,
        year: Number(start.slice(0, 4)),
        rangeStart: start,
        rangeEnd: end,
      }
    : defaultPeriodFilter();

  return createDefaultFilterState({
    viewMode: 'shipments',
    searchQuery: '',
    contours: [],
    ourSites: [],
    flowTypes: [],
    products: [],
    statuses: [],
    period,
    ...overrides,
  });
}
