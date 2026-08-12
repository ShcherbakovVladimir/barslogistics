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
      <div className="factories-schematic-map-empty">
        {t('factories.empty')}
      </div>
    );
  }

  return (
    <div className="factories-schematic-layout">
      <div className="factories-schematic-map-wrap">
        <div className="factories-schematic-map-toolbar">
          <span className="factories-schematic-map-hint">{t('factories.schematicHint')}</span>
          <span className="factories-schematic-map-meta">
            {t('factories.schematicMapRegions', { count: regionCounts.size })}
          </span>
        </div>

        <RussiaRegionsMap
          regionCounts={regionCounts}
          selectedMapId={selectedMapId}
          onSelectMapId={handleMapSelect}
        />
      </div>

      <div className="factories-schematic-regions-toolbar">
        <span className="factories-schematic-regions-label">{t('factories.regionsListLabel')}</span>
        <div className="factories-region-layout-toggle" role="group">
          <button
            type="button"
            onClick={() => setRegionLayout('list')}
            className={`factories-region-layout-btn${regionLayout === 'list' ? ' is-active' : ''}`}
            aria-pressed={regionLayout === 'list'}
          >
            <Rows3 aria-hidden />
            {t('factories.layoutList')}
          </button>
          <button
            type="button"
            onClick={() => setRegionLayout('tiles')}
            className={`factories-region-layout-btn${regionLayout === 'tiles' ? ' is-active' : ''}`}
            aria-pressed={regionLayout === 'tiles'}
          >
            <Grid2x2 aria-hidden />
            {t('factories.layoutTiles')}
          </button>
        </div>
      </div>

      <div ref={accordionRef} className="factories-schematic-accordion">
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
          <div className="factories-schematic-foreign">
            <h3 className="factories-schematic-foreign-title">
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
