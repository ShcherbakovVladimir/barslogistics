import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Factory, ShipmentEvent, ShipmentEventType, SupplyLink } from '../../types';
import { useI18n } from '../../i18n';
import { SHIPMENT_EVENT_TYPES } from '../../constants/shipmentEvents';

interface ShipmentEventsHistoryPanelProps {
  events: ShipmentEvent[];
  factories: Factory[];
  shipments: SupplyLink[];
  loading?: boolean;
  /** When set (wide layout), panel height matches the event form; list scrolls inside. */
  matchHeight?: number | null;
  onRefresh: () => void;
  onOpenShipment: (shipmentId: string) => void;
}

const eventIcons: Record<ShipmentEventType, React.ReactNode> = {
  status_change: <RefreshCw aria-hidden />,
  comment: <MessageSquare aria-hidden />,
  delay: <TrendingDown aria-hidden />,
  early: <TrendingUp aria-hidden />,
  eta_update: <Clock aria-hidden />,
};

export const ShipmentEventsHistoryPanel: React.FC<ShipmentEventsHistoryPanelProps> = ({
  events,
  factories,
  shipments,
  loading = false,
  matchHeight = null,
  onRefresh,
  onOpenShipment,
}) => {
  const { t, localeTag } = useI18n();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ShipmentEventType>('all');
  const [timingFilter, setTimingFilter] = useState<'all' | 'delay' | 'early' | 'on_time'>('all');

  const factoryMap = useMemo(() => new Map(factories.map(f => [f.id, f])), [factories]);
  const shipmentMap = useMemo(() => new Map(shipments.map(s => [s.id, s])), [shipments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (typeFilter !== 'all' && event.event_type !== typeFilter) return false;
      if (timingFilter !== 'all' && (event.timing_kind || 'on_time') !== timingFilter) return false;
      if (!q) return true;
      const shipment = shipmentMap.get(event.shipment_id);
      const origin = factoryMap.get(event.origin_id || shipment?.origin_id || '')?.name || '';
      const dest = factoryMap.get(event.destination_id || shipment?.destination_id || '')?.name || '';
      const haystack = [
        event.comment,
        event.delay_reason,
        event.username,
        event.vehicle_number,
        event.waybill_number,
        event.driver_info,
        event.new_status,
        event.old_status,
        shipment?.cargo_type,
        origin,
        dest,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, typeFilter, timingFilter, query, factoryMap, shipmentMap]);

  const counts = useMemo(() => {
    const byType: Record<string, number> = { all: events.length };
    for (const type of SHIPMENT_EVENT_TYPES) byType[type] = 0;
    for (const event of events) byType[event.event_type] = (byType[event.event_type] || 0) + 1;
    return byType;
  }, [events]);

  return (
    <aside
      className={`shipment-events-recent shipment-events-history-panel${
        matchHeight != null ? ' is-height-matched' : ''
      }`}
      style={matchHeight != null ? { height: matchHeight } : undefined}
    >
      <div className="shipment-events-history-head">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="shipment-events-history-title">{t('shipmentEvents.tabHistoryFull')}</h3>
            <span className="shipment-events-history-count">
              {filtered.length === events.length
                ? t('shipmentEvents.historyCount', { count: events.length })
                : t('shipmentEvents.historyCountFiltered', { shown: filtered.length, total: events.length })}
            </span>
          </div>
          <p className="shipment-events-history-subtitle">{t('shipmentEvents.historySubtitle')}</p>
        </div>
        <button
          type="button"
          className="shipment-events-history-refresh"
          onClick={onRefresh}
          disabled={loading}
          title={t('shipmentEvents.historyRefresh')}
          aria-label={t('shipmentEvents.historyRefresh')}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} aria-hidden />
        </button>
      </div>

      <div className="shipment-events-history-toolbar">
        <div className="shipment-events-history-search">
          <Search aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('shipmentEvents.historySearch')}
            aria-label={t('shipmentEvents.historySearch')}
          />
        </div>
        <div className="shipment-events-history-chips" role="group" aria-label={t('shipmentEvents.eventType')}>
          <button
            type="button"
            className={`shipment-events-history-chip${typeFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            {t('shipmentEvents.historyAllTypes')}
            <span>{counts.all}</span>
          </button>
          {SHIPMENT_EVENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`shipment-events-history-chip${typeFilter === type ? ' is-active' : ''}`}
              onClick={() => setTypeFilter(type)}
            >
              {t(`shipmentEvents.types.${type}`)}
              <span>{counts[type] || 0}</span>
            </button>
          ))}
        </div>
        <div className="shipment-events-history-chips" role="group" aria-label={t('shipmentEvents.timing')}>
          {([
            ['all', t('shipmentEvents.historyAllTiming')],
            ['delay', t('shipmentEvents.timingKind.delay')],
            ['early', t('shipmentEvents.timingKind.early')],
            ['on_time', t('shipmentEvents.timingKind.on_time')],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`shipment-events-history-chip is-timing${timingFilter === value ? ' is-active' : ''}`}
              onClick={() => setTimingFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="shipment-events-history-list shipment-events-scroll">
        {loading && events.length === 0 ? (
          <div className="shipment-event-timeline-empty">{t('siteDirectory.admin.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="shipment-event-timeline-empty">{t('shipmentEvents.historyEmptyFiltered')}</div>
        ) : (
          filtered.map((event) => {
            const shipment = shipmentMap.get(event.shipment_id);
            const originName = factoryMap.get(event.origin_id || shipment?.origin_id || '')?.name;
            const destName = factoryMap.get(event.destination_id || shipment?.destination_id || '')?.name;
            const timingClass =
              event.timing_kind === 'delay'
                ? ' is-delay'
                : event.timing_kind === 'early'
                  ? ' is-early'
                  : '';

            return (
              <article key={event.id} className={`shipment-events-history-card${timingClass}`}>
                <div className="shipment-events-history-card-top shipment-event-timeline-head">
                  <div className="shipment-events-history-type-row">
                    <span className="shipment-event-timeline-type-icon">{eventIcons[event.event_type]}</span>
                    <span className="truncate">{t(`shipmentEvents.types.${event.event_type}`)}</span>
                    {event.timing_kind ? (
                      <span className="shipment-events-history-badge">
                        {t(`shipmentEvents.timingKind.${event.timing_kind}`)}
                      </span>
                    ) : null}
                  </div>
                  <time className="shipment-event-timeline-time">
                    {new Date(event.created_at).toLocaleString(localeTag)}
                  </time>
                </div>

                {(shipment?.cargo_type || originName || destName) ? (
                  <div className="shipment-events-history-cargo">
                    {shipment?.cargo_type ? (
                      <span className="shipment-events-history-cargo-name">{shipment.cargo_type}</span>
                    ) : null}
                    {(originName || destName) ? (
                      <span className="shipment-events-history-cargo-route">
                        {shipment?.cargo_type ? ' · ' : ''}
                        {originName || '—'} → {destName || '—'}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {(event.old_status || event.new_status) ? (
                  <div className="shipment-event-timeline-status">
                    {event.old_status ? <span>{t(`status.${event.old_status}`)}</span> : null}
                    {event.old_status && event.new_status ? (
                      <span className="shipment-event-timeline-arrow">→</span>
                    ) : null}
                    {event.new_status ? (
                      <span className="shipment-event-timeline-status-new">{t(`status.${event.new_status}`)}</span>
                    ) : null}
                  </div>
                ) : null}

                {event.delay_reason ? (
                  <div className="shipment-event-timeline-delay">
                    <AlertTriangle aria-hidden />
                    <span>{event.delay_reason}</span>
                  </div>
                ) : null}

                {(event.delay_hours != null || event.early_hours != null || event.eta_after || event.progress_pct != null) ? (
                  <div className="shipment-event-timeline-meta flex flex-wrap gap-x-2 gap-y-0.5">
                    {event.delay_hours != null && (
                      <span>{t('shipmentEvents.delayHours')}: {event.delay_hours}</span>
                    )}
                    {event.early_hours != null && (
                      <span>{t('shipmentEvents.earlyHours')}: {event.early_hours}</span>
                    )}
                    {event.progress_pct != null && (
                      <span>{t('shipmentEvents.progressPct')}: {Math.round(event.progress_pct)}%</span>
                    )}
                    {event.eta_after ? (
                      <span className="shipment-event-timeline-eta">
                        {t('shipmentEvents.etaAfter')}:{' '}
                        {(() => {
                          const d = new Date(event.eta_after!);
                          return Number.isNaN(d.getTime())
                            ? event.eta_after
                            : d.toLocaleString(localeTag);
                        })()}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {(event.transport_mode || event.vehicle_number || event.waybill_number) ? (
                  <div className="shipment-event-timeline-route truncate">
                    {[
                      event.transport_mode ? t(`shipmentEvents.modes.${event.transport_mode}`) : null,
                      event.vehicle_number,
                      event.trailer_number || event.container_number,
                      event.waybill_number,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                ) : null}

                {event.comment ? (
                  <div className="shipment-event-timeline-comment line-clamp-3">{event.comment}</div>
                ) : null}

                <div className="shipment-events-history-card-foot">
                  <span className="truncate">{event.username}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {event.source && event.source !== 'manual' ? (
                      <span className="shipment-events-history-badge">
                        {t(`shipmentEvents.source.${event.source}`)}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="shipment-events-history-open"
                      onClick={() => onOpenShipment(event.shipment_id)}
                    >
                      <ExternalLink aria-hidden />
                      {t('shipmentEvents.openShipment')}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
};
