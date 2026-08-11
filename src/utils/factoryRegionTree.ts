import type { Factory } from '../types';

export type FactorySortKey = 'name_asc' | 'name_desc';

export interface FactorySettlementNode {
  key: string;
  label: string;
  factories: Factory[];
}

export interface FactoryRegionNode {
  key: string;
  label: string;
  factoryCount: number;
  settlements: FactorySettlementNode[];
}

export interface FactoryRegionTreeLabels {
  unknownRegion: string;
  unknownSettlement: string;
}

const REGION_MARKERS = /(?:обл\.|область|край|респ\.|республика|ао|округ|архипелаг|респ)/i;

const NON_PLACE_NAME_MARKERS = /(?:ГОК|ГМК|МК|комбинат|порт|завод|отвал|шахта|Мет|трейдер|НЛМК|NLMK|Северсталь|ЕВРАЗ)/i;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitAddressParts(address: string): string[] {
  return address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !/^\d{5,6}$/.test(part));
}

function extractCityFromPart(part: string): string | null {
  const prefixed = part.match(/(?:^|[,\s])г\.?\s*(.+)$/i) || part.match(/(?:^|[,\s])город\s+(.+)$/i);
  if (prefixed?.[1]) return prefixed[1].trim();
  if (/^г\.?\s*/i.test(part)) return part.replace(/^г\.?\s*/i, '').trim();
  return null;
}

export function extractRegionFromAddress(address: string): string {
  if (!address) return '';

  const parts = splitAddressParts(address);
  for (const part of parts) {
    if (REGION_MARKERS.test(part)) return part;
  }

  const city = extractCityFromPart(parts[0] || address);
  if (city) return city;

  return '';
}

export function extractSettlementFromAddress(address: string): string | null {
  if (!address) return null;

  const localityPatterns = [
    /(?:^|[,\s])г\.?\s*([^,]+)/i,
    /(?:^|[,\s])город\s+([^,]+)/i,
    /(?:^|[,\s])пос\.?\s*([^,]+)/i,
    /(?:^|[,\s])п\.?\s*([^,]+)/i,
    /(?:^|[,\s])с\.?\s*([^,]+)/i,
    /(?:^|[,\s])пгт\.?\s*([^,]+)/i,
    /(?:^|[,\s])д\.?\s*([^,]+)/i,
  ];

  for (const pattern of localityPatterns) {
    const match = address.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  const parts = splitAddressParts(address);
  if (parts.length === 1) {
    return extractCityFromPart(parts[0]);
  }

  if (parts.length >= 2) {
    const second = parts[1];
    if (!REGION_MARKERS.test(second)) {
      return second.replace(/^г\.?\s*/i, '').trim();
    }
    if (parts.length >= 3) {
      return parts[2].replace(/^г\.?\s*/i, '').trim();
    }
  }

  return null;
}

export function extractCityFromFactoryName(name: string): string | null {
  const match = name.match(/^(.+?)\s*\(/);
  if (!match?.[1]) return null;

  const candidate = match[1].trim();
  if (candidate.length < 2 || candidate.length > 40) return null;
  if (NON_PLACE_NAME_MARKERS.test(candidate)) return null;
  if (!/^[A-Za-zА-Яа-яЁё\-]+$/.test(candidate)) return null;

  return candidate;
}

export function resolveFactoryRegion(factory: Factory, unknownRegion: string): string {
  const region = factory.region?.trim();
  if (region) return region;

  const fromAddress = extractRegionFromAddress(factory.address || '');
  if (fromAddress) return fromAddress;

  const fromName = extractCityFromFactoryName(factory.name);
  if (fromName) return fromName;

  return unknownRegion;
}

export function resolveFactorySettlement(factory: Factory, unknownSettlement: string): string {
  const fromAddress = extractSettlementFromAddress(factory.address || '');
  if (fromAddress) return fromAddress;

  const fromName = extractCityFromFactoryName(factory.name);
  if (fromName) return fromName;

  const region = factory.region?.trim();
  if (region && !REGION_MARKERS.test(region)) return region;

  return unknownSettlement;
}

function sortFactories(factories: Factory[], sortBy: FactorySortKey): Factory[] {
  const sorted = [...factories];
  sorted.sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
    return sortBy === 'name_desc' ? -cmp : cmp;
  });
  return sorted;
}

export function buildFactoryRegionTree(
  factories: Factory[],
  labels: FactoryRegionTreeLabels,
  sortBy: FactorySortKey = 'name_asc',
): FactoryRegionNode[] {
  const byRegion = new Map<string, { label: string; bySettlement: Map<string, { label: string; factories: Factory[] }> }>();

  for (const factory of factories) {
    const regionLabel = resolveFactoryRegion(factory, labels.unknownRegion);
    const regionKey = normalizeKey(regionLabel);

    let regionNode = byRegion.get(regionKey);
    if (!regionNode) {
      regionNode = { label: regionLabel, bySettlement: new Map() };
      byRegion.set(regionKey, regionNode);
    }

    const settlementLabel = resolveFactorySettlement(factory, labels.unknownSettlement);
    const settlementKey = normalizeKey(settlementLabel);

    let settlementNode = regionNode.bySettlement.get(settlementKey);
    if (!settlementNode) {
      settlementNode = { label: settlementLabel, factories: [] };
      regionNode.bySettlement.set(settlementKey, settlementNode);
    }
    settlementNode.factories.push(factory);
  }

  return Array.from(byRegion.entries())
    .map(([key, node]) => ({
      key,
      label: node.label,
      factoryCount: Array.from(node.bySettlement.values()).reduce((count, settlement) => count + settlement.factories.length, 0),
      settlements: Array.from(node.bySettlement.entries())
        .map(([settlementKey, settlementNode]) => ({
          key: settlementKey,
          label: settlementNode.label,
          factories: sortFactories(settlementNode.factories, sortBy),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru', { sensitivity: 'base' })),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru', { sensitivity: 'base' }));
}

export function collectExpandedKeysForSearch(
  tree: FactoryRegionNode[],
  query: string,
): { regions: Set<string>; settlements: Set<string> } {
  const regions = new Set<string>();
  const settlements = new Set<string>();
  const q = query.trim().toLowerCase();
  if (!q) return { regions, settlements };

  for (const region of tree) {
    for (const settlement of region.settlements) {
      const matches = settlement.factories.some(factory => {
        const hay = [
          factory.name,
          factory.region,
          factory.country,
          factory.holding,
          factory.address,
          factory.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
      if (matches) {
        regions.add(region.key);
        settlements.add(`${region.key}::${settlement.key}`);
      }
    }
  }

  return { regions, settlements };
}
