import React from 'react';
import { Clock, MessageSquare, AlertTriangle, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import type { Factory, ShipmentEvent } from '../../types';
import { useI18n } from '../../i18n';

interface ShipmentEventTimelineProps {
  events: ShipmentEvent[];
  factories?: Factory[];
  loading?: boolean;
  compact?: boolean;
}

const eventIcons: Record<ShipmentEvent['event_type'], React.ReactNode> = {
  status_change: <RefreshCw aria-hidden />,
  comment: <MessageSquare aria-hidden />,
  delay: <TrendingDown aria-hidden />,
  early: <TrendingUp aria-hidden />,
  eta_update: <Clock aria-hidden />,
};

export const ShipmentEventTimeline: React.FC<ShipmentEventTimelineProps> = ({
  events,
  factories = [],
  loading = false,
  compact = false,
}) => {
  const { t, localeTag } = useI18n();
  const factoryMap = new Map(factories.map(f => [f.id, f]));

  if (loading) {
    return <div className="shipment-event-timeline-empty">{t('siteDirectory.admin.loading')}</div>;
  }

  if (events.length === 0) {
    return <div className="shipment-event-timeline-empty">{t('shipmentEvents.noEvents')}</div>;
  }

  return (
    <div className={`space-y-2 shipment-events-scroll ${compact ? 'max-h-56' : 'max-h-96'}`}>
      {events.map(event => {
        const timingClass =
          event.timing_kind === 'delay'
            ? ' is-delay'
            : event.timing_kind === 'early'
              ? ' is-early'
              : '';

        return (
          <div key={event.id} className={`shipment-event-timeline-item${timingClass}`}>
            <div className="shipment-event-timeline-head">
              <div className="shipment-event-timeline-type">
                <span className="shipment-event-timeline-type-icon">{eventIcons[event.event_type]}</span>
                <span>{t(`shipmentEvents.types.${event.event_type}`)}</span>
                {event.timing_kind ? (
                  <span className="shipment-event-timeline-badge">
                    {t(`shipmentEvents.timingKind.${event.timing_kind}`)}
                  </span>
                ) : null}
              </div>
              <span className="shipment-event-timeline-time">
                {new Date(event.created_at).toLocaleString(localeTag)}
              </span>
            </div>

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

            {(event.origin_id || event.destination_id) && !compact ? (
              <div className="shipment-event-timeline-route">
                {factoryMap.get(event.origin_id || '')?.name || event.origin_id}
                {' → '}
                {factoryMap.get(event.destination_id || '')?.name || event.destination_id}
              </div>
            ) : null}

            {event.delay_reason ? (
              <div className="shipment-event-timeline-delay">
                <AlertTriangle aria-hidden />
                <span>{event.delay_reason}</span>
              </div>
            ) : null}

            {(event.delay_hours != null || event.early_hours != null) ? (
              <div className="shipment-event-timeline-meta">
                {event.delay_hours != null && `${t('shipmentEvents.delayHours')}: ${event.delay_hours}`}
                {event.delay_hours != null && event.early_hours != null && ' · '}
                {event.early_hours != null && `${t('shipmentEvents.earlyHours')}: ${event.early_hours}`}
              </div>
            ) : null}

            {event.eta_after ? (
              <div className="shipment-event-timeline-eta">
                {t('shipmentEvents.etaAfter')}: {event.eta_after}
              </div>
            ) : null}

            {!compact && (event.actual_departure_at || event.actual_arrival_at || event.progress_pct != null) ? (
              <div className="shipment-event-timeline-meta">
                {event.progress_pct != null && (
                  <span>{t('shipmentEvents.progressPct')}: {Math.round(event.progress_pct)}%</span>
                )}
                {event.actual_departure_at && (
                  <span>
                    {event.progress_pct != null ? ' · ' : ''}
                    {t('shipmentEvents.actualDeparture')}: {new Date(event.actual_departure_at).toLocaleString(localeTag)}
                  </span>
                )}
                {event.actual_arrival_at && (
                  <span>
                    {' · '}
                    {t('shipmentEvents.actualArrival')}: {new Date(event.actual_arrival_at).toLocaleString(localeTag)}
                  </span>
                )}
              </div>
            ) : null}

            {!compact && (event.transport_mode || event.vehicle_number || event.waybill_number || event.driver_info) ? (
              <div className="shipment-event-timeline-route">
                {[
                  event.transport_mode ? t(`shipmentEvents.modes.${event.transport_mode}`) : null,
                  event.vehicle_number,
                  event.trailer_number || event.container_number,
                  event.waybill_number,
                  event.driver_info,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            ) : null}

            {event.comment ? (
              <div className="shipment-event-timeline-comment">{event.comment}</div>
            ) : null}

            <div className="shipment-event-timeline-foot">
              <span>{event.username}</span>
              {event.source && event.source !== 'manual' ? (
                <span className="shipment-event-timeline-badge">
                  {t(`shipmentEvents.source.${event.source}`)}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
