import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Rows3, Grid2x2 } from 'lucide-react';
import type { FactoryRegionNode } from '../../utils/factoryRegionTree';
import { collectExpandedKeysForSearch } from '../../utils/factoryRegionTree';
import { getRegionNumberForLabel, sortRegionsByRfNumber } from '../../utils/regionMapMatch';
import { useI18n } from '../../i18n';

export type FactoryRegionLayout = 'list' | 'tiles';

interface FactoryRegionTreeViewProps {
  tree: FactoryRegionNode[];
  searchQuery: string;
  renderFactory: (factory: import('../../types').Factory) => React.ReactNode;
  activeRegionKey?: string | null;
  onRegionToggle?: (key: string | null) => void;
  singleOpen?: boolean;
  layout?: FactoryRegionLayout;
  onLayoutChange?: (layout: FactoryRegionLayout) => void;
  showLayoutToggle?: boolean;
}

function RegionSettlementsBody({
  region,
  searchQuery,
  searchExpandedSettlements,
  expandedSettlements,
  toggleSettlement,
  renderFactory,
}: {
  region: FactoryRegionNode;
  searchQuery: string;
  searchExpandedSettlements: Set<string>;
  expandedSettlements: Set<string>;
  toggleSettlement: (regionKey: string, settlementKey: string) => void;
  renderFactory: (factory: import('../../types').Factory) => React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="factories-region-body border-t border-slate-800/80">
      {region.settlements.map(settlement => {
        const compound = `${region.key}::${settlement.key}`;
        const settlementOpen = expandedSettlements.has(compound)
          || (searchQuery.trim() !== '' && searchExpandedSettlements.has(compound));

        return (
          <div key={compound} className="factories-settlement-node border-b border-slate-800/60 last:border-b-0">
            <button
              type="button"
              onClick={() => toggleSettlement(region.key, settlement.key)}
              className="factories-settlement-header w-full flex items-center gap-2 pl-6 pr-4 py-2.5 text-left hover:bg-slate-800/40 transition-colors"
              aria-expanded={settlementOpen}
            >
              {settlementOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-slate-200 truncate">{settlement.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {t('factories.settlementObjects', { count: settlement.factories.length })}
                </div>
              </div>
            </button>

            {settlementOpen && (
              <div className="factories-settlement-body px-4 pb-4 pl-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {settlement.factories.map(factory => (
                    <React.Fragment key={factory.id}>
                      {renderFactory(factory)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const FactoryRegionTreeView: React.FC<FactoryRegionTreeViewProps> = ({
  tree,
  searchQuery,
  renderFactory,
  activeRegionKey = null,
  onRegionToggle,
  singleOpen = false,
  layout = 'list',
  onLayoutChange,
  showLayoutToggle = false,
}) => {
  const { t } = useI18n();
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(() => new Set());
  const [expandedSettlements, setExpandedSettlements] = useState<Set<string>>(() => new Set());

  const searchExpanded = useMemo(
    () => collectExpandedKeysForSearch(tree, searchQuery),
    [tree, searchQuery],
  );

  const effectiveSingleOpen = singleOpen || layout === 'tiles';

  useEffect(() => {
    if (effectiveSingleOpen) return;
    setExpandedRegions(prev => {
      const next = new Set(prev);
      for (const region of tree) next.add(region.key);
      return next;
    });
  }, [tree, effectiveSingleOpen]);

  useEffect(() => {
    if (!activeRegionKey) return;
    setExpandedRegions(new Set([activeRegionKey]));
    const region = tree.find(r => r.key === activeRegionKey);
    if (region) {
      setExpandedSettlements(new Set(region.settlements.map(s => `${activeRegionKey}::${s.key}`)));
    }
  }, [activeRegionKey, tree]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    setExpandedRegions(prev => new Set([...prev, ...searchExpanded.regions]));
    setExpandedSettlements(prev => new Set([...prev, ...searchExpanded.settlements]));
  }, [searchQuery, searchExpanded]);

  const toggleRegion = (key: string) => {
    const isOpen = expandedRegions.has(key) || activeRegionKey === key;
    if (effectiveSingleOpen && onRegionToggle) {
      onRegionToggle(isOpen ? null : key);
      return;
    }
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    onRegionToggle?.(isOpen ? null : key);
  };

  const toggleSettlement = (regionKey: string, settlementKey: string) => {
    const compound = `${regionKey}::${settlementKey}`;
    setExpandedSettlements(prev => {
      const next = new Set(prev);
      if (next.has(compound)) next.delete(compound);
      else next.add(compound);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRegions(new Set(tree.map(region => region.key)));
    setExpandedSettlements(new Set(
      tree.flatMap(region => region.settlements.map(settlement => `${region.key}::${settlement.key}`)),
    ));
  };

  const collapseAll = () => {
    setExpandedRegions(new Set());
    setExpandedSettlements(new Set());
    onRegionToggle?.(null);
  };

  const openRegion = useMemo(() => {
    if (activeRegionKey) return tree.find(r => r.key === activeRegionKey) ?? null;
    if (layout !== 'tiles') return null;
    const openKey = [...expandedRegions].find(k => tree.some(r => r.key === k));
    return openKey ? tree.find(r => r.key === openKey) ?? null : null;
  }, [activeRegionKey, expandedRegions, layout, tree]);

  const displayTree = useMemo(
    () => (layout === 'tiles' ? sortRegionsByRfNumber(tree) : tree),
    [layout, tree],
  );

  if (tree.length === 0) {
    return (
      <div className="factories-region-tree-empty bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm shadow-xl">
        {t('factories.empty')}
      </div>
    );
  }

  const toolbar = (showLayoutToggle || (!effectiveSingleOpen && layout === 'list')) ? (
    <div className="factories-region-tree-toolbar flex flex-wrap items-center justify-between gap-2">
      {showLayoutToggle && onLayoutChange ? (
        <div className="factories-region-layout-toggle inline-flex rounded-xl border border-slate-800 p-0.5 bg-slate-950">
          <button
            type="button"
            onClick={() => onLayoutChange('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              layout === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-pressed={layout === 'list'}
          >
            <Rows3 className="w-3.5 h-3.5" />
            {t('factories.layoutList')}
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('tiles')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              layout === 'tiles' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-pressed={layout === 'tiles'}
          >
            <Grid2x2 className="w-3.5 h-3.5" />
            {t('factories.layoutTiles')}
          </button>
        </div>
      ) : <span />}

      {!effectiveSingleOpen && layout === 'list' ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {t('factories.expandAll')}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {t('factories.collapseAll')}
          </button>
        </div>
      ) : null}
    </div>
  ) : null;

  if (layout === 'tiles') {
    return (
      <div className="factories-region-tree factories-region-tree--tiles space-y-3">
        {toolbar}
        <div className="factories-region-tiles" role="list">
          {displayTree.map(region => {
            const isActive = activeRegionKey === region.key
              || (!activeRegionKey && expandedRegions.has(region.key));
            const regionNumber = getRegionNumberForLabel(region.label);
            return (
              <button
                key={region.key}
                type="button"
                role="listitem"
                data-region-key={region.key}
                onClick={() => toggleRegion(region.key)}
                className={`factories-region-tile${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
              >
                {regionNumber ? (
                  <span className="factories-region-tile-code" aria-label={t('factories.regionCode', { code: regionNumber })}>
                    {regionNumber}
                  </span>
                ) : null}
                <span className="factories-region-tile-name">{region.label}</span>
                <span className="factories-region-tile-count">
                  {t('factories.regionObjects', { count: region.factoryCount })}
                </span>
              </button>
            );
          })}
        </div>

        {openRegion ? (
          <section
            data-region-key={openRegion.key}
            className="factories-region-tile-detail factories-region-node bg-slate-900 border border-indigo-500/50 ring-1 ring-indigo-500/20 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="factories-region-header flex items-center gap-2 px-4 py-3">
              <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-white truncate">
                  {(() => {
                    const code = getRegionNumberForLabel(openRegion.label);
                    return code ? <span className="factories-region-detail-code">{code}</span> : null;
                  })()}
                  {openRegion.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {t('factories.regionObjects', { count: openRegion.factoryCount })}
                </div>
              </div>
            </div>
            <RegionSettlementsBody
              region={openRegion}
              searchQuery={searchQuery}
              searchExpandedSettlements={searchExpanded.settlements}
              expandedSettlements={expandedSettlements}
              toggleSettlement={toggleSettlement}
              renderFactory={renderFactory}
            />
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="factories-region-tree space-y-3">
      {toolbar}

      {tree.map(region => {
        const regionOpen = expandedRegions.has(region.key)
          || (searchQuery.trim() !== '' && searchExpanded.regions.has(region.key))
          || activeRegionKey === region.key;
        const isActive = activeRegionKey === region.key;

        return (
          <section
            key={region.key}
            data-region-key={region.key}
            className={`factories-region-node bg-slate-900 border rounded-2xl shadow-xl overflow-hidden transition-colors ${
              isActive ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleRegion(region.key)}
              className="factories-region-header w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-800/60 transition-colors"
              aria-expanded={regionOpen}
            >
              {regionOpen ? (
                <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-white truncate">{region.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {t('factories.regionObjects', { count: region.factoryCount })}
                </div>
              </div>
            </button>

            {regionOpen && (
              <RegionSettlementsBody
                region={region}
                searchQuery={searchQuery}
                searchExpandedSettlements={searchExpanded.settlements}
                expandedSettlements={expandedSettlements}
                toggleSettlement={toggleSettlement}
                renderFactory={renderFactory}
              />
            )}
          </section>
        );
      })}
    </div>
  );
};
