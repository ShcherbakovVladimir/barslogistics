import mapData from '../data/russiaMapRegions.json';
import type { FactoryRegionNode } from './factoryRegionTree';
import { getRfRegionNumber } from './rfRegionNumbers';

const RF_COUNTRY_MARKERS = /^(рф|russia|россия|ru)$/i;

export function isRussiaCountry(country: string): boolean {
  return RF_COUNTRY_MARKERS.test(country.trim());
}

export type RussiaMapRegion = {
  d: string;
  code: string;
  title: string;
};

export const RUSSIA_MAP_VIEWBOX = mapData.viewBox;
export const RUSSIA_MAP_REGIONS = mapData.regions as Record<string, RussiaMapRegion>;

function normalizeRegionKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\./g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const titleToMapId = new Map<string, string>();
for (const [id, region] of Object.entries(RUSSIA_MAP_REGIONS)) {
  titleToMapId.set(normalizeRegionKey(region.title), id);
}

/** Extra aliases from common factory.region strings */
const ALIASES: Record<string, string> = {
  'янао': 'RU-YAN',
  'ямало-ненецкий автономный округ': 'RU-YAN',
  'ханты-мансийский автономный округ — югра': 'RU-KHM',
  'ханты-мансийский автономный округ': 'RU-KHM',
  'чукотский ао': 'RU-CHU',
  'чукотский автономный округ': 'RU-CHU',
  'еврейская ао': 'RU-YEV',
  'еврейская автономная область': 'RU-YEV',
  'республика крым': 'RU-CR',
  'крым': 'RU-CR',
  'санкт-петербург': 'RU-SPE',
  'москва': 'RU-MOW',
};

for (const [alias, id] of Object.entries(ALIASES)) {
  if (RUSSIA_MAP_REGIONS[id]) titleToMapId.set(normalizeRegionKey(alias), id);
}

export function matchRegionLabelToMapId(label: string): string | null {
  const normalized = normalizeRegionKey(label);
  const direct = titleToMapId.get(normalized);
  if (direct) return direct;

  for (const [key, id] of titleToMapId.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) return id;
  }

  return null;
}

export function findTreeNodeByMapId(tree: FactoryRegionNode[], mapId: string): FactoryRegionNode | null {
  for (const node of tree) {
    if (matchRegionLabelToMapId(node.label) === mapId) return node;
  }
  return null;
}

export function findMapIdByTreeKey(tree: FactoryRegionNode[], key: string): string | null {
  const node = tree.find(n => n.key === key);
  if (!node) return null;
  return matchRegionLabelToMapId(node.label);
}

export function getRegionNumberForLabel(label: string): string | null {
  return getRfRegionNumber(matchRegionLabelToMapId(label));
}

export function sortRegionsByRfNumber(tree: FactoryRegionNode[]): FactoryRegionNode[] {
  return [...tree].sort((a, b) => {
    const na = getRegionNumberForLabel(a.label);
    const nb = getRegionNumberForLabel(b.label);
    if (na && nb) return Number(na) - Number(nb) || a.label.localeCompare(b.label, 'ru');
    if (na) return -1;
    if (nb) return 1;
    return a.label.localeCompare(b.label, 'ru');
  });
}

export function buildMapRegionCounts(tree: FactoryRegionNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of tree) {
    const factories = node.settlements.flatMap(s => s.factories);
    const isForeign = factories.length > 0 && factories.every(f => !isRussiaCountry(f.country));
    if (isForeign) continue;

    const mapId = matchRegionLabelToMapId(node.label);
    if (mapId) {
      counts.set(mapId, (counts.get(mapId) || 0) + node.factoryCount);
    }
  }
  return counts;
}

export function splitDomesticForeignTree(tree: FactoryRegionNode[]): {
  domestic: FactoryRegionNode[];
  foreign: FactoryRegionNode[];
} {
  const domestic: FactoryRegionNode[] = [];
  const foreign: FactoryRegionNode[] = [];

  for (const node of tree) {
    const factories = node.settlements.flatMap(s => s.factories);
    const isForeign = factories.length > 0 && factories.every(f => !isRussiaCountry(f.country));
    if (isForeign) foreign.push(node);
    else domestic.push(node);
  }

  return { domestic, foreign };
}
