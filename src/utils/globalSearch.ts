import type {
  Factory,
  KanbanBoard,
  Product,
  SalesManager,
  SupplyLink,
  ThirdPartyCarrier,
  User,
} from '../types';
import { canAccessTab } from './rbac';
import {
  isFactoryInUserScope,
  isShipmentInUserScope,
} from './permissions';

export type GlobalSearchResultType =
  | 'nav'
  | 'factory'
  | 'shipment'
  | 'product'
  | 'carrier'
  | 'manager'
  | 'board';

export interface GlobalSearchResult {
  type: GlobalSearchResultType;
  id: string;
  label: string;
  sublabel?: string;
  tab?: string;
  factory?: Factory;
  shipment?: SupplyLink;
  boardId?: string;
}

export interface GlobalSearchNavItem {
  id: string;
  label: string;
}

export interface GlobalSearchContext {
  user: User;
  factories: Factory[];
  supplyLinks: SupplyLink[];
  products: Product[];
  carriers: ThirdPartyCarrier[];
  salesManagers: SalesManager[];
  boards: KanbanBoard[];
  navItems: GlobalSearchNavItem[];
  locale: 'ru' | 'en';
}

const MAX_PER_GROUP = 6;

function matchesQuery(haystack: string, q: string): boolean {
  return haystack.toLowerCase().includes(q.toLowerCase());
}

function buildLinkedFactoryIds(supplyLinks: SupplyLink[], user: User): Set<string> {
  const set = new Set<string>();
  for (const link of supplyLinks) {
    if (!isShipmentInUserScope(link, user)) continue;
    set.add(link.origin_id);
    set.add(link.destination_id);
    if (link.site_id) set.add(link.site_id);
  }
  return set;
}

export function buildGlobalSearchResults(
  query: string,
  ctx: GlobalSearchContext,
): GlobalSearchResult[] {
  const q = query.trim();
  if (q.length < 1) return [];

  const results: GlobalSearchResult[] = [];
  const factoryMap = new Map(ctx.factories.map(f => [f.id, f]));
  const linkedFactoryIds = buildLinkedFactoryIds(ctx.supplyLinks, ctx.user);
  const { user } = ctx;

  for (const item of ctx.navItems) {
    if (!matchesQuery(item.label, q) && !matchesQuery(item.id, q)) continue;
    results.push({
      type: 'nav',
      id: `nav-${item.id}`,
      label: item.label,
      sublabel: item.id,
      tab: item.id,
    });
    if (results.filter(r => r.type === 'nav').length >= MAX_PER_GROUP) break;
  }

  let factoryCount = 0;
  for (const f of ctx.factories) {
    if (f.is_active === false) continue;
    if (!isFactoryInUserScope(f, user, linkedFactoryIds)) continue;
    const hay = [f.id, f.name, f.region, f.holding, f.code, f.address, f.type].filter(Boolean).join(' ');
    if (!matchesQuery(hay, q)) continue;
    results.push({
      type: 'factory',
      id: f.id,
      label: f.name,
      sublabel: [f.region, f.type].filter(Boolean).join(' · ') || f.id,
      factory: f,
    });
    factoryCount += 1;
    if (factoryCount >= MAX_PER_GROUP) break;
  }

  let shipmentCount = 0;
  for (const link of ctx.supplyLinks) {
    if (!isShipmentInUserScope(link, user)) continue;
    const orig = factoryMap.get(link.origin_id);
    const dest = factoryMap.get(link.destination_id);
    if (!orig || !dest) continue;
    const hay = [
      link.id,
      link.cargo_type,
      link.carrier_name,
      link.driver_info,
      orig.name,
      dest.name,
      orig.region,
      dest.region,
    ].filter(Boolean).join(' ');
    if (!matchesQuery(hay, q)) continue;
    results.push({
      type: 'shipment',
      id: link.id,
      label: link.cargo_type,
      sublabel: `${orig.name} → ${dest.name}`,
      shipment: link,
    });
    shipmentCount += 1;
    if (shipmentCount >= MAX_PER_GROUP) break;
  }

  if (canAccessTab('products', user.role)) {
    let productCount = 0;
    for (const p of ctx.products) {
      if (p.is_active === false) continue;
      const name = ctx.locale === 'en' ? p.name_en : p.name_ru;
      const hay = [p.id, name, p.name_ru, p.name_en].filter(Boolean).join(' ');
      if (!matchesQuery(hay, q)) continue;
      results.push({
        type: 'product',
        id: p.id,
        label: name,
        sublabel: p.id,
        tab: 'products',
      });
      productCount += 1;
      if (productCount >= MAX_PER_GROUP) break;
    }
  }

  if (canAccessTab('carriers', user.role)) {
    let carrierCount = 0;
    for (const c of ctx.carriers) {
      if (c.is_active === false && c.enabled === false) continue;
      const hay = [c.id, c.name, c.code, c.description].filter(Boolean).join(' ');
      if (!matchesQuery(hay, q)) continue;
      results.push({
        type: 'carrier',
        id: c.id,
        label: c.name,
        sublabel: c.code || c.id,
        tab: 'carriers',
      });
      carrierCount += 1;
      if (carrierCount >= MAX_PER_GROUP) break;
    }
  }

  if (canAccessTab('managers', user.role)) {
    let managerCount = 0;
    for (const m of ctx.salesManagers) {
      if (m.is_active === false) continue;
      const hay = [m.id, m.full_name, m.last_name, m.first_name, m.position].filter(Boolean).join(' ');
      if (!matchesQuery(hay, q)) continue;
      results.push({
        type: 'manager',
        id: m.id,
        label: m.full_name,
        sublabel: m.position || m.id,
        tab: 'managers',
      });
      managerCount += 1;
      if (managerCount >= MAX_PER_GROUP) break;
    }
  }

  let boardCount = 0;
  for (const board of ctx.boards) {
    const hay = [board.id, board.name, board.description].filter(Boolean).join(' ');
    if (!matchesQuery(hay, q)) continue;
    results.push({
      type: 'board',
      id: board.id,
      label: board.name,
      sublabel: board.description || board.id,
      boardId: board.id,
    });
    boardCount += 1;
    if (boardCount >= MAX_PER_GROUP) break;
  }

  return results;
}

export function groupGlobalSearchResults(results: GlobalSearchResult[]): Array<{
  type: GlobalSearchResultType;
  items: GlobalSearchResult[];
}> {
  const order: GlobalSearchResultType[] = [
    'nav',
    'factory',
    'shipment',
    'product',
    'carrier',
    'manager',
    'board',
  ];
  const groups: Array<{ type: GlobalSearchResultType; items: GlobalSearchResult[] }> = [];
  for (const type of order) {
    const items = results.filter(r => r.type === type);
    if (items.length > 0) groups.push({ type, items });
  }
  return groups;
}
