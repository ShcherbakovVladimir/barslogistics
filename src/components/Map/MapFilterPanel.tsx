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
    <div className="map-filter-field">
      <div className="map-filter-section-label">{label}</div>
      <div className="map-filter-chip-row">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(toggle(selected, opt.value))}
            className={`map-filter-chip${selected.includes(opt.value) ? ' is-active' : ''}`}
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
    <div className="map-filter-collapsible">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="map-filter-collapsible-toggle"
        aria-expanded={open}
      >
        <span className="map-filter-section-label">{label}</span>
        <span className="map-filter-collapsible-meta">
          {selected.length > 0 && (
            <span className="map-filter-collapsible-count">{selected.length}</span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>
      {open && (
        <div className="map-filter-collapsible-body">
          <div className="map-filter-chip-row">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(toggle(selected, opt.value))}
                className={`map-filter-chip${selected.includes(opt.value) ? ' is-active' : ''}`}
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

  const dragHandleClass = `map-filter-drag-handle${isDragging ? ' is-dragging' : ''}`;

  const isMobileSheet = variant === 'mobileSheet';

  const filterFields = (
    <>
      <div className="map-filter-field">
        <div className="map-filter-section-label">{t('mapFilter.viewMode')}</div>
        <div className="map-filter-view-modes">
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'sites' }))}
            className={`map-filter-view-tab map-filter-view-tab--sites${isSitesMode ? ' is-active' : ''}`}
          >
            {t('mapFilter.viewSites')}
          </button>
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'shipments' }))}
            className={`map-filter-view-tab map-filter-view-tab--shipments${!isSitesMode ? ' is-active' : ''}`}
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

      <div className="map-filter-contour-block map-filter-contour-block--outer">
        <div className="map-filter-contour-title map-filter-contour-title--outer">{t('mapFilter.contourOuter')}</div>
        <MultiCheck
          label={t('mapFilter.factoryTypes')}
          options={typeOptions}
          selected={filters.factoryTypes}
          onChange={factoryTypes => setFilters(prev => ({ ...prev, factoryTypes }))}
        />
      </div>

      <div className="map-filter-contour-block map-filter-contour-block--inner">
        <div className="map-filter-contour-title map-filter-contour-title--inner">{t('mapFilter.contourInner')}</div>
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
      <div className="map-filter-period-block">
        <div className="map-filter-section-label">{t('mapFilter.period')}</div>
        <div className="map-filter-chip-row">
          {(['year', 'quarter', 'month', 'week'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setFilters(prev => ({
                ...prev,
                period: { ...prev.period, mode: 'preset', granularity: g },
              }))}
              className={`map-filter-chip${
                filters.period.granularity === g && filters.period.mode === 'preset' ? ' is-active' : ''
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
            className={`map-filter-chip${filters.period.mode === 'range' ? ' is-active' : ''}`}
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

        <label className="map-filter-checkbox">
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
        className="map-filter-reset-btn"
      >
        {t('mapFilter.reset')}
      </button>
    </>
  );

  if (isMobileSheet) {
    return (
      <div className="map-filter-panel map-filter-panel--mobile-sheet pointer-events-auto">
        {filterFields}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="map-filter-collapsed-bar pointer-events-auto">
        <button
          type="button"
          title={t('mapFilter.dragHandle')}
          aria-label={t('mapFilter.dragHandle')}
          onPointerDown={onDragHandlePointerDown}
          className={`${dragHandleClass} map-filter-collapsed-drag`}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="map-filter-collapsed-divider" aria-hidden />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="map-filter-collapsed-toggle"
        >
          <Filter className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('mapFilter.title')}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className={`pointer-events-auto w-full map-filter-panel-scroll map-filter-panel-shell${isFloating ? ' is-floating' : ''}`}>
      <div className="map-filter-panel-header">
        <button
          type="button"
          title={t('mapFilter.dragHandle')}
          aria-label={t('mapFilter.dragHandle')}
          onPointerDown={onDragHandlePointerDown}
          className={dragHandleClass}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="map-filter-panel-header-title">
          <Filter className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('mapFilter.title')}</span>
        </div>
        {isFloating && onDock && (
          <button
            type="button"
            title={t('mapFilter.dock')}
            aria-label={t('mapFilter.dock')}
            onClick={onDock}
            className="map-filter-header-btn"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="map-filter-header-btn"
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
