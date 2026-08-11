import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, GripVertical, Pin } from 'lucide-react';
import type { Factory, FilterState, FactoryType, FlowType, Product, ThirdPartyCarrier, SalesManager } from '../../types';
import { activeProducts } from '../../constants/products';
import { activeCarriers } from '../../constants/carriers';
import { activeSalesManagers, salesManagerLabel } from '../../constants/salesManagers';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n/types';
import { createDefaultFilterState } from '../../utils/mapFilterDefaults';
import { SearchableSelect } from '../UI/SearchableSelect';

interface MapFilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  factories: Factory[];
  products: Product[];
  carriers: ThirdPartyCarrier[];
  salesManagers: SalesManager[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isFloating?: boolean;
  isDragging?: boolean;
  onDock?: () => void;
  onDragHandlePointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  /** Flat layout inside mobile bottom/side sheet — no nested card chrome or duplicate header */
  variant?: 'default' | 'mobileSheet';
}

const FACTORY_TYPES: FactoryType[] = ['gok', 'port', 'steel_mill', 'slag_dump', 'coal_mine'];
const FLOW_TYPES: FlowType[] = ['shipment', 'purchase', 'internal'];

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

function MultiCheck<T extends string>({
  options,
  selected,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(toggle(selected, opt.value))}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
              selected.includes(opt.value)
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CollapsibleMultiCheck<T extends string>({
  label,
  options,
  selected,
  onChange,
  defaultOpen = false,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="map-filter-collapsible-toggle w-full flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-950/60 hover:bg-slate-800/80 transition-colors"
        aria-expanded={open}
      >
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {selected.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-medium">
              {selected.length}
            </span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </span>
      </button>
      {open && (
        <div className="p-2 pt-1 border-t border-slate-800">
          <div className="flex flex-wrap gap-1">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(toggle(selected, opt.value))}
                className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                  selected.includes(opt.value)
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MAP_FILTER_DROPDOWN_PANEL = 'map-filter-dropdown-panel';
const MAP_FILTER_YEAR_LIST = 'map-filter-year-list';
const MAP_FILTER_PERIOD_LIST = 'map-filter-period-list';

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  filters,
  setFilters,
  factories,
  products,
  carriers,
  salesManagers,
  collapsed = false,
  onToggleCollapse,
  isFloating = false,
  isDragging = false,
  onDock,
  onDragHandlePointerDown,
  variant = 'default',
}) => {
  const { t, locale } = useI18n();
  const loc = locale as Locale;

  const ourSites = useMemo(
    () => factories.filter(f => f.is_ours),
    [factories],
  );

  const productOptions = useMemo(
    () => activeProducts(products).map(p => ({
      value: p.id,
      label: loc === 'ru' ? p.name_ru : p.name_en,
    })),
    [products, loc],
  );

  const carrierOptions = useMemo(
    () => activeCarriers(carriers).map(c => ({
      value: c.id,
      label: c.name,
    })),
    [carriers],
  );

  const managerOptions = useMemo(
    () => activeSalesManagers(salesManagers).map(m => ({
      value: m.id,
      label: salesManagerLabel(m),
    })),
    [salesManagers],
  );

  const typeOptions = FACTORY_TYPES.map(type => ({
    value: type,
    label: t(`factoryType.${type}`),
  }));

  const flowOptions = FLOW_TYPES.map(ft => ({
    value: ft,
    label: t(`flowType.${ft}`),
  }));

  const contourOptions = [
    { value: 'outer' as const, label: t('mapFilter.contourOuter') },
    { value: 'inner' as const, label: t('mapFilter.contourInner') },
  ];

  const siteOptions = ourSites.map(s => ({ value: s.id, label: s.name }));
  const isSitesMode = filters.viewMode === 'sites';

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  const yearOptions = useMemo(
    () => years.map(y => ({ value: String(y), label: String(y) })),
    [years],
  );

  const periodValueOptions = useMemo(() => {
    if (filters.period.granularity === 'quarter') {
      return [1, 2, 3, 4].map(q => ({
        value: String(q),
        label: t('mapFilter.quarterN', { n: q }),
      }));
    }
    if (filters.period.granularity === 'month') {
      return Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      }));
    }
    if (filters.period.granularity === 'week') {
      return Array.from({ length: 52 }, (_, i) => ({
        value: String(i + 1),
        label: t('mapFilter.weekN', { n: i + 1 }),
      }));
    }
    return [];
  }, [filters.period.granularity, t]);

  const mapFilterHeaderBtn =
    'map-filter-header-btn flex items-center justify-center shrink-0 h-8 w-8 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors touch-none select-none';

  const dragHandleClass = `map-filter-drag-handle ${mapFilterHeaderBtn} ${
    isDragging ? 'is-dragging cursor-grabbing text-indigo-300 bg-indigo-600/20' : 'cursor-grab'
  }`;

  const isMobileSheet = variant === 'mobileSheet';

  const filterFields = (
    <>
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {t('mapFilter.viewMode')}
        </div>
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'sites' }))}
            className={`px-2 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${
              isSitesMode
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('mapFilter.viewSites')}
          </button>
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'shipments' }))}
            className={`px-2 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${
              !isSitesMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('mapFilter.viewShipments')}
          </button>
        </div>
      </div>

      {!isSitesMode && (
        <>
          <CollapsibleMultiCheck
            label={t('mapFilter.products')}
            options={productOptions}
            selected={filters.products}
            onChange={products => setFilters(prev => ({ ...prev, products }))}
            defaultOpen={false}
          />
          <CollapsibleMultiCheck
            label={t('mapFilter.carriers')}
            options={carrierOptions}
            selected={filters.carriers}
            onChange={carriersSel => setFilters(prev => ({ ...prev, carriers: carriersSel }))}
            defaultOpen={false}
          />
          <CollapsibleMultiCheck
            label={t('mapFilter.managers')}
            options={managerOptions}
            selected={filters.managers}
            onChange={managersSel => setFilters(prev => ({ ...prev, managers: managersSel }))}
            defaultOpen={false}
          />
        </>
      )}

      <MultiCheck
        label={t('mapFilter.contours')}
        options={contourOptions}
        selected={filters.contours}
        onChange={contours => setFilters(prev => ({ ...prev, contours }))}
      />

      <div className="map-filter-contour-block map-filter-contour-block--outer pl-2 border-l-2 border-slate-700 space-y-2">
        <div className="text-[10px] font-bold text-amber-400/90">{t('mapFilter.contourOuter')}</div>
        <MultiCheck
          label={t('mapFilter.factoryTypes')}
          options={typeOptions}
          selected={filters.factoryTypes}
          onChange={factoryTypes => setFilters(prev => ({ ...prev, factoryTypes }))}
        />
      </div>

      <div className="map-filter-contour-block map-filter-contour-block--inner pl-2 border-l-2 border-emerald-600/50 space-y-2">
        <div className="text-[10px] font-bold text-emerald-400/90">{t('mapFilter.contourInner')}</div>
        <MultiCheck
          label={t('mapFilter.ourSites')}
          options={siteOptions}
          selected={filters.ourSites}
          onChange={ourSites => setFilters(prev => ({ ...prev, ourSites }))}
        />
        {!isSitesMode && (
          <MultiCheck
            label={t('mapFilter.flowTypes')}
            options={flowOptions}
            selected={filters.flowTypes}
            onChange={flowTypes => setFilters(prev => ({ ...prev, flowTypes }))}
          />
        )}
      </div>

      {!isSitesMode && (
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="text-[10px] font-semibold text-slate-400 uppercase">{t('mapFilter.period')}</div>
        <div className="flex gap-1 flex-wrap">
          {(['year', 'quarter', 'month', 'week'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setFilters(prev => ({
                ...prev,
                period: { ...prev.period, mode: 'preset', granularity: g },
              }))}
              className={`px-2 py-0.5 rounded text-[10px] border ${
                filters.period.granularity === g && filters.period.mode === 'preset'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {t(`mapFilter.granularity.${g}`)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilters(prev => ({
              ...prev,
              period: { ...prev.period, mode: 'range' },
            }))}
            className={`px-2 py-0.5 rounded text-[10px] border ${
              filters.period.mode === 'range'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {t('mapFilter.range')}
          </button>
        </div>

        {filters.period.mode === 'preset' ? (
          <div className="flex gap-2">
            <SearchableSelect
              value={String(filters.period.year ?? new Date().getFullYear())}
              onChange={v => setFilters(prev => ({
                ...prev,
                period: { ...prev.period, year: Number(v) },
              }))}
              options={yearOptions}
              searchable={false}
              className="flex-1 min-w-0"
              panelClassName={MAP_FILTER_DROPDOWN_PANEL}
              listClassName={MAP_FILTER_YEAR_LIST}
            />
            {filters.period.granularity !== 'year' && (
              <SearchableSelect
                value={String(filters.period.value ?? 1)}
                onChange={v => setFilters(prev => ({
                  ...prev,
                  period: { ...prev.period, value: Number(v) },
                }))}
                options={periodValueOptions}
                searchable={filters.period.granularity === 'week'}
                className="flex-1 min-w-0"
                panelClassName={MAP_FILTER_DROPDOWN_PANEL}
                listClassName={MAP_FILTER_PERIOD_LIST}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <input
              type="date"
              value={filters.period.rangeStart ?? ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                period: { ...prev.period, rangeStart: e.target.value },
              }))}
            />
            <input
              type="date"
              value={filters.period.rangeEnd ?? ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                period: { ...prev.period, rangeEnd: e.target.value },
              }))}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-[10px] text-slate-400 map-filter-checkbox">
          <input
            type="checkbox"
            checked={filters.compareEnabled}
            onChange={e => setFilters(prev => ({ ...prev, compareEnabled: e.target.checked }))}
          />
          {t('mapFilter.compare')}
        </label>
        {filters.compareEnabled && (
          <SearchableSelect
            value={String(filters.compare?.year ?? new Date().getFullYear() - 1)}
            onChange={v => setFilters(prev => ({
              ...prev,
              compare: {
                ...(prev.compare ?? prev.period),
                year: Number(v),
                mode: 'preset',
                granularity: prev.period.granularity,
                value: prev.period.value,
              },
            }))}
            options={yearOptions}
            searchable={false}
            panelClassName={MAP_FILTER_DROPDOWN_PANEL}
            listClassName={MAP_FILTER_YEAR_LIST}
          />
        )}
      </div>
      )}

      <button
        type="button"
        onClick={() => setFilters(prev => createDefaultFilterState({ viewMode: prev.viewMode }))}
        className="w-full py-1.5 text-[10px] text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800"
      >
        {t('mapFilter.reset')}
      </button>
    </>
  );

  if (isMobileSheet) {
    return (
      <div className="map-filter-panel map-filter-panel--mobile-sheet pointer-events-auto text-xs text-slate-200">
        {filterFields}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="map-filter-collapsed-bar pointer-events-auto flex items-stretch overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-lg text-xs text-slate-200">
        <button
          type="button"
          title={t('mapFilter.dragHandle')}
          aria-label={t('mapFilter.dragHandle')}
          onPointerDown={onDragHandlePointerDown}
          className={`${dragHandleClass} map-filter-collapsed-drag h-auto rounded-none`}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="w-px shrink-0 self-stretch bg-slate-700/80" aria-hidden />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="map-filter-collapsed-toggle flex flex-1 items-center justify-center gap-1.5 px-3 hover:bg-slate-800/80 transition-colors min-w-0"
        >
          <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{t('mapFilter.title')}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className={`pointer-events-auto w-full map-filter-panel-scroll overflow-y-auto bg-slate-900/95 backdrop-blur-md border rounded-xl shadow-xl text-xs text-slate-200 scrollbar-thin ${
      isFloating ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : 'border-slate-700'
    }`}>
      <div className="map-filter-panel-header sticky top-0 z-10 flex items-center gap-1 px-2 py-2 border-b border-slate-700 bg-slate-900/95">
        <button
          type="button"
          title={t('mapFilter.dragHandle')}
          aria-label={t('mapFilter.dragHandle')}
          onPointerDown={onDragHandlePointerDown}
          className={dragHandleClass}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 font-semibold text-slate-100 min-w-0 flex-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{t('mapFilter.title')}</span>
        </div>
        {isFloating && onDock && (
          <button
            type="button"
            title={t('mapFilter.dock')}
            aria-label={t('mapFilter.dock')}
            onClick={onDock}
            className={mapFilterHeaderBtn}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={mapFilterHeaderBtn}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="map-filter-panel">
        {filterFields}
      </div>
    </div>
  );
};
