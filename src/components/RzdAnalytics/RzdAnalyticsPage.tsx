import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Train,
  Upload,
  RefreshCw,
  BarChart3,
  Map as MapIcon,
  Table2,
  Filter,
  ChevronDown,
  ChevronUp,
  List,
} from 'lucide-react';
import type {
  RzdAggregatedRoute,
  RzdAnalyticsFilters,
  RzdAnalyticsRecord,
  RzdAnalyticsSummary,
  RzdImportBatch,
  User,
} from '../../types';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { canImportRzdAnalytics } from '../../utils/permissions';
import { isCompactLaptopViewport, subscribeViewportChange } from '../../utils/viewport';
import { isMobileLayout, subscribeDeviceLayout } from '../../utils/deviceLayout';
import { SearchableSelect } from '../UI/SearchableSelect';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import { RzdAnalyticsMap } from './RzdAnalyticsMap';

interface RzdAnalyticsPageProps {
  currentUser: User;
}

type ViewTab = 'map' | 'table' | 'imports';

function initialToolsExpanded(): boolean {
  if (isMobileLayout()) return false;
  return !isCompactLaptopViewport();
}

interface RouteListItemProps {
  route: RzdAggregatedRoute;
  selected: boolean;
  localeTag: string;
  tonsLabel: string;
  onSelect: (route: RzdAggregatedRoute) => void;
}

const RouteListItem = ({
  route,
  selected,
  localeTag,
  tonsLabel,
  onSelect,
}: RouteListItemProps) => (
  <button
    type="button"
    onClick={() => onSelect(route)}
    className={`rzd-analytics-route-item${selected ? ' rzd-analytics-route-item--selected' : ''}`}
  >
    <div className="rzd-analytics-route-item-cargo">
      {route.cargo_name || route.cargo_code}
    </div>
    <div className="rzd-analytics-route-item-path">
      {route.origin_name} → {route.dest_name}
    </div>
    <div className="rzd-analytics-route-item-meta">
      {route.total_volume.toLocaleString(localeTag)} {tonsLabel} · {route.shipment_count}
    </div>
  </button>
);

interface RecordCardProps {
  record: RzdAnalyticsRecord;
  localeTag: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const RecordCard = ({ record, localeTag, t }: RecordCardProps) => (
  <article className="rzd-analytics-record-card">
    <div className="rzd-analytics-record-card-header">
      <span className="rzd-analytics-record-card-date">{record.shipment_date}</span>
      <span className="rzd-analytics-record-card-volume">
        {record.volume.toLocaleString(localeTag)} {t('common.tons')}
      </span>
    </div>
    <div className="rzd-analytics-record-card-cargo">{record.cargo_name}</div>
    <div className="rzd-analytics-record-card-route">
      <span className="rzd-analytics-record-card-label">{t('rzdAnalytics.colOrigin')}</span>
      <span>{record.origin_station_name}</span>
    </div>
    <div className="rzd-analytics-record-card-route">
      <span className="rzd-analytics-record-card-label">{t('rzdAnalytics.colDest')}</span>
      <span>{record.dest_station_name}</span>
    </div>
    {record.shipper && (
      <div className="rzd-analytics-record-card-shipper">
        <span className="rzd-analytics-record-card-label">{t('rzdAnalytics.colShipper')}</span>
        <span>{record.shipper}</span>
      </div>
    )}
  </article>
);

interface ImportCardProps {
  batch: RzdImportBatch;
  localeTag: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ImportCard = ({ batch, localeTag, t }: ImportCardProps) => (
  <article className="rzd-analytics-import-card">
    <div className="rzd-analytics-import-card-filename">{batch.filename}</div>
    <div className="rzd-analytics-import-card-date">
      {new Date(batch.created_at).toLocaleString(localeTag)}
    </div>
    <div className="rzd-analytics-import-card-stats">
      <div className="rzd-analytics-import-card-stat">
        <span className="rzd-analytics-import-card-stat-label">{t('rzdAnalytics.colRows')}</span>
        <span>{batch.row_count}</span>
      </div>
      <div className="rzd-analytics-import-card-stat">
        <span className="rzd-analytics-import-card-stat-label">{t('rzdAnalytics.colInserted')}</span>
        <span className="rzd-analytics-import-card-stat-value rzd-analytics-import-card-stat-value--inserted">{batch.inserted_count}</span>
      </div>
      <div className="rzd-analytics-import-card-stat">
        <span className="rzd-analytics-import-card-stat-label">{t('rzdAnalytics.colDuplicates')}</span>
        <span className="rzd-analytics-import-card-stat-value rzd-analytics-import-card-stat-value--duplicates">{batch.duplicate_count}</span>
      </div>
    </div>
  </article>
);

interface RoutesSheetProps {
  routes: RzdAggregatedRoute[];
  selectedRoute: RzdAggregatedRoute | null;
  localeTag: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSelectRoute: (route: RzdAggregatedRoute) => void;
  onClose: () => void;
}

const RoutesSheet = ({
  routes,
  selectedRoute,
  localeTag,
  t,
  onSelectRoute,
  onClose,
}: RoutesSheetProps) => {
  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  const handleSelect = (route: RzdAggregatedRoute) => {
    onSelectRoute(route);
    onClose();
  };

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`rzd-analytics-routes-sheet app-modal-sheet modal-panel ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle
          onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
          isDragging={isDragging}
        />
        <header className="modal-panel-header app-modal-sheet-header">
          <h3 className="rzd-analytics-routes-sheet-title">{t('rzdAnalytics.topRoutes')}</h3>
        </header>
        <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
          {routes.slice(0, 20).map(r => (
            <RouteListItem
              key={`${r.origin_station_id}-${r.dest_station_id}-${r.cargo_code}`}
              route={r}
              selected={selectedRoute === r}
              localeTag={localeTag}
              tonsLabel={t('common.tons')}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export function RzdAnalyticsPage({ currentUser }: RzdAnalyticsPageProps) {
  const { t, localeTag } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const canImport = canImportRzdAnalytics(currentUser.role);

  const [filters, setFilters] = useState<RzdAnalyticsFilters>({});
  const [summary, setSummary] = useState<RzdAnalyticsSummary | null>(null);
  const [routes, setRoutes] = useState<RzdAggregatedRoute[]>([]);
  const [records, setRecords] = useState<RzdAnalyticsRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [batches, setBatches] = useState<RzdImportBatch[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    cargo_codes: { code: string; name: string; count: number }[];
    origin_regions: string[];
    dest_regions: string[];
  } | null>(null);
  const [view, setView] = useState<ViewTab>('map');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<RzdAggregatedRoute | null>(null);
  const [directoryStats, setDirectoryStats] = useState<{ total: number; with_esr: number } | null>(null);
  const [compactLaptop, setCompactLaptop] = useState(isCompactLaptopViewport);
  const [mobileLayout, setMobileLayout] = useState(isMobileLayout);
  const [toolsExpanded, setToolsExpanded] = useState(initialToolsExpanded);
  const [routesSheetOpen, setRoutesSheetOpen] = useState(false);

  useEffect(() => {
    const applyViewport = () => setCompactLaptop(isCompactLaptopViewport());
    applyViewport();
    return subscribeViewportChange(applyViewport);
  }, []);

  useEffect(() => {
    const applyLayout = () => setMobileLayout(isMobileLayout());
    applyLayout();
    return subscribeDeviceLayout(applyLayout);
  }, []);

  const showToolsToggle = compactLaptop || mobileLayout;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sum, rts, rec, bts, dirStats] = await Promise.all([
        ApiService.getRzdAnalyticsSummary(filters),
        ApiService.getRzdAnalyticsRoutes(filters, 800),
        ApiService.getRzdAnalyticsRecords(filters, page, 50),
        ApiService.getRzdImportBatches(),
        ApiService.getRzdStationDirectoryStats(),
      ]);
      setSummary(sum);
      setRoutes(rts);
      setRecords(rec.records);
      setRecordsTotal(rec.total);
      setBatches(bts);
      setDirectoryStats(dirStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('rzdAnalytics.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, t]);

  useEffect(() => {
    void ApiService.getRzdFilterOptions().then(setFilterOptions).catch(() => {});
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportMsg('');
    setError('');
    try {
      const csv = await file.text();
      const result = await ApiService.importRzdAnalyticsCsv(csv, file.name);
      if (result.skipped_file) {
        setImportMsg(t('rzdAnalytics.importSkipped', { name: result.batch.filename }));
      } else {
        setImportMsg(t('rzdAnalytics.importOk', {
          inserted: result.inserted,
          duplicates: result.duplicates,
        }));
      }
      setFilterOptions(null);
      void ApiService.getRzdFilterOptions().then(setFilterOptions).catch(() => {});
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('rzdAnalytics.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const cargoOptions = useMemo(
    () => filterOptions?.cargo_codes.map(c => ({
      value: c.code,
      label: `${c.name} (${c.count})`,
      keywords: c.name,
    })) ?? [],
    [filterOptions],
  );

  const originRegionOptions = useMemo(
    () => filterOptions?.origin_regions.map(r => ({ value: r, label: r })) ?? [],
    [filterOptions],
  );

  const destRegionOptions = useMemo(
    () => filterOptions?.dest_regions.map(r => ({ value: r, label: r })) ?? [],
    [filterOptions],
  );

  const kpiCards = useMemo(() => [
    { label: t('rzdAnalytics.kpiRecords'), value: summary?.record_count ?? 0 },
    { label: t('rzdAnalytics.kpiVolume'), value: `${(summary?.total_volume ?? 0).toLocaleString(localeTag, { maximumFractionDigits: 0 })} ${t('common.tons')}` },
    { label: t('rzdAnalytics.kpiRoutes'), value: summary?.route_count ?? 0 },
    { label: t('rzdAnalytics.kpiStations'), value: summary?.station_count ?? 0 },
    {
      label: t('rzdAnalytics.kpiDirectory'),
      value: directoryStats ? `${directoryStats.with_esr} / ${directoryStats.total}` : '—',
    },
  ], [summary, directoryStats, t, localeTag]);

  const updateFilters = (patch: Partial<RzdAnalyticsFilters>) => {
    setPage(1);
    setFilters(f => ({ ...f, ...patch }));
  };

  const pageFrom = records.length ? (page - 1) * 50 + 1 : 0;
  const pageTo = (page - 1) * 50 + records.length;

  return (
    <div className="rzd-analytics-page">
      <div className="rzd-analytics-header">
        <div className="rzd-analytics-toolbar shipments-list-toolbar">
          <div className="rzd-analytics-toolbar-top">
            <div className="shipments-list-toolbar-head">
              <span className="shipments-list-toolbar-icon" aria-hidden>
                <Train />
              </span>
              <div className="shipments-list-toolbar-text">
                <h2 className="shipments-list-title">
                  <span className="truncate">{t('rzdAnalytics.title')}</span>
                </h2>
                <p className="shipments-list-subtitle rzd-analytics-subtitle">{t('rzdAnalytics.subtitle')}</p>
              </div>
            </div>
            <div className="rzd-analytics-toolbar-actions">
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="rzd-analytics-toolbar-btn rzd-analytics-toolbar-btn--refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {t('rzdAnalytics.refresh')}
              </button>
              {canImport && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="rzd-analytics-file-input"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void handleImport(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={importing}
                    className="rzd-analytics-toolbar-btn rzd-analytics-toolbar-btn--upload"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {importing ? t('rzdAnalytics.importing') : t('rzdAnalytics.uploadCsv')}
                  </button>
                </>
              )}
            </div>
          </div>

          {(error || importMsg) && (
            <div className={`rzd-analytics-alert ${error ? 'rzd-analytics-alert--error' : 'rzd-analytics-alert--success'}`}>
              {error || importMsg}
            </div>
          )}

          {showToolsToggle && (
            <button
              type="button"
              onClick={() => setToolsExpanded(v => !v)}
              className="rzd-analytics-tools-toggle"
            >
              <span className="rzd-analytics-tools-toggle-label">
                <Filter className="w-3.5 h-3.5" />
                {t('rzdAnalytics.filters')}
              </span>
              {toolsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {(toolsExpanded || !showToolsToggle) && (
            <div className="rzd-analytics-tools-body theme-scrollbar">
              <div className="rzd-analytics-kpi-grid">
                {kpiCards.map(card => (
                  <div key={card.label} className="rzd-analytics-kpi-card">
                    <div className="rzd-analytics-kpi-label">{card.label}</div>
                    <div className="rzd-analytics-kpi-value">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="rzd-analytics-filters theme-scrollbar">
                <div className="rzd-analytics-filters-title">
                  <Filter className="w-3.5 h-3.5" />
                  {t('rzdAnalytics.filters')}
                </div>
                <div className="rzd-analytics-filters-grid">
                  <label className="rzd-analytics-filter-item">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.dateFrom')}</span>
                    <input
                      type="date"
                      value={filters.dateFrom ?? ''}
                      onChange={e => updateFilters({ dateFrom: e.target.value || undefined })}
                      className="rzd-analytics-field"
                    />
                  </label>
                  <label className="rzd-analytics-filter-item">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.dateTo')}</span>
                    <input
                      type="date"
                      value={filters.dateTo ?? ''}
                      onChange={e => updateFilters({ dateTo: e.target.value || undefined })}
                      className="rzd-analytics-field"
                    />
                  </label>
                  <label className="rzd-analytics-filter-item">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.cargo')}</span>
                    <SearchableSelect
                      value={filters.cargoCode ?? ''}
                      onChange={v => updateFilters({ cargoCode: v || undefined })}
                      options={cargoOptions}
                      allowEmpty
                      emptyLabel={t('rzdAnalytics.allCargo')}
                      placeholder={t('rzdAnalytics.allCargo')}
                      triggerClassName="rzd-analytics-field"
                      inlinePanel={mobileLayout}
                      panelClassName="rzd-analytics-dropdown-panel"
                      listClassName="rzd-analytics-dropdown-list"
                    />
                  </label>
                  <label className="rzd-analytics-filter-item">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.originRegion')}</span>
                    <SearchableSelect
                      value={filters.originRegion ?? ''}
                      onChange={v => updateFilters({ originRegion: v || undefined })}
                      options={originRegionOptions}
                      allowEmpty
                      emptyLabel={t('rzdAnalytics.allRegions')}
                      placeholder={t('rzdAnalytics.allRegions')}
                      triggerClassName="rzd-analytics-field"
                      inlinePanel={mobileLayout}
                      panelClassName="rzd-analytics-dropdown-panel"
                      listClassName="rzd-analytics-dropdown-list"
                    />
                  </label>
                  <label className="rzd-analytics-filter-item rzd-analytics-filter-item--wide">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.search')}</span>
                    <input
                      type="text"
                      value={filters.cargoSearch ?? ''}
                      placeholder={t('rzdAnalytics.searchPlaceholder')}
                      onChange={e => updateFilters({ cargoSearch: e.target.value || undefined })}
                      className="rzd-analytics-field"
                    />
                  </label>
                  <label className="rzd-analytics-filter-item rzd-analytics-filter-item--wide">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.destRegion')}</span>
                    <SearchableSelect
                      value={filters.destRegion ?? ''}
                      onChange={v => updateFilters({ destRegion: v || undefined })}
                      options={destRegionOptions}
                      allowEmpty
                      emptyLabel={t('rzdAnalytics.allRegions')}
                      placeholder={t('rzdAnalytics.allRegions')}
                      triggerClassName="rzd-analytics-field"
                      inlinePanel={mobileLayout}
                      panelClassName="rzd-analytics-dropdown-panel"
                      listClassName="rzd-analytics-dropdown-list"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="rzd-analytics-tabs">
            {([
              ['map', MapIcon, t('rzdAnalytics.tabMap')] as const,
              ['table', Table2, t('rzdAnalytics.tabTable')] as const,
              ['imports', BarChart3, t('rzdAnalytics.tabImports')] as const,
            ]).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`rzd-analytics-tab${view === id ? ' is-active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="rzd-analytics-tab-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rzd-analytics-content">
        {view === 'map' && (
          <div className="rzd-analytics-map-layout">
            <div className="rzd-analytics-map-wrap">
              <RzdAnalyticsMap routes={routes} onSelectRoute={setSelectedRoute} />
              {mobileLayout && (
                <div className="rzd-analytics-map-fab-bar">
                  <button
                    type="button"
                    onClick={() => setRoutesSheetOpen(true)}
                    className={`rzd-analytics-map-fab ${routesSheetOpen ? 'is-active' : ''}`}
                    aria-label={t('rzdAnalytics.topRoutes')}
                  >
                    <List className="w-4 h-4 shrink-0" />
                    <span className="rzd-analytics-map-fab-label">{t('rzdAnalytics.topRoutes')}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="rzd-analytics-routes rzd-analytics-routes--desktop">
              <div className="rzd-analytics-routes-title">
                {t('rzdAnalytics.topRoutes')}
              </div>
              <div className="rzd-analytics-routes-list theme-scrollbar">
              {routes.slice(0, 20).map(r => (
                <RouteListItem
                  key={`${r.origin_station_id}-${r.dest_station_id}-${r.cargo_code}`}
                  route={r}
                  selected={selectedRoute === r}
                  localeTag={localeTag}
                  tonsLabel={t('common.tons')}
                  onSelect={setSelectedRoute}
                />
              ))}
              </div>
            </div>
          </div>
        )}

        {view === 'table' && (
          <div className="rzd-analytics-table-panel">
            <div className="rzd-analytics-table-desktop responsive-table-wrap theme-scrollbar">
              <table className="rzd-analytics-table">
                <thead>
                  <tr>
                    <th>{t('rzdAnalytics.colDate')}</th>
                    <th>{t('rzdAnalytics.colCargo')}</th>
                    <th>{t('rzdAnalytics.colOrigin')}</th>
                    <th>{t('rzdAnalytics.colDest')}</th>
                    <th>{t('rzdAnalytics.colShipper')}</th>
                    <th className="rzd-analytics-col-volume">{t('rzdAnalytics.colVolume')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="rzd-analytics-cell-date">{r.shipment_date}</td>
                      <td>{r.cargo_name}</td>
                      <td>{r.origin_station_name}</td>
                      <td>{r.dest_station_name}</td>
                      <td className="rzd-analytics-cell-shipper">{r.shipper || '—'}</td>
                      <td className="rzd-analytics-col-volume rzd-analytics-cell-volume">{r.volume.toLocaleString(localeTag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rzd-analytics-records-cards-mobile theme-scrollbar">
              {records.map(r => (
                <RecordCard key={r.id} record={r} localeTag={localeTag} t={t} />
              ))}
            </div>
            <div className="rzd-analytics-pagination">
              <span>{t('rzdAnalytics.pageInfo', { from: pageFrom, to: pageTo, total: recordsTotal })}</span>
              <div className="rzd-analytics-pagination-actions">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rzd-analytics-pagination-btn"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={page * 50 >= recordsTotal}
                  onClick={() => setPage(p => p + 1)}
                  className="rzd-analytics-pagination-btn"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'imports' && (
          <div className="rzd-analytics-imports-panel">
            <div className="rzd-analytics-imports-table-desktop responsive-table-wrap theme-scrollbar">
              <table className="rzd-analytics-table rzd-analytics-imports-table">
                <thead>
                  <tr>
                    <th>{t('rzdAnalytics.colFile')}</th>
                    <th className="rzd-analytics-col-num">{t('rzdAnalytics.colRows')}</th>
                    <th className="rzd-analytics-col-num">{t('rzdAnalytics.colInserted')}</th>
                    <th className="rzd-analytics-col-num">{t('rzdAnalytics.colDuplicates')}</th>
                    <th>{t('rzdAnalytics.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id}>
                      <td className="rzd-analytics-cell-filename">{b.filename}</td>
                      <td className="rzd-analytics-col-num">{b.row_count}</td>
                      <td className="rzd-analytics-col-num rzd-analytics-cell-inserted">{b.inserted_count}</td>
                      <td className="rzd-analytics-col-num rzd-analytics-cell-duplicates">{b.duplicate_count}</td>
                      <td className="rzd-analytics-cell-date">{new Date(b.created_at).toLocaleString(localeTag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rzd-analytics-imports-cards-mobile theme-scrollbar">
              {batches.map(b => (
                <ImportCard key={b.id} batch={b} localeTag={localeTag} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>

      {routesSheetOpen && (
        <RoutesSheet
          routes={routes}
          selectedRoute={selectedRoute}
          localeTag={localeTag}
          t={t}
          onSelectRoute={setSelectedRoute}
          onClose={() => setRoutesSheetOpen(false)}
        />
      )}
    </div>
  );
}
