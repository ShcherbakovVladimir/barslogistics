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
    className={`rzd-analytics-route-item w-full text-left p-2 rounded-lg border text-xs transition-colors ${
      selected
        ? 'rzd-analytics-route-item--selected border-indigo-500 bg-indigo-500/10'
        : 'border-slate-800 hover:border-slate-600'
    }`}
  >
    <div className="rzd-analytics-route-item-cargo font-semibold text-white truncate">
      {route.cargo_name || route.cargo_code}
    </div>
    <div className="rzd-analytics-route-item-path text-slate-400 truncate">
      {route.origin_name} → {route.dest_name}
    </div>
    <div className="rzd-analytics-route-item-meta text-emerald-400 mt-0.5">
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
        <span className="text-emerald-400">{batch.inserted_count}</span>
      </div>
      <div className="rzd-analytics-import-card-stat">
        <span className="rzd-analytics-import-card-stat-label">{t('rzdAnalytics.colDuplicates')}</span>
        <span className="text-amber-400">{batch.duplicate_count}</span>
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
        className={`rzd-analytics-routes-sheet app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle
          onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
          isDragging={isDragging}
        />
        <header className="modal-panel-header px-4 pb-2 shrink-0">
          <h3 className="text-sm font-bold text-white">{t('rzdAnalytics.topRoutes')}</h3>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto theme-scrollbar px-4 pb-4 space-y-2">
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
    <div className="rzd-analytics-page h-full min-h-0 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="rzd-analytics-header shrink-0 px-3 pt-3 sm:px-6 sm:pt-6 space-y-2 sm:space-y-4">
        <div className="rzd-analytics-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xl space-y-3 sm:space-y-4">
          <div className="rzd-analytics-toolbar-head flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Train className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="truncate">{t('rzdAnalytics.title')}</span>
              </h2>
              <p className="rzd-analytics-subtitle text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {t('rzdAnalytics.subtitle')}
              </p>
            </div>
            <div className="rzd-analytics-toolbar-actions flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="rzd-analytics-toolbar-btn px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
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
                    className="hidden"
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
                    className="rzd-analytics-toolbar-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {importing ? t('rzdAnalytics.importing') : t('rzdAnalytics.uploadCsv')}
                  </button>
                </>
              )}
            </div>
          </div>

          {(error || importMsg) && (
            <div className={`rzd-analytics-alert text-sm rounded-lg px-3 py-2 border ${error ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'}`}>
              {error || importMsg}
            </div>
          )}

          {showToolsToggle && (
            <button
              type="button"
              onClick={() => setToolsExpanded(v => !v)}
              className="rzd-analytics-tools-toggle w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 min-h-[2.75rem]"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                {t('rzdAnalytics.filters')}
              </span>
              {toolsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {(toolsExpanded || !showToolsToggle) && (
            <div className="rzd-analytics-tools-body theme-scrollbar">
              <div className="rzd-analytics-kpi-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {kpiCards.map(card => (
                  <div key={card.label} className="rzd-analytics-kpi-card bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3">
                    <div className="rzd-analytics-kpi-label text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-500 truncate">
                      {card.label}
                    </div>
                    <div className="rzd-analytics-kpi-value text-base sm:text-lg font-bold text-white mt-0.5 sm:mt-1 truncate">
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rzd-analytics-filters theme-scrollbar">
                <div className="rzd-analytics-filters-title flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  {t('rzdAnalytics.filters')}
                </div>
                <div className="rzd-analytics-filters-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  <label className="rzd-analytics-filter-item sm:col-span-2">
                    <span className="rzd-analytics-filter-label">{t('rzdAnalytics.search')}</span>
                    <input
                      type="text"
                      value={filters.cargoSearch ?? ''}
                      placeholder={t('rzdAnalytics.searchPlaceholder')}
                      onChange={e => updateFilters({ cargoSearch: e.target.value || undefined })}
                      className="rzd-analytics-field"
                    />
                  </label>
                  <label className="rzd-analytics-filter-item sm:col-span-2">
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

          <div className="rzd-analytics-tabs flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
            {([
              ['map', MapIcon, t('rzdAnalytics.tabMap')] as const,
              ['table', Table2, t('rzdAnalytics.tabTable')] as const,
              ['imports', BarChart3, t('rzdAnalytics.tabImports')] as const,
            ]).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`rzd-analytics-tab px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[2.5rem] sm:min-h-0 ${view === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="rzd-analytics-tab-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rzd-analytics-content flex-1 min-h-0 px-3 pb-3 sm:px-6 sm:pb-6 pt-2 sm:pt-3 overflow-hidden">
        {view === 'map' && (
          <div className="rzd-analytics-map-layout h-full min-h-0 flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="rzd-analytics-map-wrap relative flex-1 min-h-[180px] lg:col-span-2 lg:min-h-0">
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
            <div className="rzd-analytics-routes rzd-analytics-routes--desktop shrink-0 max-h-[26vh] sm:max-h-[30vh] lg:max-h-none lg:min-h-0 lg:h-full bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-y-auto theme-scrollbar space-y-2">
              <div className="rzd-analytics-routes-title text-xs font-semibold text-slate-300 sticky top-0 bg-slate-900 pb-1 z-[1]">
                {t('rzdAnalytics.topRoutes')}
              </div>
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
        )}

        {view === 'table' && (
          <div className="rzd-analytics-table-panel h-full min-h-0 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="rzd-analytics-table-desktop flex-1 min-h-0 overflow-auto theme-scrollbar responsive-table-wrap">
              <table className="w-full text-xs min-w-[36rem] xl:min-w-[48rem]">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-[1]">
                  <tr>
                    <th className="p-2 text-left">{t('rzdAnalytics.colDate')}</th>
                    <th className="p-2 text-left">{t('rzdAnalytics.colCargo')}</th>
                    <th className="p-2 text-left">{t('rzdAnalytics.colOrigin')}</th>
                    <th className="p-2 text-left">{t('rzdAnalytics.colDest')}</th>
                    <th className="p-2 text-left">{t('rzdAnalytics.colShipper')}</th>
                    <th className="p-2 text-right">{t('rzdAnalytics.colVolume')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="p-2 whitespace-nowrap">{r.shipment_date}</td>
                      <td className="p-2">{r.cargo_name}</td>
                      <td className="p-2">{r.origin_station_name}</td>
                      <td className="p-2">{r.dest_station_name}</td>
                      <td className="p-2 text-slate-400 truncate max-w-[10rem]">{r.shipper || '—'}</td>
                      <td className="p-2 text-right text-emerald-400">{r.volume.toLocaleString(localeTag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rzd-analytics-records-cards-mobile flex-1 min-h-0 overflow-y-auto theme-scrollbar p-3 space-y-2">
              {records.map(r => (
                <RecordCard key={r.id} record={r} localeTag={localeTag} t={t} />
              ))}
            </div>
            <div className="rzd-analytics-pagination shrink-0 flex items-center justify-between p-3 border-t border-slate-800 text-xs text-slate-400">
              <span>{t('rzdAnalytics.pageInfo', { from: pageFrom, to: pageTo, total: recordsTotal })}</span>
              <div className="rzd-analytics-pagination-actions flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rzd-analytics-pagination-btn px-2 py-1 rounded bg-slate-800 disabled:opacity-40 min-h-[2.5rem] sm:min-h-0"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={page * 50 >= recordsTotal}
                  onClick={() => setPage(p => p + 1)}
                  className="rzd-analytics-pagination-btn px-2 py-1 rounded bg-slate-800 disabled:opacity-40 min-h-[2.5rem] sm:min-h-0"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'imports' && (
          <div className="rzd-analytics-imports-panel h-full min-h-0 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="rzd-analytics-imports-table-desktop flex-1 min-h-0 overflow-auto theme-scrollbar responsive-table-wrap">
              <table className="w-full text-xs min-w-[28rem] xl:min-w-[36rem]">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-[1]">
                  <tr>
                    <th className="p-3 text-left">{t('rzdAnalytics.colFile')}</th>
                    <th className="p-3 text-right">{t('rzdAnalytics.colRows')}</th>
                    <th className="p-3 text-right">{t('rzdAnalytics.colInserted')}</th>
                    <th className="p-3 text-right">{t('rzdAnalytics.colDuplicates')}</th>
                    <th className="p-3 text-left">{t('rzdAnalytics.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} className="border-t border-slate-800">
                      <td className="p-3 text-white">{b.filename}</td>
                      <td className="p-3 text-right">{b.row_count}</td>
                      <td className="p-3 text-right text-emerald-400">{b.inserted_count}</td>
                      <td className="p-3 text-right text-amber-400">{b.duplicate_count}</td>
                      <td className="p-3 text-slate-400">{new Date(b.created_at).toLocaleString(localeTag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rzd-analytics-imports-cards-mobile flex-1 min-h-0 overflow-y-auto theme-scrollbar p-3 space-y-2">
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
