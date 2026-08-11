import type { Factory, SupplyLink } from '../types';

export type MapSearchSuggestion =
  | { type: 'factory'; id: string; label: string; sublabel: string; factory: Factory }
  | { type: 'shipment'; id: string; label: string; sublabel: string; shipment: SupplyLink };

const MAX_SUGGESTIONS = 8;

function matchesQuery(haystack: string, q: string): boolean {
  return haystack.toLowerCase().includes(q.toLowerCase());
}

export function buildMapSearchSuggestions(
  query: string,
  viewMode: 'sites' | 'shipments',
  factories: Factory[],
  supplyLinks: SupplyLink[],
  factoryMap: Map<string, Factory>,
): MapSearchSuggestion[] {
  const q = query.trim();
  if (q.length < 1) return [];

  const results: MapSearchSuggestion[] = [];

  if (viewMode === 'sites') {
    for (const f of factories) {
      if (f.is_active === false) continue;
      const hay = [f.id, f.name, f.region, f.holding, f.code, f.address].filter(Boolean).join(' ');
      if (!matchesQuery(hay, q)) continue;
      results.push({
        type: 'factory',
        id: f.id,
        label: f.name,
        sublabel: [f.region, f.id].filter(Boolean).join(' · '),
        factory: f,
      });
      if (results.length >= MAX_SUGGESTIONS) break;
    }
    return results;
  }

  const seenFactoryIds = new Set<string>();

  for (const link of supplyLinks) {
    const orig = factoryMap.get(link.origin_id);
    const dest = factoryMap.get(link.destination_id);
    if (!orig || !dest) continue;

    const cargoHay = [
      link.cargo_type,
      link.carrier_name,
      link.id,
      orig.name,
      dest.name,
    ].filter(Boolean).join(' ');

    if (matchesQuery(cargoHay, q)) {
      results.push({
        type: 'shipment',
        id: link.id,
        label: link.cargo_type,
        sublabel: `${orig.name} → ${dest.name}`,
        shipment: link,
      });
      if (results.length >= MAX_SUGGESTIONS) return results;
    }
  }

  for (const f of factories) {
    if (seenFactoryIds.has(f.id)) continue;
    const hay = [f.id, f.name, f.region, f.holding].filter(Boolean).join(' ');
    if (!matchesQuery(hay, q)) continue;
    seenFactoryIds.add(f.id);
    results.push({
      type: 'factory',
      id: f.id,
      label: f.name,
      sublabel: f.region || f.id,
      factory: f,
    });
    if (results.length >= MAX_SUGGESTIONS) break;
  }

  return results;
}
