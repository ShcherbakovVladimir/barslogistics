import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FactoryRegionNode } from '../../utils/factoryRegionTree';
import { FactoryRegionTreeView, type FactoryRegionLayout } from './FactoryRegionTreeView';
import { RussiaRegionsMap } from './RussiaRegionsMap';
import {
  buildMapRegionCounts,
  findMapIdByTreeKey,
  findTreeNodeByMapId,
  splitDomesticForeignTree,
} from '../../utils/regionMapMatch';
import { useI18n } from '../../i18n';
import { Grid2x2, Rows3 } from 'lucide-react';

const REGION_LAYOUT_KEY = 'bars-factories-region-layout';

function readStoredLayout(): FactoryRegionLayout {
  try {
    const v = localStorage.getItem(REGION_LAYOUT_KEY);
    if (v === 'list' || v === 'tiles') return v;
  } catch { /* ignore */ }
  return 'tiles';
}

interface FactoriesSchematicMapProps {
  tree: FactoryRegionNode[];
  searchQuery: string;
  selectedRegionKey: string | null;
  onSelectRegion: (key: string | null) => void;
  renderFactory: (factory: import('../../types').Factory) => React.ReactNode;
  regionLayout?: FactoryRegionLayout;
  onRegionLayoutChange?: (layout: FactoryRegionLayout) => void;
}

export const FactoriesSchematicMap: React.FC<FactoriesSchematicMapProps> = ({
  tree,
  searchQuery,
  selectedRegionKey,
  onSelectRegion,
  renderFactory,
  regionLayout: regionLayoutProp,
  onRegionLayoutChange,
}) => {
  const { t } = useI18n();
  const accordionRef = useRef<HTMLDivElement>(null);
  const [internalLayout, setInternalLayout] = useState<FactoryRegionLayout>(readStoredLayout);
  const regionLayout = regionLayoutProp ?? internalLayout;

  const setRegionLayout = (layout: FactoryRegionLayout) => {
    if (onRegionLayoutChange) onRegionLayoutChange(layout);
    else {
      setInternalLayout(layout);
      try { localStorage.setItem(REGION_LAYOUT_KEY, layout); } catch { /* ignore */ }
    }
  };

  const regionCounts = useMemo(() => buildMapRegionCounts(tree), [tree]);
  const { domestic, foreign } = useMemo(() => splitDomesticForeignTree(tree), [tree]);

  const selectedMapId = useMemo(
    () => (selectedRegionKey ? findMapIdByTreeKey(tree, selectedRegionKey) : null),
    [tree, selectedRegionKey],
  );

  useEffect(() => {
    if (!selectedRegionKey || !accordionRef.current) return;

    const scrollSelectedToTop = () => {
      const root = accordionRef.current;
      if (!root) return;
      const detail = root.querySelector(
        `.factories-region-tile-detail[data-region-key="${CSS.escape(selectedRegionKey)}"]`,
      ) as HTMLElement | null;
      const el = detail ?? root.querySelector(
        `[data-region-key="${CSS.escape(selectedRegionKey)}"]`,
      ) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    };

    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollSelectedToTop);
    });
    const retry = window.setTimeout(scrollSelectedToTop, 160);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(retry);
    };
  }, [selectedRegionKey, regionLayout]);

  const handleMapSelect = (mapId: string | null) => {
    if (!mapId) {
      onSelectRegion(null);
      return;
    }
    const node = findTreeNodeByMapId(tree, mapId);
    onSelectRegion(node ? node.key : null);
  };

  if (tree.length === 0) {
    return (
      <div className="factories-schematic-map-empty bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm shadow-xl">
        {t('factories.empty')}
      </div>
    );
  }

  return (
    <div className="factories-schematic-layout space-y-4">
      <div className="factories-schematic-map-wrap bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="factories-schematic-map-toolbar flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 text-[11px]">
          <span className="text-slate-400">{t('factories.schematicHint')}</span>
          <span className="text-slate-500">{t('factories.schematicMapRegions', { count: regionCounts.size })}</span>
        </div>

        <RussiaRegionsMap
          regionCounts={regionCounts}
          selectedMapId={selectedMapId}
          onSelectMapId={handleMapSelect}
        />
      </div>

      <div className="factories-schematic-regions-toolbar flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400 px-1">{t('factories.regionsListLabel')}</span>
        <div className="factories-region-layout-toggle inline-flex rounded-xl border border-slate-800 p-0.5 bg-slate-950">
          <button
            type="button"
            onClick={() => setRegionLayout('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              regionLayout === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-pressed={regionLayout === 'list'}
          >
            <Rows3 className="w-3.5 h-3.5" />
            {t('factories.layoutList')}
          </button>
          <button
            type="button"
            onClick={() => setRegionLayout('tiles')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              regionLayout === 'tiles' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-pressed={regionLayout === 'tiles'}
          >
            <Grid2x2 className="w-3.5 h-3.5" />
            {t('factories.layoutTiles')}
          </button>
        </div>
      </div>

      <div ref={accordionRef} className="factories-schematic-accordion space-y-4">
        <FactoryRegionTreeView
          tree={domestic}
          searchQuery={searchQuery}
          renderFactory={renderFactory}
          activeRegionKey={selectedRegionKey}
          onRegionToggle={onSelectRegion}
          singleOpen
          layout={regionLayout}
        />

        {foreign.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              {t('factories.schematicForeignLabel')}
            </h3>
            <FactoryRegionTreeView
              tree={foreign}
              searchQuery={searchQuery}
              renderFactory={renderFactory}
              activeRegionKey={selectedRegionKey}
              onRegionToggle={onSelectRegion}
              singleOpen
              layout={regionLayout}
            />
          </div>
        )}
      </div>
    </div>
  );
};
