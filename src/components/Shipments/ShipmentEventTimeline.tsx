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
  status_change: <RefreshCw className="w-3.5 h-3.5" />,
  comment: <MessageSquare className="w-3.5 h-3.5" />,
  delay: <TrendingDown className="w-3.5 h-3.5" />,
  early: <TrendingUp className="w-3.5 h-3.5" />,
  eta_update: <Clock className="w-3.5 h-3.5" />,
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
    return <div className="text-slate-500 text-xs py-4 text-center">{t('siteDirectory.admin.loading')}</div>;
  }

  if (events.length === 0) {
    return <div className="text-slate-500 text-xs py-4 text-center">{t('shipmentEvents.noEvents')}</div>;
  }

  return (
    <div className={`space-y-2 shipment-events-scroll ${compact ? 'max-h-56' : 'max-h-96'}`}>
      {events.map(event => {
        const timingClass =
          event.timing_kind === 'delay'
            ? 'border-amber-500/30 bg-amber-500/5'
            : event.timing_kind === 'early'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-slate-700 bg-slate-950/60';

        return (
          <div key={event.id} className={`rounded-xl border p-3 ${timingClass}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <span className="text-indigo-300">{eventIcons[event.event_type]}</span>
                <span>{t(`shipmentEvents.types.${event.event_type}`)}</span>
                {event.timing_kind && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {t(`shipmentEvents.timingKind.${event.timing_kind}`)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(event.created_at).toLocaleString(localeTag)}
              </span>
            </div>

            {(event.old_status || event.new_status) && (
              <div className="mt-1.5 text-[11px] text-slate-300">
                {event.old_status && <span>{t(`status.${event.old_status}`)}</span>}
                {event.old_status && event.new_status && <span className="mx-1 text-slate-500">→</span>}
                {event.new_status && <span className="font-semibold text-emerald-300">{t(`status.${event.new_status}`)}</span>}
              </div>
            )}

            {(event.origin_id || event.destination_id) && !compact && (
              <div className="mt-1 text-[10px] text-slate-500">
                {factoryMap.get(event.origin_id || '')?.name || event.origin_id}
                {' → '}
                {factoryMap.get(event.destination_id || '')?.name || event.destination_id}
              </div>
            )}

            {event.delay_reason && (
              <div className="mt-1.5 text-[11px] text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{event.delay_reason}</span>
              </div>
            )}

            {(event.delay_hours != null || event.early_hours != null) && (
              <div className="mt-1 text-[10px] text-slate-400">
                {event.delay_hours != null && `${t('shipmentEvents.delayHours')}: ${event.delay_hours}`}
                {event.delay_hours != null && event.early_hours != null && ' · '}
                {event.early_hours != null && `${t('shipmentEvents.earlyHours')}: ${event.early_hours}`}
              </div>
            )}

            {event.eta_after && (
              <div className="mt-1 text-[10px] text-blue-300">
                {t('shipmentEvents.etaAfter')}: {event.eta_after}
              </div>
            )}

            {!compact && (event.actual_departure_at || event.actual_arrival_at || event.progress_pct != null) && (
              <div className="mt-1 text-[10px] text-slate-400 space-x-2">
                {event.progress_pct != null && (
                  <span>{t('shipmentEvents.progressPct')}: {Math.round(event.progress_pct)}%</span>
                )}
                {event.actual_departure_at && (
                  <span>
                    {t('shipmentEvents.actualDeparture')}: {new Date(event.actual_departure_at).toLocaleString(localeTag)}
                  </span>
                )}
                {event.actual_arrival_at && (
                  <span>
                    {t('shipmentEvents.actualArrival')}: {new Date(event.actual_arrival_at).toLocaleString(localeTag)}
                  </span>
                )}
              </div>
            )}

            {!compact && (event.transport_mode || event.vehicle_number || event.waybill_number || event.driver_info) && (
              <div className="mt-1 text-[10px] text-slate-500">
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
            )}

            {event.comment && (
              <div className="mt-1.5 text-[11px] text-slate-300 whitespace-pre-wrap">{event.comment}</div>
            )}

            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between gap-2">
              <span>{event.username}</span>
              {event.source && event.source !== 'manual' && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {t(`shipmentEvents.source.${event.source}`)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
