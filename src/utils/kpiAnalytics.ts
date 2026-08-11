import type { Factory, PeriodFilterState, Product, SalesManager, SupplyLink, User } from '../types';
import { getProductName, mapCargoTypeToProductId } from '../constants/products';
import { salesManagerLabel } from '../constants/salesManagers';
import { isShipmentInUserScope } from './permissions';
import { matchesPeriodFilter } from './periodFilter';
import { primaryVolumeFactoryId } from './shipmentVolume';

export interface VolumeBreakdownRow {
  id: string;
  label: string;
  volume: number;
  shipmentCount: number;
}

export interface KpiAnalyticsSummary {
  totalShipments: number;
  totalVolume: number;
  totalAmount: number;
  byManager: VolumeBreakdownRow[];
  byProduct: VolumeBreakdownRow[];
  byOurSite: VolumeBreakdownRow[];
}

function resolveProductId(link: SupplyLink, catalog: Product[]): string {
  return link.product_id || mapCargoTypeToProductId(link.cargo_type, catalog);
}

function resolveManagerId(link: SupplyLink): string {
  return link.sales_manager_id || link.manager_id || '__unassigned__';
}

function resolveManagerLabel(
  managerId: string,
  managers: SalesManager[],
  unassignedLabel: string,
): string {
  if (managerId === '__unassigned__') return unassignedLabel;
  const manager = managers.find(m => m.id === managerId);
  if (manager) return salesManagerLabel(manager);
  return managerId;
}

export function filterOwnKpiShipments(
  supplyLinks: SupplyLink[],
  period: PeriodFilterState,
  user?: User | null,
): SupplyLink[] {
  return supplyLinks.filter(link => {
    if (link.source === 'rzd') return false;
    if (user && !isShipmentInUserScope(link, user)) return false;
    return matchesPeriodFilter(link, period);
  });
}

export function computeKpiAnalytics(
  supplyLinks: SupplyLink[],
  factories: Factory[],
  products: Product[],
  salesManagers: SalesManager[],
  period: PeriodFilterState,
  locale: 'ru' | 'en',
  labels: { unassignedManager: string; otherProduct: string },
  user?: User | null,
): KpiAnalyticsSummary {
  const links = filterOwnKpiShipments(supplyLinks, period, user);
  const ourSites = factories.filter(f => f.is_ours);
  const ourSiteIds = new Set(ourSites.map(f => f.id));

  const managerMap = new Map<string, { volume: number; count: number }>();
  const productMap = new Map<string, { volume: number; count: number }>();
  const siteMap = new Map<string, { volume: number; count: number }>();

  let totalVolume = 0;
  let totalAmount = 0;

  for (const link of links) {
    const vol = link.volume ?? 0;
    totalVolume += vol;
    totalAmount += link.amount ?? 0;

    const managerId = resolveManagerId(link);
    const mgr = managerMap.get(managerId) ?? { volume: 0, count: 0 };
    mgr.volume += vol;
    mgr.count += 1;
    managerMap.set(managerId, mgr);

    const productId = resolveProductId(link, products);
    const prod = productMap.get(productId) ?? { volume: 0, count: 0 };
    prod.volume += vol;
    prod.count += 1;
    productMap.set(productId, prod);

    const siteId = primaryVolumeFactoryId(link, ourSiteIds);
    if (siteId && ourSiteIds.has(siteId)) {
      const site = siteMap.get(siteId) ?? { volume: 0, count: 0 };
      site.volume += vol;
      site.count += 1;
      siteMap.set(siteId, site);
    }
  }

  const byManager = [...managerMap.entries()]
    .map(([id, data]) => ({
      id,
      label: resolveManagerLabel(id, salesManagers, labels.unassignedManager),
      volume: data.volume,
      shipmentCount: data.count,
    }))
    .sort((a, b) => b.volume - a.volume || a.label.localeCompare(b.label, locale));

  const catalogIds = new Set(products.map(p => p.id));
  const byProduct = [...productMap.entries()]
    .map(([id, data]) => ({
      id,
      label: catalogIds.has(id)
        ? getProductName(id, locale, products)
        : (id === '__other__' ? labels.otherProduct : id),
      volume: data.volume,
      shipmentCount: data.count,
    }))
    .sort((a, b) => {
      const orderA = products.find(p => p.id === a.id)?.sort_order ?? 999;
      const orderB = products.find(p => p.id === b.id)?.sort_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return b.volume - a.volume;
    });

  const factoryById = new Map(factories.map(f => [f.id, f]));
  const byOurSite = [...siteMap.entries()]
    .map(([id, data]) => ({
      id,
      label: factoryById.get(id)?.name ?? id,
      volume: data.volume,
      shipmentCount: data.count,
    }))
    .sort((a, b) => b.volume - a.volume || a.label.localeCompare(b.label, locale));

  return {
    totalShipments: links.length,
    totalVolume,
    totalAmount,
    byManager,
    byProduct,
    byOurSite,
  };
}

export function formatKpiPeriodLabel(
  period: PeriodFilterState,
  locale: 'ru' | 'en',
  labels: {
    customRange: string;
    year: (year: number) => string;
    quarter: (quarter: number, year: number) => string;
    week: (week: number, year: number) => string;
  },
): string {
  const year = period.year ?? new Date().getFullYear();
  const value = period.value ?? 1;

  if (period.mode === 'range') {
    if (period.rangeStart && period.rangeEnd) {
      return `${period.rangeStart} — ${period.rangeEnd}`;
    }
    return labels.customRange;
  }

  switch (period.granularity) {
    case 'year':
      return labels.year(year);
    case 'quarter':
      return labels.quarter(value, year);
    case 'month': {
      const month = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' }).format(
        new Date(year, value - 1, 1),
      );
      return `${month} ${year}`;
    }
    case 'week':
      return labels.week(value, year);
    default:
      return labels.year(year);
  }
}
