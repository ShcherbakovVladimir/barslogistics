import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Factory, SupplyLink, CargoStatus, FactoryType, FilterState, User, AggregatedRoute, EnterpriseStatus, Product, ThirdPartyCarrier, SalesManager, CsvPreviewFileEntry } from '../../types';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n/types';
import { Layers, RefreshCw, Eye, ChevronDown, ChevronUp, X, MapPin, Check, Loader2, Move, Filter, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { ApiService } from '../../services/api';
import type { AddressGeocodeResult, KladrSuggestion } from '../../types';
import { KladrAddressInput } from '../UI/KladrAddressInput';
import { SearchableSelect } from '../UI/SearchableSelect';
import { buildRoutePoints, buildRouteParallelIndex, pointOnRoute } from '../../utils/mapRoutes';
import { applyMapFilters } from '../../utils/mapFilter';
import { createDefaultFilterState } from '../../utils/mapFilterDefaults';
import { buildFactoryTooltipHtml, disableLeafletTooltipClick, closeAllMarkerTooltips } from '../../utils/mapTooltip';
import { computeFactorySalesTrends, buildFactoryTrendBadgeHtml } from '../../utils/factoryTrend';
import { MapFilterPanel } from './MapFilterPanel';
import { MapSearchBox } from './MapSearchBox';
import { useDraggablePanel } from './useDraggablePanel';
import { ThemeToggle } from '../Theme/ThemeToggle';
import { useAppSelector } from '../../store/hooks';
import type { ThemeMode } from '../../store/themeSlice';
import { shouldExpandMapPanelsByDefault, subscribeViewportChange } from '../../utils/viewport';
import { isMobileLayout, subscribeDeviceLayout } from '../../utils/deviceLayout';
import { syncMapFilterLayoutMetrics } from '../../utils/mapFilterLayout';
import { SITE_CATEGORIES, getSiteCategoryLabel } from '../../constants/siteCategories';
import { canUploadData } from '../../utils/permissions';
import {
  downloadInternalShipmentsCsvTemplate,
  validateInternalShipmentsCsvStructure,
} from '../../utils/internalShipmentsCsv';

export interface LogisticsMapProps {
  factories: Factory[];
  supplyLinks: SupplyLink[];
  products: Product[];
  carriers: ThirdPartyCarrier[];
  salesManagers: SalesManager[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  highlightedFactoryId: string | null;
  onHighlightFactory: (factoryId: string | null) => void;
  onOpenFactoryDetails?: (factory: Factory) => void;
  selectedShipment: SupplyLink | null;
  onSelectShipment: (shipment: SupplyLink | null) => void;
  selectedRoute: AggregatedRoute | null;
  onSelectRoute: (route: AggregatedRoute | null) => void;
  currentUser: User | null;
  canEditPosition?: boolean;
  canEditType?: boolean;
  onSaveFactoryPosition?: (factoryId: string, update: Partial<Factory>) => Promise<void>;
  onSaveFactoryType?: (factoryId: string, type: FactoryType) => Promise<void>;
  pendingPositionEditId?: string | null;
  onPendingPositionEditHandled?: () => void;
  mobileSearchOpen?: boolean;
  onMobileSearchOpenChange?: (open: boolean) => void;
  csvPreviewFiles?: CsvPreviewFileEntry[];
  csvPreviewActiveFileId?: string | null;
  csvPreviewActive?: boolean;
  onCsvPreviewFileLoaded?: (entry: CsvPreviewFileEntry) => void;
  onCsvPreviewSelectFile?: (fileId: string | null) => void;
  onCsvPreviewRemoveFile?: (fileId: string) => void;
  onCsvPreviewShow?: () => void;
  onCsvPreviewRestore?: () => void;
}

const typeColors: Record<FactoryType, string> = {
  gok: '#f59e0b',
  port: '#3b82f6',
  steel_mill: '#ef4444',
  slag_dump: '#6b7280',
  coal_mine: '#8b5cf6'
};

const enterpriseBorderColors: Record<EnterpriseStatus, string> = {
  active: '#22c55e',
  paused: '#eab308',
  inactive: '#ef4444',
  never: '#9ca3af',
};

function getEnterpriseBorder(factory: Factory): string {
  if (factory.is_ours) return '#ffffff';
  return enterpriseBorderColors[factory.enterprise_status || 'active'];
}
const statusColors: Record<CargoStatus, string> = {
  en_route: '#10b981',
  delayed: '#f59e0b',
  arrived: '#64748b',
  loading: '#a855f7',
  alert: '#dc2626'
};

type TileKey = ThemeMode;

interface TileConfig {
  url: string;
  attribution: string;
  /** Invert OSM tiles for a true dark look while keeping Cyrillic labels */
  tileFilter?: 'invert';
}

const OSM_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

function getTileLayers(locale: Locale): Record<TileKey, TileConfig> {
  if (locale === 'ru') {
    return {
      dark: { ...OSM_TILE, tileFilter: 'invert' },
      light: OSM_TILE,
    };
  }

  return {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    },
  };
}

export function LogisticsMap({
  factories,
  supplyLinks,
  products,
  carriers,
  salesManagers,
  filters,
  setFilters,
  highlightedFactoryId,
  onHighlightFactory,
  onOpenFactoryDetails,
  selectedShipment,
  onSelectShipment,
  selectedRoute,
  onSelectRoute,
  currentUser,
  canEditPosition = false,
  canEditType = false,
  onSaveFactoryPosition,
  onSaveFactoryType,
  pendingPositionEditId = null,
  onPendingPositionEditHandled,
  mobileSearchOpen = false,
  onMobileSearchOpenChange,
  csvPreviewFiles = [],
  csvPreviewActiveFileId = null,
  csvPreviewActive = false,
  onCsvPreviewFileLoaded,
  onCsvPreviewSelectFile,
  onCsvPreviewRemoveFile,
  onCsvPreviewShow,
  onCsvPreviewRestore,
}: LogisticsMapProps) {
  const { t, localeTag, locale } = useI18n();
  const tileLayers = useMemo(() => getTileLayers(locale), [locale]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const searchColumnRef = useRef<HTMLDivElement>(null);
  const bottomStackRef = useRef<HTMLDivElement>(null);
  const positionDockRef = useRef<HTMLDivElement>(null);
  const positionDockAlignedRef = useRef(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [csvPanelMsg, setCsvPanelMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [dockedFilterOffset, setDockedFilterOffset] = useState({ x: 8, y: 56 });
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const activeTileUrlRef = useRef<string | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const activeTile = useAppSelector(state => state.theme.mode);
  const tileFilterClass = tileLayers[activeTile].tileFilter === 'invert' ? ' map-tiles-inverted' : '';
  const [filterPanelOpen, setFilterPanelOpen] = useState(() => shouldExpandMapPanelsByDefault());
  const [legendOpen, setLegendOpen] = useState(() => shouldExpandMapPanelsByDefault());
  const [mobileLayout, setMobileLayout] = useState(() => isMobileLayout());
  const [mobileFilterSheet, setMobileFilterSheet] = useState(false);
  const [mobileLegendSheet, setMobileLegendSheet] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [positionEditFactoryId, setPositionEditFactoryId] = useState<string | null>(null);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeSaveError, setTypeSaveError] = useState('');
  const [positionPreview, setPositionPreview] = useState<AddressGeocodeResult | null>(null);
  const [positionAddressQuery, setPositionAddressQuery] = useState('');
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionSaving, setPositionSaving] = useState(false);
  const reverseRequestSeq = useRef(0);
  const reverseDebounceRef = useRef<number | null>(null);
  const skipReverseGeocodeRef = useRef(false);

  const isPositionEditing = positionEditFactoryId !== null;
  const isFactorySheetOpen = mobileLayout && highlightedFactoryId !== null && !isPositionEditing;

  useEffect(() => {
    document.documentElement.classList.toggle('map-position-editing', isPositionEditing);
    document.documentElement.classList.toggle('map-factory-sheet-open', isFactorySheetOpen);
    return () => {
      document.documentElement.classList.remove('map-position-editing');
      document.documentElement.classList.remove('map-factory-sheet-open');
    };
  }, [isPositionEditing, isFactorySheetOpen]);

  const {
    panelRef: filterPanelRef,
    panelStyle: filterPanelStyle,
    isFloating: isFilterPanelFloating,
    isDragging: isFilterPanelDragging,
    dock: dockFilterPanel,
    onDragHandlePointerDown: onFilterPanelDragStart,
  } = useDraggablePanel({
    containerRef: mapShellRef,
    storageKey: 'barslogistics_map_filter_panel',
    defaultPosition: dockedFilterOffset,
  });

  useEffect(() => {
    if (!isMobileLayout()) return;
    setFilterPanelOpen(false);
    setLegendOpen(false);
  }, []);

  useEffect(() => {
    return subscribeDeviceLayout(() => {
      const next = isMobileLayout();
      setMobileLayout(next);
      setMobileFilterSheet(false);
      setMobileLegendSheet(false);
      onMobileSearchOpenChange?.(false);
      if (next) {
        dockFilterPanel();
      }
      if (mapRef.current) {
        requestAnimationFrame(() => mapRef.current?.invalidateSize());
      }
    });
  }, [dockFilterPanel, onMobileSearchOpenChange]);

  useEffect(() => {
    if (!mobileLayout || (!mobileFilterSheet && !mobileLegendSheet && !mobileSearchOpen)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileLayout, mobileFilterSheet, mobileLegendSheet, mobileSearchOpen]);

  const filterPanelWrapperStyle: CSSProperties = isFilterPanelFloating
    ? filterPanelStyle
    : {
        position: 'absolute',
        left: dockedFilterOffset.x,
        top: dockedFilterOffset.y,
        zIndex: 30,
      };

  const typeLabels = useMemo(() => ({
    gok: t('factoryType.gok'),
    port: t('factoryType.port'),
    steel_mill: t('factoryType.steel_mill'),
    slag_dump: t('factoryType.slag_dump'),
    coal_mine: t('factoryType.coal_mine')
  }), [t]);

  const typePinLabels = useMemo(() => ({
    gok: t('factoryType.gok_pin'),
    port: t('factoryType.port_pin'),
    steel_mill: t('factoryType.steel_mill_pin'),
    slag_dump: t('factoryType.slag_dump_pin'),
    coal_mine: t('factoryType.coal_mine_pin')
  }), [t]);

  const sourceLabels = useMemo(() => ({
    own: t('map.legendOwn'),
    rzd: t('map.legendRzd'),
  }), [t]);

  const factoryMap = useMemo(() => {
    const map = new Map<string, Factory>();
    factories.forEach(f => map.set(f.id, f));
    return map;
  }, [factories]);

  const filteredData = useMemo(
    () => applyMapFilters(factories, supplyLinks, filters, currentUser, highlightedFactoryId, products),
    [factories, supplyLinks, filters, currentUser, highlightedFactoryId, products],
  );

  const factoryTrends = useMemo(
    () => computeFactorySalesTrends(factories, supplyLinks, filters, currentUser, products),
    [factories, supplyLinks, filters, currentUser, products],
  );

  const canUseCsvPreview = Boolean(currentUser && canUploadData(currentUser.role) && onCsvPreviewFileLoaded);
  const activeCsvFile = csvPreviewFiles.find(f => f.id === csvPreviewActiveFileId) ?? null;

  const handleCsvFileUpload = useCallback(async (file: File) => {
    if (!onCsvPreviewFileLoaded) return;
    setCsvUploading(true);
    setCsvPanelMsg(null);
    try {
      const csv = await file.text();
      const structure = validateInternalShipmentsCsvStructure(csv);
      if (!structure.ok) {
        setCsvPanelMsg({
          tone: 'err',
          text: `${t('map.csvStructureError')}: ${structure.errors.join('; ')}`,
        });
        return;
      }
      const result = await ApiService.previewInternalShipmentsCsv(csv, file.name);
      const entry: CsvPreviewFileEntry = {
        id: `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        filename: result.filename || file.name,
        links: result.links,
        factories: result.factories,
        errors: result.errors,
        skipped: result.skipped,
        row_count: result.row_count,
        date_from: result.date_from,
        date_to: result.date_to,
      };
      onCsvPreviewFileLoaded(entry);
      setCsvPanelMsg({
        tone: result.links.length > 0 ? 'ok' : 'err',
        text: t('map.csvPreviewOk', { count: result.links.length, skipped: result.skipped }),
      });
    } catch (err) {
      setCsvPanelMsg({
        tone: 'err',
        text: err instanceof Error ? err.message : t('map.csvPreviewFailed'),
      });
    } finally {
      setCsvUploading(false);
    }
  }, [onCsvPreviewFileLoaded, t]);

  const mobileFilterPanel = (
    <MapFilterPanel
      filters={filters}
      setFilters={setFilters}
      factories={factories}
      products={products}
      carriers={carriers}
      salesManagers={salesManagers}
      variant="mobileSheet"
    />
  );

  const isLegendTypeActive = useCallback((type: FactoryType) => (
    filters.viewMode === 'sites'
    && filters.factoryTypes.length === 1
    && filters.factoryTypes[0] === type
    && filters.contours.length === 1
    && filters.contours[0] === 'outer'
  ), [filters.viewMode, filters.factoryTypes, filters.contours]);

  const isLegendOursActive = (
    filters.viewMode === 'sites'
    && filters.contours.length === 1
    && filters.contours[0] === 'inner'
    && filters.factoryTypes.length === 0
  );

  const handleLegendTypeFilter = useCallback((type: FactoryType) => {
    setFilters(prev => {
      const alreadyActive = prev.viewMode === 'sites'
        && prev.factoryTypes.length === 1
        && prev.factoryTypes[0] === type
        && prev.contours.length === 1
        && prev.contours[0] === 'outer';
      if (alreadyActive) return createDefaultFilterState();
      return createDefaultFilterState({
        viewMode: 'sites',
        factoryTypes: [type],
        contours: ['outer'],
      });
    });
  }, [setFilters]);

  const handleLegendOursFilter = useCallback(() => {
    setFilters(prev => {
      const alreadyActive = prev.viewMode === 'sites'
        && prev.contours.length === 1
        && prev.contours[0] === 'inner'
        && prev.factoryTypes.length === 0;
      if (alreadyActive) return createDefaultFilterState();
      return createDefaultFilterState({
        viewMode: 'sites',
        contours: ['inner'],
      });
    });
  }, [setFilters]);

  const legendBody = (
    <>
      <div className="map-mobile-legend-grid map-legend-grid">
        {Object.entries(typeLabels).map(([type, label]) => {
          const factoryType = type as FactoryType;
          const active = isLegendTypeActive(factoryType);
          return (
            <button
              key={type}
              type="button"
              className={`map-legend-item map-legend-item--filter${active ? ' is-active' : ''}`}
              onClick={() => handleLegendTypeFilter(factoryType)}
              aria-pressed={active}
              title={label}
            >
              <span
                className={`map-legend-swatch${active ? ' is-active' : ''}`}
                style={{ backgroundColor: typeColors[factoryType] }}
                aria-hidden
              />
              <span className="map-legend-label truncate">{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`map-legend-item map-legend-item--ours map-legend-item--filter${isLegendOursActive ? ' is-active' : ''}`}
          onClick={handleLegendOursFilter}
          aria-pressed={isLegendOursActive}
          title={t('map.legendOurs')}
        >
          <span
            className={`map-legend-swatch map-legend-swatch--ours${isLegendOursActive ? ' is-active' : ''}`}
            aria-hidden
          />
          <span className="map-legend-label">{t('map.legendOurs')}</span>
        </button>
      </div>
      <div className="map-legend-routes">
        {filters.viewMode === 'sites' ? (
          <span>{t('map.legendSitesMode')}</span>
        ) : (
          <>
            <span className="shrink-0">{t('map.legendRoutes', { count: filteredData.aggregatedRoutes.length })}</span>
            <div className="map-legend-route-keys">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> {t('map.legendOwn')}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 border-b border-dashed inline-block" /> {t('map.legendRzd')}</span>
            </div>
          </>
        )}
      </div>
      {filters.viewMode === 'shipments' && (
        <div className="map-legend-status">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-green-500" />{t('map.enterpriseActive')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-yellow-500" />{t('map.enterprisePaused')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-red-500" />{t('map.enterpriseInactive')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-gray-400" />{t('map.enterpriseNever')}</span>
        </div>
      )}
    </>
  );

  useLayoutEffect(() => {
    if (isFilterPanelFloating) return;

    const updateDockedOffset = () => {
      if (!mapShellRef.current || !searchColumnRef.current) return;
      const containerRect = mapShellRef.current.getBoundingClientRect();
      const searchRect = searchColumnRef.current.getBoundingClientRect();
      setDockedFilterOffset({
        x: searchRect.left - containerRect.left,
        y: searchRect.bottom - containerRect.top + 8,
      });
    };

    updateDockedOffset();
    const observer = new ResizeObserver(updateDockedOffset);
    if (searchColumnRef.current) observer.observe(searchColumnRef.current);
    if (mapShellRef.current) observer.observe(mapShellRef.current);
    return () => observer.disconnect();
  }, [isFilterPanelFloating, filterPanelOpen, filters.searchQuery, canUseCsvPreview, csvPreviewActive, csvPreviewFiles.length]);

  useLayoutEffect(() => {
    const syncLayout = () => {
      syncMapFilterLayoutMetrics(
        mapShellRef.current,
        filterPanelRef.current,
        bottomStackRef.current,
        searchColumnRef.current,
      );
    };

    syncLayout();

    const observers: ResizeObserver[] = [];
    const observe = (el: HTMLElement | null) => {
      if (!el) return;
      const ro = new ResizeObserver(syncLayout);
      ro.observe(el);
      observers.push(ro);
    };

    observe(mapShellRef.current);
    observe(filterPanelRef.current);
    observe(bottomStackRef.current);
    observe(searchColumnRef.current);

    const unsubViewport = subscribeViewportChange(syncLayout);
    return () => {
      observers.forEach(ro => ro.disconnect());
      unsubViewport();
    };
  }, [
    isFilterPanelFloating,
    filterPanelOpen,
    legendOpen,
    dockedFilterOffset.x,
    dockedFilterOffset.y,
    filterPanelStyle.left,
    filterPanelStyle.top,
    canUseCsvPreview,
    csvPreviewActive,
    csvPreviewFiles.length,
    highlightedFactoryId,
  ]);

  const highlightedFactory = useMemo(
    () => (highlightedFactoryId ? factories.find(f => f.id === highlightedFactoryId) ?? null : null),
    [factories, highlightedFactoryId],
  );

  useEffect(() => {
    setTypeSaveError('');
  }, [highlightedFactoryId, highlightedFactory?.type]);

  useEffect(() => {
    if (!highlightedFactoryId || !mapRef.current || !mapReady || isPositionEditing) return;
    const factory = factories.find(f => f.id === highlightedFactoryId);
    if (!factory) return;

    const map = mapRef.current;
    const targetZoom = Math.max(map.getZoom(), 11);
    map.invalidateSize();
    map.flyTo([factory.latitude, factory.longitude], targetZoom, { duration: 0.85 });

    const timer = window.setTimeout(() => {
      markersRef.current.get(highlightedFactoryId)?.openTooltip();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [highlightedFactoryId, factories, mapReady, isPositionEditing]);

  useEffect(() => {
    if (    positionEditFactoryId && positionEditFactoryId !== highlightedFactoryId) {
      setPositionEditFactoryId(null);
      setPositionPreview(null);
      setPositionAddressQuery('');
      setPositionLoading(false);
    }
  }, [highlightedFactoryId, positionEditFactoryId]);

  const getPositionPickLatLng = useCallback((): L.LatLng | null => {
    const map = mapRef.current;
    if (!map) return null;

    if (mobileLayout && isPositionEditing) {
      const dockHeight = positionDockRef.current?.getBoundingClientRect().height ?? 0;
      if (dockHeight > 0) {
        const size = map.getSize();
        return map.containerPointToLatLng(L.point(size.x / 2, (size.y - dockHeight) / 2));
      }
    }

    return map.getCenter();
  }, [mobileLayout, isPositionEditing]);

  const lookupPositionAtCenter = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !positionEditFactoryId) return;

    const pickLatLng = getPositionPickLatLng();
    if (!pickLatLng) return;

    const seq = ++reverseRequestSeq.current;
    setPositionLoading(true);

    try {
      const result = await ApiService.reverseGeocode(pickLatLng.lat, pickLatLng.lng);
      if (seq !== reverseRequestSeq.current) return;
      setPositionPreview(result);
    } catch {
      if (seq !== reverseRequestSeq.current) return;
      setPositionPreview({
        latitude: pickLatLng.lat,
        longitude: pickLatLng.lng,
        geocode_source: 'map_pick',
      });
    } finally {
      if (seq === reverseRequestSeq.current) setPositionLoading(false);
    }
  }, [positionEditFactoryId, getPositionPickLatLng]);

  const closeOpenTooltips = useCallback(() => {
    closeAllMarkerTooltips(markersRef.current.values());
  }, []);

  const startPositionEdit = useCallback((factory: Factory) => {
    positionDockAlignedRef.current = false;
    setPositionEditFactoryId(factory.id);
    setPositionPreview(null);
    setPositionAddressQuery('');
    setPositionLoading(false);
    closeOpenTooltips();

    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    map.flyTo([factory.latitude, factory.longitude], Math.max(map.getZoom(), 15), { duration: 0.6 });
    if (!isMobileLayout()) {
      window.setTimeout(() => {
        void lookupPositionAtCenter();
      }, 700);
    }
  }, [lookupPositionAtCenter, closeOpenTooltips]);

  const applyKladrAddressPick = useCallback(async (item: KladrSuggestion) => {
    setPositionAddressQuery(item.normalizedAddress);
    setPositionLoading(true);
    skipReverseGeocodeRef.current = true;
    try {
      const geo = await ApiService.geocodeAddress(item.normalizedAddress, item.region);
      setPositionPreview({
        latitude: geo.latitude,
        longitude: geo.longitude,
        normalized_address: geo.normalized_address || item.normalizedAddress,
        region: geo.region || item.region,
        kladr_id: geo.kladr_id || item.id,
        geocode_source: 'map_pick+kladr_manual',
      });
      const map = mapRef.current;
      if (map) {
        map.flyTo([geo.latitude, geo.longitude], Math.max(map.getZoom(), 16), { duration: 0.55 });
      }
    } catch {
      const center = mapRef.current?.getCenter();
      setPositionPreview(prev => ({
        latitude: center?.lat ?? prev?.latitude ?? 0,
        longitude: center?.lng ?? prev?.longitude ?? 0,
        normalized_address: item.normalizedAddress,
        region: item.region,
        kladr_id: item.id,
        geocode_source: 'map_pick+kladr_manual',
      }));
    } finally {
      setPositionLoading(false);
    }
  }, []);

  const cancelPositionEdit = useCallback(() => {
    positionDockAlignedRef.current = false;
    reverseRequestSeq.current += 1;
    if (reverseDebounceRef.current != null) {
      window.clearTimeout(reverseDebounceRef.current);
      reverseDebounceRef.current = null;
    }
    setPositionEditFactoryId(null);
    setPositionPreview(null);
    setPositionAddressQuery('');
    setPositionLoading(false);
    setPositionSaving(false);
  }, []);

  const confirmPositionEdit = useCallback(async () => {
    if (!positionEditFactoryId || !positionPreview || !onSaveFactoryPosition) return;
    setPositionSaving(true);
    try {
      await onSaveFactoryPosition(positionEditFactoryId, {
        latitude: positionPreview.latitude,
        longitude: positionPreview.longitude,
        address: positionPreview.normalized_address || '',
        region: positionPreview.region || undefined,
        kladr_id: positionPreview.kladr_id,
        geocode_source: positionPreview.geocode_source,
      });
      cancelPositionEdit();
    } catch {
      setPositionSaving(false);
    }
  }, [positionEditFactoryId, positionPreview, onSaveFactoryPosition, cancelPositionEdit]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !positionEditFactoryId) return;

    const onMoveEnd = () => {
      if (skipReverseGeocodeRef.current) {
        skipReverseGeocodeRef.current = false;
        return;
      }
      if (reverseDebounceRef.current != null) {
        window.clearTimeout(reverseDebounceRef.current);
      }
      reverseDebounceRef.current = window.setTimeout(() => {
        reverseDebounceRef.current = null;
        void lookupPositionAtCenter();
      }, 450);
    };

    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      if (reverseDebounceRef.current != null) {
        window.clearTimeout(reverseDebounceRef.current);
        reverseDebounceRef.current = null;
      }
    };
  }, [mapReady, positionEditFactoryId, lookupPositionAtCenter]);

  useEffect(() => {
    if (!pendingPositionEditId || !mapReady) return;
    const factory = factories.find(f => f.id === pendingPositionEditId);
    if (!factory) return;
    onHighlightFactory(factory.id);
    startPositionEdit(factory);
    onPendingPositionEditHandled?.();
  }, [pendingPositionEditId, mapReady, factories, onHighlightFactory, startPositionEdit, onPendingPositionEditHandled]);

  const handleClearSelection = useCallback(() => {
    if (isPositionEditing) {
      cancelPositionEdit();
      return;
    }
    onHighlightFactory(null);
    onSelectShipment(null);
    onSelectRoute(null);
    closeOpenTooltips();
  }, [isPositionEditing, cancelPositionEdit, onHighlightFactory, onSelectShipment, onSelectRoute, closeOpenTooltips]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const onMapClick = () => {
      if (isPositionEditing) return;
      handleClearSelection();
    };
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [mapReady, handleClearSelection, isPositionEditing]);

  useEffect(() => {
    if (!mapReady) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isPositionEditing) {
        cancelPositionEdit();
        return;
      }
      if (highlightedFactoryId) {
        handleClearSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapReady, highlightedFactoryId, handleClearSelection, isPositionEditing, cancelPositionEdit]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [55.0, 60.0],
      zoom: 4,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(tileLayers[activeTile].url, {
      maxZoom: 18,
      attribution: tileLayers[activeTile].attribution
    }).addTo(map);

    tileLayerRef.current = tile;
    activeTileUrlRef.current = tileLayers[activeTile].url;

    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;
    mapRef.current = map;
    setMapReady(true);
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !mapRef.current) return;

    const map = mapRef.current;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const config = tileLayers[activeTile];
    if (activeTileUrlRef.current === config.url && tileLayerRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(config.url, {
      maxZoom: 18,
      attribution: config.attribution,
    }).addTo(mapRef.current);
    tileLayerRef.current = newTile;
    activeTileUrlRef.current = config.url;
  }, [activeTile, locale, tileLayers]);

  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    const group = layerGroupRef.current;
    group.clearLayers();

    const { filteredFactories, aggregatedRoutes } = filteredData;
    const visibleFactoryIds = new Set(filteredFactories.map(f => f.id));
    const isSitesMode = filters.viewMode === 'sites';
    const parallelIndex = buildRouteParallelIndex(
      aggregatedRoutes.flatMap(r => r.shipments),
    );

    const selectedFactoryIds = new Set<string>();
    if (!isSitesMode && highlightedFactoryId) {
      selectedFactoryIds.add(highlightedFactoryId);
      supplyLinks.forEach(l => {
        if (l.origin_id === highlightedFactoryId) selectedFactoryIds.add(l.destination_id);
        if (l.destination_id === highlightedFactoryId) selectedFactoryIds.add(l.origin_id);
      });
    }

    if (!isSitesMode) aggregatedRoutes.forEach(route => {
      const orig = factoryMap.get(route.origin_id);
      const dest = factoryMap.get(route.destination_id);
      if (!orig || !dest) return;
      if (!visibleFactoryIds.has(orig.id) || !visibleFactoryIds.has(dest.id)) return;

      const latest = route.shipments.find(s => s.id === route.latest_shipment_id) ?? route.shipments[0];

      const isHighlighted =
        (highlightedFactoryId && (route.origin_id === highlightedFactoryId || route.destination_id === highlightedFactoryId)) ||
        (selectedRoute && selectedRoute.id === route.id) ||
        (selectedShipment && route.shipments.some(s => s.id === selectedShipment.id));

      const opacity = highlightedFactoryId || selectedShipment || selectedRoute ? (isHighlighted ? 0.95 : 0.15) : 0.7;
      const weight = isHighlighted ? 4 : route.source === 'own' ? 2.5 : 2;
      const color = route.status ? statusColors[route.status] : (route.source === 'own' ? '#10b981' : '#60a5fa');

      const curvePoints = buildRoutePoints(orig, dest, parallelIndex.get(latest.id) ?? 0);

      const polyline = L.polyline(curvePoints, {
        color: color,
        weight: weight,
        opacity: opacity,
        dashArray: route.source === 'rzd' ? '6, 6' : undefined,
        smoothFactor: 1
      });

      polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        closeAllMarkerTooltips(markersRef.current.values());
        onSelectRoute(route);
      });

      group.addLayer(polyline);

      const trackableStatuses: CargoStatus[] = ['en_route', 'delayed', 'alert', 'loading'];
      const shipmentStatus = latest.status ?? 'en_route';
      const hasPosition = latest.progress_pct != null || (latest.current_lat != null && latest.current_lng != null);
      const showVehicle = trackableStatuses.includes(shipmentStatus) && hasPosition;
      if (showVehicle) {
        const [vehLat, vehLng] = latest.progress_pct != null
          ? pointOnRoute(curvePoints, latest.progress_pct)
          : [latest.current_lat!, latest.current_lng!];

        const vehicleColor = statusColors[shipmentStatus] || statusColors.en_route;
        const vehicleHtml = `
          <div class="relative flex items-center justify-center w-6 h-6 rounded-full text-white shadow-lg border-2 border-white animate-pulse" style="background-color: ${vehicleColor}; box-shadow: 0 0 0 2px ${vehicleColor}80;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        `;
        const vehicleIcon = L.divIcon({
          html: vehicleHtml,
          className: 'custom-vehicle-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const vehicleMarker = L.marker([vehLat, vehLng], { icon: vehicleIcon });
        vehicleMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectRoute(route);
        });
        group.addLayer(vehicleMarker);
      }
    });

    markersRef.current.clear();

    filteredFactories.forEach(factory => {
      const isSelected = highlightedFactoryId === factory.id;
      const isBeingRepositioned = positionEditFactoryId === factory.id;
      const isConnected = selectedFactoryIds.has(factory.id);
      const isDimmed = !isSitesMode && highlightedFactoryId && !isConnected;

      const bgColor = typeColors[factory.type] || '#3b82f6';
      const isOurs = factory.is_ours;

      const borderColor = getEnterpriseBorder(factory);
      const borderWidth = factory.is_ours ? 2 : 3;

      const trend = !isSitesMode ? factoryTrends.get(factory.id) : undefined;
      const trendBadge = trend
        ? buildFactoryTrendBadgeHtml(
            trend.direction,
            t(`map.trend${trend.direction === 'up' ? 'Up' : trend.direction === 'down' ? 'Down' : 'Flat'}`),
          )
        : '';

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-125 ${isDimmed ? 'opacity-30' : isBeingRepositioned ? 'opacity-40' : 'opacity-100'}">
          ${isOurs ? `<div class="absolute -inset-1.5 rounded-full bg-emerald-400/50 animate-ping"></div>` : ''}
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full text-white shadow-md border-${borderWidth} ${isSelected ? 'ring-4 ring-amber-400/40 scale-125 z-50' : ''}" style="background-color: ${bgColor}; border: ${borderWidth}px solid ${isSelected ? '#fcd34d' : borderColor};">
            <span class="text-[9px] font-bold leading-none tracking-tight">${typePinLabels[factory.type]}</span>
          </div>
          ${trendBadge}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-factory-icon',
        iconSize: trend ? [40, 28] : [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([factory.latitude, factory.longitude], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (isPositionEditing) return;
        marker.closeTooltip();
        if (highlightedFactoryId === factory.id) {
          onHighlightFactory(null);
          onSelectShipment(null);
          onSelectRoute(null);
          return;
        }
        onHighlightFactory(factory.id);
        onOpenFactoryDetails?.(factory);
      });

      const tooltipContent = buildFactoryTooltipHtml(
        factory,
        typeLabels[factory.type],
        typeColors[factory.type] || '#3b82f6',
        t('common.ours'),
        factory.holding ? t('map.tooltipHolding', { holding: factory.holding }) : undefined,
        trend
          ? {
              direction: trend.direction,
              currentVolume: trend.currentVolume,
              previousVolume: trend.previousVolume,
              labelUp: t('map.trendUp'),
              labelDown: t('map.trendDown'),
              labelFlat: t('map.trendFlat'),
              volumeLabel: t('map.trendVolumeCompare', {
                current: trend.currentVolume.toLocaleString(localeTag),
                previous: trend.previousVolume.toLocaleString(localeTag),
              }),
            }
          : undefined,
      );

      marker.bindTooltip(tooltipContent, { className: 'custom-map-tooltip' });
      disableLeafletTooltipClick(marker);
      group.addLayer(marker);
      markersRef.current.set(factory.id, marker);
    });

  }, [filteredData, factoryTrends, filters.viewMode, highlightedFactoryId, positionEditFactoryId, selectedShipment, selectedRoute, factoryMap, supplyLinks, t, typeLabels, typePinLabels, sourceLabels, localeTag, onHighlightFactory, onOpenFactoryDetails, onSelectRoute, isPositionEditing]);

  const closeMobileSearch = useCallback(() => {
    onMobileSearchOpenChange?.(false);
  }, [onMobileSearchOpenChange]);

  const handleSearchSelectFactory = useCallback((factory: Factory) => {
    onHighlightFactory(factory.id);
    onOpenFactoryDetails?.(factory);
    closeMobileSearch();
  }, [onHighlightFactory, onOpenFactoryDetails, closeMobileSearch]);

  const handleSearchSelectShipment = useCallback((shipment: SupplyLink) => {
    onSelectShipment(shipment);
    onHighlightFactory(shipment.origin_id);
    closeMobileSearch();
  }, [onSelectShipment, onHighlightFactory, closeMobileSearch]);

  const filterPanel = (
    <MapFilterPanel
      filters={filters}
      setFilters={setFilters}
      factories={factories}
      products={products}
      carriers={carriers}
      salesManagers={salesManagers}
      collapsed={!filterPanelOpen}
      onToggleCollapse={() => setFilterPanelOpen(v => !v)}
      isFloating={isFilterPanelFloating}
      isDragging={isFilterPanelDragging}
      onDock={dockFilterPanel}
      onDragHandlePointerDown={onFilterPanelDragStart}
    />
  );

  const handleResetView = () => {
    if (isPositionEditing) cancelPositionEdit();
    if (mapRef.current) {
      mapRef.current.setView([55.0, 60.0], 4);
    }
    handleClearSelection();
  };

  const editingFactory = positionEditFactoryId
    ? factories.find(f => f.id === positionEditFactoryId) ?? null
    : null;

  const hideMobileFabs = mobileLayout && (
    mobileFilterSheet || mobileLegendSheet || Boolean(highlightedFactory) || isPositionEditing
  );

  useEffect(() => {
    if (!mobileLayout || !highlightedFactoryId) return;
    setMobileFilterSheet(false);
    setMobileLegendSheet(false);
  }, [mobileLayout, highlightedFactoryId]);

  useEffect(() => {
    if (!mobileLayout || !isPositionEditing) return;
    setMobileFilterSheet(false);
    setMobileLegendSheet(false);
  }, [mobileLayout, isPositionEditing]);

  useLayoutEffect(() => {
    if (!mobileLayout || !isPositionEditing) {
      mapShellRef.current?.style.removeProperty('--map-position-dock-height');
      return;
    }

    const map = mapRef.current;
    const shell = mapShellRef.current;
    const dock = positionDockRef.current;
    if (!map || !shell || !dock) return;

    let rafId = 0;
    const syncPositionDockInset = () => {
      const height = Math.ceil(dock.getBoundingClientRect().height);
      shell.style.setProperty('--map-position-dock-height', `${height}px`);

      if (!positionDockAlignedRef.current && editingFactory) {
        const size = map.getSize();
        const crosshairPoint = L.point(size.x / 2, (size.y - height) / 2);
        const factoryPoint = map.latLngToContainerPoint([editingFactory.latitude, editingFactory.longitude]);
        map.panBy(crosshairPoint.subtract(factoryPoint), { animate: false });
        positionDockAlignedRef.current = true;
        void lookupPositionAtCenter();
      }
    };

    syncPositionDockInset();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncPositionDockInset);
    });
    observer.observe(dock);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      shell.style.removeProperty('--map-position-dock-height');
    };
  }, [mobileLayout, isPositionEditing, positionEditFactoryId, mapReady, editingFactory, lookupPositionAtCenter]);

  const renderFactoryHighlightActions = (showClearButton: boolean, touchFriendly: boolean) => (
    <div
      className={`map-factory-highlight-actions flex flex-wrap gap-2${
        touchFriendly ? ' map-factory-highlight-actions--touch' : ''
      }`}
    >
      {!isPositionEditing && (
        <>
          {showClearButton && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="map-map-action-btn map-map-action-btn--ghost"
            >
              {t('map.clearSelection')}
            </button>
          )}
          {canEditPosition && onSaveFactoryPosition && (
            <button
              type="button"
              onClick={() => startPositionEdit(highlightedFactory!)}
              className={`map-map-action-btn map-map-action-btn--position${
                touchFriendly ? ' map-factory-sheet-action map-factory-sheet-action--position' : ''
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t('map.editPosition')}
            </button>
          )}
          {onOpenFactoryDetails && (
            <button
              type="button"
              onClick={() => onOpenFactoryDetails(highlightedFactory!)}
              className={`map-map-action-btn map-map-action-btn--primary${
                touchFriendly ? ' map-factory-sheet-action map-factory-sheet-action--details' : ''
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {t('map.openDetails')}
            </button>
          )}
        </>
      )}
    </div>
  );

  const renderFactoryTypeField = (
    selectClassName: string,
    options?: { inlinePanel?: boolean },
  ) => {
    if (!highlightedFactory) return null;

    if (canEditType && onSaveFactoryType) {
      return (
        <div className="block">
          <span className="text-[10px] text-slate-500">{t('facilityModal.typeLabel')}</span>
          <div className={selectClassName}>
            <SearchableSelect
              value={highlightedFactory.type}
              onChange={v => {
                const next = v as FactoryType;
                if (next === highlightedFactory.type) return;
                void (async () => {
                  setTypeSaving(true);
                  setTypeSaveError('');
                  try {
                    await onSaveFactoryType(highlightedFactory.id, next);
                  } catch (err) {
                    setTypeSaveError(
                      err instanceof Error ? err.message : t('facilityModal.typeSaveError'),
                    );
                  } finally {
                    setTypeSaving(false);
                  }
                })();
              }}
              options={SITE_CATEGORIES.map(category => ({
                value: category.id,
                label: getSiteCategoryLabel(category.id, locale),
              }))}
              searchable
              disabled={typeSaving}
              className="w-full"
              panelClassName="map-filter-dropdown-panel"
              listClassName="map-filter-period-list"
              inlinePanel={options?.inlinePanel}
            />
          </div>
          {typeSaveError && (
            <div className="text-[10px] text-red-300 mt-1">{typeSaveError}</div>
          )}
          <div className="text-[11px] text-slate-400 mt-1">{highlightedFactory.region}</div>
        </div>
      );
    }

    return (
      <div className="text-[11px] text-slate-400">
        {typeLabels[highlightedFactory.type]} · {highlightedFactory.region}
      </div>
    );
  };

  const renderFactoryHighlightCard = () => {
    if (!highlightedFactory) return null;

    return (
      <div className="map-factory-highlight map-chrome-panel map-chrome-panel--highlight mb-2 max-w-sm">
        <div className="map-chrome-panel-head">
          <div className="min-w-0 flex-1">
            <div className="map-factory-highlight-name break-words">{highlightedFactory.name}</div>
            <div className="text-[10px] font-mono map-factory-id mt-0.5 break-all">{highlightedFactory.id}</div>
            <div className="mt-1.5">{renderFactoryTypeField('map-factory-type-select map-filter-panel mt-0.5')}</div>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="map-panel-close-btn"
            title={t('map.clearSelectionTitle')}
            aria-label={t('map.clearSelectionTitle')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2">{renderFactoryHighlightActions(true, false)}</div>
      </div>
    );
  };

  const renderFactorySheetBody = () => {
    if (!highlightedFactory) return null;

    return (
      <div className="map-sheet-panel text-xs text-slate-200">
        <div className="text-[10px] font-mono map-factory-id break-all">{highlightedFactory.id}</div>
        {renderFactoryTypeField('map-sheet-select mt-1.5', { inlinePanel: true })}
        {renderFactoryHighlightActions(false, true)}
      </div>
    );
  };

  const renderPositionEditBody = () => (
    <>
      <p className="text-[11px] text-slate-400">{t('map.positionEditHint')}</p>

      <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wide text-slate-500">
          {t('map.positionAddressRefine')}
        </label>
        <KladrAddressInput
          key={positionEditFactoryId ?? 'position-edit'}
          value={positionAddressQuery}
          onChange={setPositionAddressQuery}
          onSelect={item => void applyKladrAddressPick(item)}
          disabled={positionSaving}
          requireUserInput
          regionHint={positionPreview?.region || editingFactory?.region}
          panelClassName="map-position-kladr-panel"
          dropdownZIndex={10050}
          dropdownPlacement="above"
          inputClassName="map-position-kladr-input"
        />
      </div>

      {positionLoading ? (
        <div className="flex items-center gap-2 text-slate-300 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>{t('map.positionLoading')}</span>
        </div>
      ) : positionPreview ? (
        <div className="space-y-2">
          {positionPreview.normalized_address ? (
            <div className="map-sheet-info-block rounded-lg p-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{t('map.positionAddress')}</div>
              <div className="text-[11px] text-white leading-snug">{positionPreview.normalized_address}</div>
              {positionPreview.region && (
                <div className="text-[10px] text-slate-400 mt-1">{positionPreview.region}</div>
              )}
              {positionPreview.kladr_id && (
                <div className="text-[10px] font-mono text-indigo-300/80 mt-1">KLADR: {positionPreview.kladr_id}</div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-amber-200/90">{t('map.positionNoAddress')}</div>
          )}
          <div className="text-[10px] font-mono text-slate-500">
            {positionPreview.latitude.toFixed(5)}, {positionPreview.longitude.toFixed(5)}
          </div>
          <div className="map-position-actions flex flex-col sm:flex-row justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelPositionEdit}
              className="map-position-action-btn map-position-action-btn--cancel"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={positionSaving}
              onClick={() => void confirmPositionEdit()}
              className="map-position-action-btn map-position-action-btn--confirm"
              title={t('map.positionConfirm')}
            >
              {positionSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {t('map.positionConfirm')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 py-1">{t('map.positionMoveHint')}</div>
      )}
    </>
  );

  const renderPositionEditCard = () => (
    <div className="map-position-preview map-chrome-panel map-chrome-panel--position">
      <div className="map-chrome-panel-head">
        <div className="min-w-0">
          <div className="map-position-preview-title">
            <Move className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('map.positionEditTitle')}</span>
          </div>
          {editingFactory && (
            <div className="map-position-preview-subtitle mt-0.5 break-words">{editingFactory.name}</div>
          )}
        </div>
        <button
          type="button"
          onClick={cancelPositionEdit}
          className="map-panel-close-btn"
          title={t('map.positionEditCancel')}
          aria-label={t('map.positionEditCancel')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">{renderPositionEditBody()}</div>
    </div>
  );

  return (
    <div
      ref={mapShellRef}
      className={`logistics-map relative w-full h-full min-h-0 overflow-hidden bg-slate-950${
        isPositionEditing ? ' is-position-editing' : ''
      }${isFactorySheetOpen ? ' is-factory-sheet-open' : ''}`}
    >
      <div className={`absolute inset-0 z-0${tileFilterClass}`}>
        <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />
      </div>

      {isPositionEditing && (
        <>
          <div className="map-position-crosshair pointer-events-none absolute inset-0 z-20">
            <div className="map-position-crosshair-ring" aria-hidden="true">
              <span className="map-position-crosshair-line map-position-crosshair-line-h" />
              <span className="map-position-crosshair-line map-position-crosshair-line-v" />
            </div>
          </div>

          {!mobileLayout && (
            <div className="map-ui-layer map-position-preview-wrap absolute left-1/2 bottom-3 sm:bottom-5 -translate-x-1/2 z-40 pointer-events-none w-[min(22rem,calc(100%-2rem))]">
              <div className="pointer-events-auto">{renderPositionEditCard()}</div>
            </div>
          )}

          {mobileLayout && (
            <div className="map-mobile-dock-stack" role="presentation">
              <div
                ref={positionDockRef}
                className="map-mobile-dock map-mobile-dock--position"
                role="dialog"
                aria-label={t('map.positionEditTitle')}
              >
                <div className="map-mobile-dock-handle" aria-hidden="true" />
                <div className="map-mobile-dock-header">
                  <span className="map-mobile-dock-title flex items-center gap-1.5 min-w-0">
                    <Move className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{t('map.positionEditTitle')}</span>
                  </span>
                  <button
                    type="button"
                    className="map-mobile-dock-close"
                    onClick={cancelPositionEdit}
                    aria-label={t('map.positionEditCancel')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="map-mobile-dock-body">
                  {editingFactory && (
                    <div className="text-[11px] text-slate-400 mb-2 break-words">{editingFactory.name}</div>
                  )}
                  <div className="map-sheet-panel text-xs text-slate-200 space-y-2">
                    {renderPositionEditBody()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div
        ref={searchColumnRef}
        className="map-search-column map-ui-layer absolute top-2 sm:top-3 left-2 sm:left-3 map-side-panel-width flex flex-col gap-2 pointer-events-none z-30"
      >
        <MapSearchBox
          viewMode={filters.viewMode}
          query={filters.searchQuery}
          onQueryChange={q => setFilters(prev => ({ ...prev, searchQuery: q }))}
          factories={factories}
          supplyLinks={supplyLinks}
          factoryMap={factoryMap}
          onSelectFactory={handleSearchSelectFactory}
          onSelectShipment={handleSearchSelectShipment}
        />
        {canUseCsvPreview ? (
          <div className="map-imported-hint map-csv-preview-panel map-chrome-panel map-chrome-panel--csv pointer-events-auto">
            {csvPreviewActive && activeCsvFile ? (
              <>
                <p className="map-csv-preview-title">
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {t('map.csvPreviewActive', {
                      name: activeCsvFile.filename,
                      count: activeCsvFile.links.length,
                    })}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => onCsvPreviewRestore?.()}
                  className="map-csv-btn map-csv-btn--secondary w-full"
                >
                  {t('map.csvRestoreView')}
                </button>
              </>
            ) : (
              <>
                <p className="map-csv-preview-hint">{t('map.showImportedHint')}</p>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) void handleCsvFileUpload(f);
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadInternalShipmentsCsvTemplate()}
                    className="map-csv-btn map-csv-btn--ghost flex-1 min-w-[6.5rem]"
                  >
                    <Download className="w-3 h-3 shrink-0" />
                    {t('map.csvDownloadTemplate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => csvFileInputRef.current?.click()}
                    disabled={csvUploading}
                    className="map-csv-btn map-csv-btn--ghost flex-1 min-w-[6.5rem]"
                  >
                    <Upload className="w-3 h-3 shrink-0" />
                    {csvUploading ? t('map.csvUploading') : t('map.csvUpload')}
                  </button>
                </div>

                {csvPreviewFiles.length === 0 ? (
                  <p className="text-slate-500 text-[10px]">{t('map.csvNoFiles')}</p>
                ) : (
                  <div className="space-y-1">
                  <p className="map-csv-files-label">{t('map.csvSelectFile')}</p>
                    <ul className="map-csv-file-list">
                      {csvPreviewFiles.map(file => {
                        const selected = file.id === csvPreviewActiveFileId;
                        return (
                          <li key={file.id} className="map-csv-file-item">
                            <button
                              type="button"
                              onClick={() => onCsvPreviewSelectFile?.(file.id)}
                              className={`map-csv-file-btn${selected ? ' is-active' : ''}`}
                              title={file.filename}
                            >
                              <span className="block truncate font-medium">{file.filename}</span>
                              <span className="map-csv-file-count">{file.links.length}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onCsvPreviewRemoveFile?.(file.id)}
                              className="map-csv-file-remove"
                              aria-label={t('map.csvRemoveFile')}
                              title={t('map.csvRemoveFile')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {csvPanelMsg ? (
                  <p className={csvPanelMsg.tone === 'err' ? 'map-csv-msg map-csv-msg--err' : 'map-csv-msg map-csv-msg--ok'}>
                    {csvPanelMsg.text}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => onCsvPreviewShow?.()}
                  disabled={!activeCsvFile || activeCsvFile.links.length === 0}
                  className="map-csv-btn map-csv-btn--primary w-full"
                >
                  {t('map.showImportedBtn')}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div
        ref={filterPanelRef}
        style={filterPanelWrapperStyle}
        className={`map-ui-layer pointer-events-none map-filter-panel-wrapper ${isFilterPanelDragging ? 'select-none' : ''}`}
      >
        <div className="pointer-events-auto w-full">{filterPanel}</div>
      </div>

      <div className="map-top-controls map-ui-layer absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle compact className="map-desktop-theme-toggle" />

          <button
            onClick={handleResetView}
            className="map-desktop-reset-btn"
            title={t('map.resetTitle')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('map.reset')}</span>
          </button>
        </div>
      </div>

      <div
        ref={bottomStackRef}
        className="map-ui-layer absolute bottom-2 sm:bottom-4 left-2 sm:left-3 pointer-events-auto map-side-panel-width map-bottom-stack"
      >
        {!mobileLayout && renderFactoryHighlightCard()}
        <div className="map-legend map-chrome-panel">
        <button
          type="button"
          onClick={() => setLegendOpen(v => !v)}
          className="map-legend-toggle"
          aria-expanded={legendOpen}
        >
          <span className="map-legend-toggle-label">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('map.legendTitle', { count: filteredData.filteredFactories.length })}</span>
          </span>
          <span className="map-legend-chevron shrink-0">
            {legendOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>
        <div className={`map-legend-body ${legendOpen ? 'is-open' : ''}`}>
          {legendBody}
        </div>
        </div>
      </div>

      <div className={`map-mobile-fab-bar map-ui-layer${hideMobileFabs ? ' is-hidden' : ''}`}>
        <button
          type="button"
          className={`map-mobile-fab ${mobileFilterSheet ? 'is-active' : ''}`}
          onClick={() => {
            setMobileLegendSheet(false);
            setMobileFilterSheet(v => !v);
          }}
          aria-expanded={mobileFilterSheet}
          aria-label={t('map.mobileFilters')}
        >
          <Filter className="w-4 h-4 shrink-0" />
          <span className="map-mobile-fab-label">{t('map.mobileFilters')}</span>
        </button>
        <button
          type="button"
          className={`map-mobile-fab ${mobileLegendSheet ? 'is-active' : ''}`}
          onClick={() => {
            setMobileFilterSheet(false);
            setMobileLegendSheet(v => !v);
          }}
          aria-expanded={mobileLegendSheet}
          aria-label={t('map.mobileLegend')}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="map-mobile-fab-label">{t('map.mobileLegend')}</span>
        </button>
        <button
          type="button"
          className="map-mobile-fab"
          onClick={handleResetView}
          aria-label={t('map.resetTitle')}
          title={t('map.resetTitle')}
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {mobileLayout && mobileSearchOpen && (
        <div className="map-mobile-search-stack" role="presentation">
          <div
            className="map-mobile-sheet-backdrop"
            onClick={closeMobileSearch}
            aria-hidden="true"
          />
          <div
            className="map-mobile-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.search')}
          >
            <div className="map-mobile-search-panel-header">
              <MapSearchBox
                autoFocus
                viewMode={filters.viewMode}
                query={filters.searchQuery}
                onQueryChange={q => setFilters(prev => ({ ...prev, searchQuery: q }))}
                factories={factories}
                supplyLinks={supplyLinks}
                factoryMap={factoryMap}
                onSelectFactory={handleSearchSelectFactory}
                onSelectShipment={handleSearchSelectShipment}
                className="map-mobile-search-box"
              />
              <button
                type="button"
                className="map-mobile-search-close"
                onClick={closeMobileSearch}
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {mobileLayout && mobileFilterSheet && (
        <div className="map-mobile-sheet-stack" role="presentation">
          <div
            className="map-mobile-sheet-backdrop"
            onClick={() => setMobileFilterSheet(false)}
            aria-hidden="true"
          />
          <div
            className="map-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('map.mobileFilters')}
          >
            <div className="map-mobile-sheet-handle" aria-hidden="true" />
            <div className="map-mobile-sheet-header">
              <span className="map-mobile-sheet-title flex items-center gap-1.5 min-w-0">
                <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">{t('map.mobileFilters')}</span>
              </span>
              <button
                type="button"
                className="map-mobile-sheet-close"
                onClick={() => setMobileFilterSheet(false)}
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="map-mobile-sheet-body map-mobile-sheet-body--filters">
              {mobileFilterPanel}
            </div>
          </div>
        </div>
      )}

      {mobileLayout && mobileLegendSheet && (
        <div className="map-mobile-sheet-stack" role="presentation">
          <div
            className="map-mobile-sheet-backdrop"
            onClick={() => setMobileLegendSheet(false)}
            aria-hidden="true"
          />
          <div
            className="map-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('map.mobileLegend')}
          >
            <div className="map-mobile-sheet-handle" aria-hidden="true" />
            <div className="map-mobile-sheet-header">
              <span className="map-mobile-sheet-title flex items-center gap-1.5 min-w-0">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">{t('map.legendTitle', { count: filteredData.filteredFactories.length })}</span>
              </span>
              <button
                type="button"
                className="map-mobile-sheet-close"
                onClick={() => setMobileLegendSheet(false)}
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="map-mobile-sheet-body">
              {legendBody}
            </div>
          </div>
        </div>
      )}

      {mobileLayout && highlightedFactory && !isPositionEditing && (
        <div className="map-mobile-sheet-stack" role="presentation">
          <div
            className="map-mobile-sheet-backdrop"
            onClick={handleClearSelection}
            aria-hidden="true"
          />
          <div
            className="map-mobile-sheet map-mobile-sheet--factory"
            role="dialog"
            aria-modal="true"
            aria-label={highlightedFactory.name}
          >
            <div className="map-mobile-sheet-handle" aria-hidden="true" />
            <div className="map-mobile-sheet-header">
              <span className="map-mobile-sheet-title truncate">{highlightedFactory.name}</span>
              <button
                type="button"
                className="map-mobile-sheet-close"
                onClick={handleClearSelection}
                aria-label={t('map.clearSelectionTitle')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="map-mobile-sheet-body map-mobile-sheet-body--factory">
              {renderFactorySheetBody()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
