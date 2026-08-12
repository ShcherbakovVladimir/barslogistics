import React, { useState, useMemo, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { SupplyLink, Factory, User, ShipmentEvent, ShipmentEventInput, Product, TransportAsset } from '../../types';
import { CARGO_STATUSES } from '../../types';
import { useI18n } from '../../i18n';
import { Truck, Search, AlertTriangle, Clock, Edit3, ArrowRight, MapPin, PlusCircle } from 'lucide-react';
import { canCreateAnyShipmentEvent, canCreateShipmentEvent, canEditShipmentStatus, isShipmentInUserScope } from '../../utils/permissions';
import { ApiService } from '../../services/api';
import { ShipmentEventForm } from './ShipmentEventForm';
import { ShipmentEventsHistoryPanel } from './ShipmentEventsHistoryPanel';
import { SearchableSelect } from '../UI/SearchableSelect';
import { VirtualList } from '../UI/VirtualList';
import { sortShipments, type ShipmentSortKey } from '../../utils/shipmentSort';

interface ShipmentsListProps {
  supplyLinks: SupplyLink[];
  factories: Factory[];
  products: Product[];
  transportAssets?: TransportAsset[];
  onSelectShipment: (shipment: SupplyLink) => void;
  onEditShipment: (shipment: SupplyLink) => void;
  onShowOnMap: (shipment: SupplyLink) => void;
  onShipmentUpdated: (shipment: SupplyLink) => void;
  currentUser: User;
}

type StatusBadge = {
  text: string;
  bg: string;
  textCol: string;
  border: string;
};

interface ShipmentCardProps {
  link: SupplyLink;
  orig?: Factory;
  dest?: Factory;
  badge: StatusBadge;
  canEdit: boolean;
  localeTag: string;
  formatShipmentDate: (link: SupplyLink) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSelectShipment: (shipment: SupplyLink) => void;
  onEditShipment: (shipment: SupplyLink) => void;
  onShowOnMap: (shipment: SupplyLink) => void;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({
  link,
  orig,
  dest,
  badge,
  canEdit,
  localeTag,
  formatShipmentDate,
  t,
  onSelectShipment,
  onEditShipment,
  onShowOnMap,
}) => (
  <article
    className="shipment-card"
    onClick={() => onSelectShipment(link)}
    role="button"
    tabIndex={0}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectShipment(link);
      }
    }}
  >
    <div className="shipment-card-header">
      <div className="min-w-0 flex-1">
        <div className="shipment-card-cargo">{link.cargo_type}</div>
        <div className="shipment-card-volume">
          {link.volume.toLocaleString(localeTag)} {link.unit}
          <span className="shipment-card-channel">
            ({link.source === 'own' ? t('shipments.ownShort') : t('export.channelRzd')})
          </span>
        </div>
      </div>
      <span className="shipment-card-date">{formatShipmentDate(link)}</span>
    </div>

    <div className="shipment-card-route">
      <span className="truncate">{orig?.name || t('common.sender')}</span>
      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      <span className="truncate">{dest?.name || t('common.receiver')}</span>
    </div>
    {(orig?.region || dest?.region) && (
      <div className="shipment-card-regions">
        {orig?.region} → {dest?.region}
      </div>
    )}

    <div className="shipment-card-status">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`shipment-card-badge ${badge.bg} ${badge.textCol} ${badge.border}`}>
          {badge.text}
        </span>
        {link.eta && (
          <span className="shipment-card-eta">
            <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
            {t('shipments.eta', { eta: link.eta })}
          </span>
        )}
      </div>
      <div className="shipment-card-progress" aria-hidden="true">
        <div className="shipment-card-progress-fill" style={{ width: `${link.progress_pct || 0}%` }} />
      </div>
    </div>

    <div className="shipment-card-meta">
      <div>
        <div className="shipment-card-meta-label">{t('shipments.colCarrier')}</div>
        <div className="shipment-card-meta-value">{link.carrier_name || t('shipments.carrierDefault')}</div>
        <div className="shipment-card-meta-sub">{link.driver_info || t('shipments.driverDefault')}</div>
      </div>
      {link.delay_reason && (
        <div className="shipment-card-delay">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{link.delay_reason}</span>
        </div>
      )}
    </div>

    <div className="shipment-card-actions" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onShowOnMap(link)}
        className="shipment-card-action shipment-card-action--map"
      >
        <MapPin aria-hidden />
        {t('shipments.showOnMap')}
      </button>
      {canEdit ? (
        <button
          type="button"
          onClick={() => onEditShipment(link)}
          className="shipment-card-action shipment-card-action--edit"
        >
          <Edit3 aria-hidden />
          {t('shipments.editButton')}
        </button>
      ) : (
        <span className="shipment-card-readonly">{t('common.readOnly')}</span>
      )}
    </div>
  </article>
);

export const ShipmentsList: React.FC<ShipmentsListProps> = ({
  supplyLinks,
  factories,
  products,
  transportAssets = [],
  onSelectShipment,
  onEditShipment,
  onShowOnMap,
  onShipmentUpdated,
  currentUser,
}) => {
  const { t, localeTag } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ShipmentSortKey>('date_desc');
  const [recentEvents, setRecentEvents] = useState<ShipmentEvent[]>([]);
  const [recentEventsLoading, setRecentEventsLoading] = useState(false);
  const [pageMode, setPageMode] = useState<'manage' | 'add'>('manage');
  const [historyMatchHeight, setHistoryMatchHeight] = useState<number | null>(null);
  const eventFormColumnRef = useRef<HTMLDivElement>(null);

  const canEdit = canEditShipmentStatus(currentUser.role);
  const canManageEvents = canCreateAnyShipmentEvent(currentUser);

  const eventFormShipments = useMemo(
    () => supplyLinks.filter(l => canCreateShipmentEvent(currentUser, l)),
    [supplyLinks, currentUser],
  );

  const loadRecentEvents = useCallback(async () => {
    if (!canManageEvents) return;
    setRecentEventsLoading(true);
    try {
      const data = await ApiService.getRecentShipmentEvents(50);
      setRecentEvents(data);
    } catch {
      setRecentEvents([]);
    } finally {
      setRecentEventsLoading(false);
    }
  }, [canManageEvents]);

  useEffect(() => {
    void loadRecentEvents();
  }, [loadRecentEvents, supplyLinks.length]);

  useLayoutEffect(() => {
    if (pageMode !== 'add') {
      setHistoryMatchHeight(null);
      return;
    }

    const formCol = eventFormColumnRef.current;
    if (!formCol || typeof ResizeObserver === 'undefined') return;

    const mq = window.matchMedia('(min-width: 1500px)');
    const sync = () => {
      if (!mq.matches) {
        setHistoryMatchHeight(null);
        return;
      }
      const h = Math.round(formCol.getBoundingClientRect().height);
      setHistoryMatchHeight(h > 0 ? h : null);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(formCol);
    mq.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, [pageMode, recentEvents.length, eventFormShipments.length]);

  const statusLabels = useMemo(() => ({
    en_route: { text: t('status.en_route'), bg: 'bg-emerald-500/10', textCol: 'text-emerald-400', border: 'border-emerald-500/30' },
    delayed: { text: t('status.delayed'), bg: 'bg-amber-500/10', textCol: 'text-amber-400', border: 'border-amber-500/30' },
    arrived: { text: t('status.arrived'), bg: 'bg-slate-500/10', textCol: 'text-slate-400', border: 'border-slate-500/30' },
    loading: { text: t('status.loading'), bg: 'bg-purple-500/10', textCol: 'text-purple-400', border: 'border-purple-500/30' },
    alert: { text: t('status.alert'), bg: 'bg-red-500/10', textCol: 'text-red-400', border: 'border-red-500/30' },
  }), [t]);

  const factoryMap = useMemo(() => new Map(factories.map(f => [f.id, f])), [factories]);

  const filteredLinks = useMemo(() => {
    return supplyLinks.filter(l => {
      if (!isShipmentInUserScope(l, currentUser)) return false;
      if (selectedStatusFilter !== 'all' && l.status !== selectedStatusFilter) return false;
      if (selectedSourceFilter !== 'all' && l.source !== selectedSourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const orig = factoryMap.get(l.origin_id);
        const dest = factoryMap.get(l.destination_id);
        const matchCargo = l.cargo_type.toLowerCase().includes(q);
        const matchOrig = orig?.name.toLowerCase().includes(q);
        const matchDest = dest?.name.toLowerCase().includes(q);
        const matchCarrier = (l.carrier_name || '').toLowerCase().includes(q);
        if (!matchCargo && !matchOrig && !matchDest && !matchCarrier) return false;
      }
      return true;
    });
  }, [supplyLinks, currentUser, selectedStatusFilter, selectedSourceFilter, search, factoryMap]);

  const sortedLinks = useMemo(
    () => sortShipments(filteredLinks, sortBy),
    [filteredLinks, sortBy],
  );

  const statusFilterOptions = useMemo(() => ([
    { value: 'all', label: t('shipments.allStatuses') },
    ...CARGO_STATUSES.map(status => ({
      value: status,
      label: t(`status.${status}`),
    })),
  ]), [t]);

  const sourceFilterOptions = useMemo(() => ([
    { value: 'all', label: t('shipments.allChannels') },
    { value: 'own', label: t('shipments.ownChannel') },
    { value: 'rzd', label: t('shipments.rzdChannel') },
  ]), [t]);

  const sortOptions = useMemo(() => ([
    { value: 'date_desc', label: t('shipments.sortDateDesc') },
    { value: 'date_asc', label: t('shipments.sortDateAsc') },
    { value: 'eta_asc', label: t('shipments.sortEtaAsc') },
    { value: 'eta_desc', label: t('shipments.sortEtaDesc') },
    { value: 'updated_desc', label: t('shipments.sortUpdatedDesc') },
  ]), [t]);

  const handleCreateEvent = async (shipmentId: string, input: ShipmentEventInput) => {
    const { shipment, event } = await ApiService.createShipmentEvent(shipmentId, input);
    onShipmentUpdated(shipment);
    setRecentEvents(prev => [event, ...prev.filter(e => e.id !== event.id)].slice(0, 50));
  };

  const formatShipmentDate = (link: SupplyLink) => {
    const raw = link.shipment_date || link.period;
    if (!raw) return '—';
    if (raw.length === 4) return raw;
    const ts = Date.parse(raw);
    if (Number.isNaN(ts)) return raw;
    return new Date(ts).toLocaleDateString(localeTag);
  };

  const showEventsMode = canManageEvents && eventFormShipments.length > 0;
  const activeMode = showEventsMode ? pageMode : 'manage';

  return (
    <div className="shipments-page">

      {showEventsMode && (
        <div
          className="shipment-page-modes"
          role="tablist"
          aria-label={t('shipmentEvents.pageModesLabel')}
        >
          <button
            type="button"
            role="tab"
            id="shipment-page-tab-manage"
            aria-selected={activeMode === 'manage'}
            aria-controls="shipment-page-panel-manage"
            className={`shipment-page-mode-tab${activeMode === 'manage' ? ' is-active' : ''}`}
            onClick={() => setPageMode('manage')}
          >
            <Truck aria-hidden />
            <span className="shipment-page-mode-label-short">{t('shipmentEvents.tabManage')}</span>
            <span className="shipment-page-mode-label-full">{t('shipmentEvents.tabManageFull')}</span>
          </button>
          <button
            type="button"
            role="tab"
            id="shipment-page-tab-add"
            aria-selected={activeMode === 'add'}
            aria-controls="shipment-page-panel-add"
            className={`shipment-page-mode-tab${activeMode === 'add' ? ' is-active' : ''}`}
            onClick={() => setPageMode('add')}
          >
            <PlusCircle aria-hidden />
            <span className="shipment-page-mode-label-short">{t('shipmentEvents.tabAdd')}</span>
            <span className="shipment-page-mode-label-full">{t('shipmentEvents.tabAddFull')}</span>
          </button>
        </div>
      )}

      {activeMode === 'add' && showEventsMode && (
        <section
          id="shipment-page-panel-add"
          role="tabpanel"
          aria-labelledby="shipment-page-tab-add"
          className="shipment-page-panel-add"
        >
          <div className="shipment-page-panel-head">
            <h2 className="shipment-page-panel-title">{t('shipmentEvents.tabAddFull')}</h2>
            <p className="shipment-page-panel-subtitle">{t('shipmentEvents.addSubtitle')}</p>
          </div>
          <div className="shipment-page-panel-add-layout">
            <div className="shipment-page-panel-add-form" ref={eventFormColumnRef}>
              <ShipmentEventForm
                shipments={eventFormShipments}
                factories={factories}
                products={products}
                transportAssets={transportAssets}
                hideTitle
                onSubmit={handleCreateEvent}
                onOpenShipment={(id) => {
                  const link = supplyLinks.find(s => s.id === id);
                  if (link) onSelectShipment(link);
                }}
              />
            </div>
            <ShipmentEventsHistoryPanel
              events={recentEvents}
              factories={factories}
              shipments={supplyLinks}
              loading={recentEventsLoading}
              matchHeight={historyMatchHeight}
              onRefresh={() => { void loadRecentEvents(); }}
              onOpenShipment={(id) => {
                const link = supplyLinks.find(s => s.id === id);
                if (link) onSelectShipment(link);
              }}
            />
          </div>
        </section>
      )}

      {activeMode === 'manage' && (
        <section
          id="shipment-page-panel-manage"
          role="tabpanel"
          aria-labelledby={showEventsMode ? 'shipment-page-tab-manage' : undefined}
          className="shipment-page-panel-manage"
        >
      <div className="shipments-list-toolbar">
        <div className="shipments-list-toolbar-head">
          <span className="shipments-list-toolbar-icon" aria-hidden>
            <Truck />
          </span>
          <div className="shipments-list-toolbar-text">
            <h2 className="shipments-list-title">
              <span className="truncate">{t('shipments.title', { count: sortedLinks.length })}</span>
            </h2>
            <p className="shipments-list-subtitle">{t('shipments.subtitle')}</p>
          </div>
        </div>

        <div className="shipments-list-filters shipments-list-filters-grid">
          <div className="shipments-list-search">
            <Search aria-hidden />
            <input
              type="text"
              placeholder={t('shipments.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="shipments-list-filter">
            <SearchableSelect
              value={selectedStatusFilter}
              onChange={setSelectedStatusFilter}
              options={statusFilterOptions}
              searchable={false}
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>

          <div className="shipments-list-filter">
            <SearchableSelect
              value={selectedSourceFilter}
              onChange={setSelectedSourceFilter}
              options={sourceFilterOptions}
              searchable={false}
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>

          <div className="shipments-list-filter">
            <SearchableSelect
              value={sortBy}
              onChange={v => setSortBy(v as ShipmentSortKey)}
              options={sortOptions}
              searchable={false}
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>
        </div>
      </div>

      <div className="shipments-cards-mobile">
        {sortedLinks.length === 0 ? (
          <div className="shipments-empty">{t('searchableSelect.noResults')}</div>
        ) : (
          <VirtualList
            items={sortedLinks}
            estimateSize={168}
            className="shipments-virtual-list-mobile"
            aria-label={t('shipments.title', { count: sortedLinks.length })}
            getKey={(link) => link.id}
            renderItem={(link) => {
              const orig = factoryMap.get(link.origin_id);
              const dest = factoryMap.get(link.destination_id);
              const badge = statusLabels[link.status || 'en_route'];
              return (
                <ShipmentCard
                  link={link}
                  orig={orig}
                  dest={dest}
                  badge={badge}
                  canEdit={canEdit}
                  localeTag={localeTag}
                  formatShipmentDate={formatShipmentDate}
                  t={t}
                  onSelectShipment={onSelectShipment}
                  onEditShipment={onEditShipment}
                  onShowOnMap={onShowOnMap}
                />
              );
            }}
          />
        )}
      </div>

      <div className="shipments-table-desktop">
        <div className="overflow-x-auto responsive-table-wrap">
          <table className="shipments-table">
            <thead>
              <tr>
                <th>{t('shipments.colCargo')}</th>
                <th className="hidden lg:table-cell">{t('myData.colDate')}</th>
                <th className="hidden sm:table-cell">{t('shipments.colRoute')}</th>
                <th>{t('shipments.colStatus')}</th>
                <th className="hidden md:table-cell">{t('shipments.colCarrier')}</th>
                <th className="shipments-table-col-action">{t('shipments.colAction')}</th>
              </tr>
            </thead>
          </table>
          {sortedLinks.length === 0 ? (
            <div className="shipments-empty">{t('searchableSelect.noResults')}</div>
          ) : (
            <VirtualList
              items={sortedLinks}
              estimateSize={68}
              className="shipments-virtual-list-desktop"
              aria-label={t('shipments.title', { count: sortedLinks.length })}
              getKey={(link) => link.id}
              renderItem={(link) => {
                const orig = factoryMap.get(link.origin_id);
                const dest = factoryMap.get(link.destination_id);
                const badge = statusLabels[link.status || 'en_route'];
                return (
                  <div
                    className="shipments-table-virtual-row"
                    onClick={() => onSelectShipment(link)}
                    role="row"
                  >
                    <div className="shipments-table-virtual-cell" role="cell">
                      <div className="shipments-cell-cargo">{link.cargo_type}</div>
                      <div className="shipments-cell-volume">
                        {link.volume.toLocaleString(localeTag)} {link.unit}
                        <span className="shipments-cell-channel">
                          ({link.source === 'own' ? t('shipments.ownShort') : t('export.channelRzd')})
                        </span>
                      </div>
                    </div>
                    <div className="shipments-table-virtual-cell hidden lg:block shipments-cell-date" role="cell">
                      {formatShipmentDate(link)}
                    </div>
                    <div className="shipments-table-virtual-cell hidden sm:block" role="cell">
                      <div className="shipments-cell-route">
                        <span className="truncate">{orig?.name || t('common.sender')}</span>
                        <ArrowRight className="shipments-cell-route-arrow" aria-hidden />
                        <span className="truncate">{dest?.name || t('common.receiver')}</span>
                      </div>
                    </div>
                    <div className="shipments-table-virtual-cell" role="cell">
                      <span className={`shipments-status-badge ${badge.bg} ${badge.textCol} ${badge.border}`}>
                        {badge.text}
                      </span>
                    </div>
                    <div className="shipments-table-virtual-cell hidden md:block" role="cell">
                      <div className="shipments-cell-carrier">{link.carrier_name || t('shipments.carrierDefault')}</div>
                    </div>
                    <div className="shipments-table-virtual-cell shipments-table-col-action" role="cell" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onShowOnMap(link)}
                        className="shipments-map-btn"
                        title={t('shipments.showOnMap')}
                        aria-label={t('shipments.showOnMap')}
                      >
                        <MapPin aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>
        </section>
      )}

    </div>
  );

};
