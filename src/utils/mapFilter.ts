import type {
  Factory, SupplyLink, FilterState, User, AggregatedRoute, FlowType, Product,
} from '../types';
import { mapCargoTypeToProductId } from '../constants/products';
import { inferFlowType } from './flowType';
import { matchesPeriodFilter } from './periodFilter';
import {
  isShipmentInUserScope,
} from './permissions';

export interface MapFilterResult {
  filteredFactories: Factory[];
  filteredLinks: SupplyLink[];
  aggregatedRoutes: AggregatedRoute[];
}

function resolveProductId(link: SupplyLink, catalog?: Product[]): string {
  return link.product_id || mapCargoTypeToProductId(link.cargo_type, catalog);
}

function matchesCarrierFilter(link: SupplyLink, filterCarriers: string[]): boolean {
  if (filterCarriers.length === 0) return true;
  if (link.carrier_id && filterCarriers.includes(link.carrier_id)) return true;
  return false;
}

function matchesManagerFilter(link: SupplyLink, filterManagers: string[]): boolean {
  if (filterManagers.length === 0) return true;
  const managerId = link.sales_manager_id || link.manager_id;
  if (managerId && filterManagers.includes(managerId)) return true;
  return false;
}

/** Filter match: «Скрапы» also includes legacy scrap product ids from older data */
function matchesProductFilter(productId: string, filterProducts: string[]): boolean {
  if (filterProducts.length === 0) return true;
  if (filterProducts.includes(productId)) return true;
  if (
    filterProducts.includes('scraps')
    && (productId === 'scrap_steel' || productId === 'scrap_steel_dp')
  ) {
    return true;
  }
  return false;
}

function resolveFlowType(link: SupplyLink, factoryMap: Map<string, Factory>): FlowType {
  if (link.flow_type) return link.flow_type;
  const orig = factoryMap.get(link.origin_id);
  const dest = factoryMap.get(link.destination_id);
  return inferFlowType(orig, dest);
}

function matchesContourFilter(
  isOurs: boolean,
  contours: FilterState['contours'],
): boolean {
  const showOuter = contours.length === 0 || contours.includes('outer');
  const showInner = contours.length === 0 || contours.includes('inner');
  const contour = isOurs ? 'inner' : 'outer';

  if (!showOuter && !showInner) return false;
  if (showOuter && !showInner) return contour === 'outer';
  if (showInner && !showOuter) return contour === 'inner';
  return true;
}

function filterSiteFactory(f: Factory, filters: FilterState): boolean {
  if (f.is_active === false) return false;

  if (!matchesContourFilter(f.is_ours, filters.contours)) return false;

  if (f.is_ours) {
    if (filters.ourSites.length > 0 && !filters.ourSites.includes(f.id)) return false;
  } else if (filters.factoryTypes.length > 0 && !filters.factoryTypes.includes(f.type)) {
    return false;
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    const hay = [f.id, f.name, f.region, f.holding, f.code, f.address, f.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

function filterSitesMode(
  factories: Factory[],
  filters: FilterState,
  highlightedFactoryId?: string | null,
): MapFilterResult {
  const facs = factories.filter(f => {
    if (highlightedFactoryId && f.id === highlightedFactoryId) return true;
    return filterSiteFactory(f, filters);
  });

  return { filteredFactories: facs, filteredLinks: [], aggregatedRoutes: [] };
}

function filterShipmentsMode(
  factories: Factory[],
  supplyLinks: SupplyLink[],
  filters: FilterState,
  user?: User | null,
  highlightedFactoryId?: string | null,
  products?: Product[],
): MapFilterResult {
  const factoryMap = new Map(factories.map(f => [f.id, f]));

  const links = supplyLinks.filter(link => {
    if (!matchesShipmentLinkFilters(link, factoryMap, filters, user, products)) return false;

    if (filters.compareEnabled && filters.compare) {
      const inPrimary = matchesPeriodFilter(link, filters.period);
      const inCompare = matchesPeriodFilter(link, filters.compare);
      if (!inPrimary && !inCompare) return false;
    } else if (!matchesPeriodFilter(link, filters.period)) {
      return false;
    }

    return true;
  });

  const routeEndpointIds = new Set<string>();
  links.forEach(l => {
    routeEndpointIds.add(l.origin_id);
    routeEndpointIds.add(l.destination_id);
  });

  const facs = factories.filter(f => {
    if (highlightedFactoryId && f.id === highlightedFactoryId) return true;
    if (!routeEndpointIds.has(f.id)) return false;

    if (f.is_ours) {
      if (filters.ourSites.length > 0 && !filters.ourSites.includes(f.id)) return false;
    } else if (filters.factoryTypes.length > 0 && !filters.factoryTypes.includes(f.type)) {
      return false;
    }
    return true;
  });

  const aggregatedRoutes = aggregateRoutes(links, factoryMap);

  return { filteredFactories: facs, filteredLinks: links, aggregatedRoutes };
}

/** Shipment link filters excluding period — shared by map filter and YoY trend. */
export function matchesShipmentLinkFilters(
  link: SupplyLink,
  factoryMap: Map<string, Factory>,
  filters: FilterState,
  user?: User | null,
  products?: Product[],
): boolean {
  const orig = factoryMap.get(link.origin_id);
  const dest = factoryMap.get(link.destination_id);
  if (!orig || !dest) return false;

  if (user && !isShipmentInUserScope(link, user)) return false;

  const productId = resolveProductId(link, products);
  if (!matchesProductFilter(productId, filters.products)) return false;

  if (!matchesCarrierFilter(link, filters.carriers)) return false;

  if (!matchesManagerFilter(link, filters.managers)) return false;

  const flow = resolveFlowType(link, factoryMap);
  if (filters.flowTypes.length > 0 && !filters.flowTypes.includes(flow)) return false;

  if (filters.sources.length > 0 && !filters.sources.includes(link.source)) return false;
  if (filters.statuses.length > 0 && link.status && !filters.statuses.includes(link.status)) return false;

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    const match =
      link.cargo_type.toLowerCase().includes(q) ||
      orig.name.toLowerCase().includes(q) ||
      dest.name.toLowerCase().includes(q);
    if (!match) return false;
  }

  if (filters.ourSites.length > 0) {
    const involvesSite = filters.ourSites.includes(orig.id) || filters.ourSites.includes(dest.id);
    if (!involvesSite) return false;
  }

  const showOuter = filters.contours.length === 0 || filters.contours.includes('outer');
  const showInner = filters.contours.length === 0 || filters.contours.includes('inner');
  const origContour = orig.is_ours ? 'inner' : 'outer';
  const destContour = dest.is_ours ? 'inner' : 'outer';

  if (!showOuter && !showInner) return false;
  if (showOuter && !showInner) {
    if (origContour !== 'outer' && destContour !== 'outer') return false;
  }
  if (showInner && !showOuter) {
    if (origContour !== 'inner' && destContour !== 'inner') return false;
  }

  if (filters.factoryTypes.length > 0) {
    const typeMatch = filters.factoryTypes.includes(orig.type) || filters.factoryTypes.includes(dest.type);
    if (!typeMatch) return false;
  }

  return true;
}

export function applyMapFilters(
  factories: Factory[],
  supplyLinks: SupplyLink[],
  filters: FilterState,
  user?: User | null,
  highlightedFactoryId?: string | null,
  products?: Product[],
): MapFilterResult {
  if (filters.viewMode === 'sites') {
    return filterSitesMode(factories, filters, highlightedFactoryId);
  }
  return filterShipmentsMode(factories, supplyLinks, filters, user, highlightedFactoryId, products);
}

export function aggregateRoutes(
  links: SupplyLink[],
  factoryMap: Map<string, Factory>,
): AggregatedRoute[] {
  const groups = new Map<string, SupplyLink[]>();

  for (const link of links) {
    const key = `${link.origin_id}|${link.destination_id}`;
    const arr = groups.get(key) ?? [];
    arr.push(link);
    groups.set(key, arr);
  }

  const routes: AggregatedRoute[] = [];

  for (const [key, group] of groups) {
    const [origin_id, destination_id] = key.split('|');
    const sorted = [...group].sort((a, b) => {
      const da = a.shipment_date || a.last_updated || '';
      const db = b.shipment_date || b.last_updated || '';
      return db.localeCompare(da);
    });
    const latest = sorted[0];
    const totalVolume = group.reduce((s, l) => s + l.volume, 0);
    const totalAmount = group.reduce((s, l) => s + (l.amount ?? 0), 0);

    routes.push({
      id: key,
      origin_id,
      destination_id,
      shipments: group,
      shipment_count: group.length,
      total_volume: totalVolume,
      total_amount: totalAmount,
      unit: latest.unit,
      cargo_type: latest.cargo_type,
      product_id: latest.product_id || mapCargoTypeToProductId(latest.cargo_type),
      flow_type: latest.flow_type || inferFlowType(factoryMap.get(origin_id), factoryMap.get(destination_id)),
      status: latest.status,
      source: latest.source,
      latest_shipment_id: latest.id,
      latest_shipment_date: latest.shipment_date,
    });
  }

  return routes;
}
