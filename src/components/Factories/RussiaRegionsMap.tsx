import React, { useMemo, useState, useEffect } from 'react';
import { RUSSIA_MAP_REGIONS, RUSSIA_MAP_VIEWBOX } from '../../utils/regionMapMatch';
import { computePathLabelPoint } from '../../utils/svgPathCentroid';
import { useI18n } from '../../i18n';
import { isMobileLayout, subscribeDeviceLayout } from '../../utils/deviceLayout';

const REGION_LABEL_POINTS = Object.fromEntries(
  Object.entries(RUSSIA_MAP_REGIONS).map(([id, region]) => [id, computePathLabelPoint(region.d)]),
);

interface RussiaRegionsMapProps {
  regionCounts: Map<string, number>;
  selectedMapId: string | null;
  onSelectMapId: (mapId: string | null) => void;
}

function countLabelSize(count: number, mobile: boolean): number {
  const digits = String(count).length;
  if (mobile) {
    if (digits >= 3) return 9;
    if (digits >= 2) return 10.5;
    return 12;
  }
  if (digits >= 3) return 5.5;
  if (digits >= 2) return 6.5;
  return 7.5;
}

/** Region fill palette (industrial facilities schematic map). */
const REGION_MAP_COLORS = {
  /** was #706AE0 */
  selected: 'rgb(115 150 9 / 0.92)',
  /** was #9397F0 */
  hoverWithCount: 'rgb(176 203 96 / 0.85)',
  hoverEmpty: 'rgb(100 116 139 / 0.55)',
  /** was #706AE0 / darkest tier */
  countHigh: 'rgb(115 150 9 / 0.78)',
  /** was #9397F0 */
  countMedium: 'rgb(176 203 96 / 0.72)',
  /** was #B4BCF4 */
  countLow: 'rgb(208 192 159 / 0.75)',
  countMinimal: 'rgb(208 192 159 / 0.42)',
  empty: 'rgb(51 65 85 / 0.45)',
} as const;

function regionFill(count: number, selected: boolean, hovered: boolean): string {
  if (selected) return REGION_MAP_COLORS.selected;
  if (hovered && count > 0) return REGION_MAP_COLORS.hoverWithCount;
  if (hovered) return REGION_MAP_COLORS.hoverEmpty;
  if (count >= 30) return REGION_MAP_COLORS.countHigh;
  if (count >= 10) return REGION_MAP_COLORS.countMedium;
  if (count >= 3) return REGION_MAP_COLORS.countLow;
  if (count > 0) return REGION_MAP_COLORS.countMinimal;
  return REGION_MAP_COLORS.empty;
}

export const RussiaRegionsMap: React.FC<RussiaRegionsMapProps> = ({
  regionCounts,
  selectedMapId,
  onSelectMapId,
}) => {
  const { t } = useI18n();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileLayout, setMobileLayout] = useState(() => isMobileLayout());

  useEffect(() => {
    const sync = () => setMobileLayout(isMobileLayout());
    sync();
    return subscribeDeviceLayout(sync);
  }, []);

  const hoveredRegion = useMemo(
    () => (hoveredId ? RUSSIA_MAP_REGIONS[hoveredId] : null),
    [hoveredId],
  );

  const hoveredCount = hoveredId ? (regionCounts.get(hoveredId) || 0) : 0;

  return (
    <div className={`russia-regions-map-canvas relative${mobileLayout ? ' is-mobile' : ''}`}>
      <svg
        viewBox={RUSSIA_MAP_VIEWBOX}
        className="w-full h-auto block russia-regions-map-svg"
        role="img"
        aria-label={t('factories.schematicMapAria')}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="100%" height="100%" className="russia-regions-map-ocean" fill="rgb(2 6 23 / 0.25)" />

        {Object.entries(RUSSIA_MAP_REGIONS).map(([id, region]) => {
          const count = regionCounts.get(id) || 0;
          const selected = selectedMapId === id;
          const hovered = hoveredId === id;

          return (
            <g key={id}>
              <path
                id={id}
                d={region.d}
                className="russia-map-region transition-colors duration-150 cursor-pointer"
                fill={regionFill(count, selected, hovered)}
                stroke={hovered ? '#d0c09f' : 'rgb(148 163 184 / 0.35)'}
                strokeWidth={hovered ? 1 : 0.6}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(prev => (prev === id ? null : prev))}
                onClick={() => onSelectMapId(selected ? null : id)}
                role="button"
                tabIndex={0}
                aria-label={`${region.title}${count > 0 ? `, ${count}` : ''}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMapId(selected ? null : id);
                  }
                }}
              />
              {count > 0 && (
                <text
                  x={REGION_LABEL_POINTS[id].x}
                  y={REGION_LABEL_POINTS[id].y}
                  className="russia-map-region-count pointer-events-none select-none"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={countLabelSize(count, mobileLayout)}
                  fontWeight={700}
                  fill={selected || hovered ? '#ffffff' : 'rgb(248 250 252 / 0.95)'}
                >
                  {count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredRegion && (
        <div className="russia-regions-map-tooltip pointer-events-none absolute left-3 bottom-3 max-w-xs rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
          <div className="font-semibold text-white">{hoveredRegion.title}</div>
          <div className="text-slate-400 mt-0.5">
            {hoveredCount > 0
              ? t('factories.regionObjects', { count: hoveredCount })
              : t('factories.schematicNoObjects')}
          </div>
        </div>
      )}
    </div>
  );
};
