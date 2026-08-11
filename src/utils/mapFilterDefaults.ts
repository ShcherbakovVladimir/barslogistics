import type { FilterState } from '../types';
import { defaultPeriodFilter } from './periodFilter';

export function createDefaultFilterState(overrides?: Partial<FilterState>): FilterState {
  return {
    viewMode: 'shipments',
    searchQuery: '',
    contours: [],
    factoryTypes: [],
    ourSites: [],
    flowTypes: [],
    products: [],
    carriers: [],
    managers: [],
    period: defaultPeriodFilter(),
    compareEnabled: false,
    compare: undefined,
    ownership: 'all',
    sources: [],
    statuses: [],
    countries: [],
    holdings: [],
    cargoTypes: [],
    ...overrides,
  };
}
