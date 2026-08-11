import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Save } from 'lucide-react';
import type {
  CargoStatus,
  Factory,
  Product,
  ShipmentEventInput,
  ShipmentEventType,
  ShipmentTimingKind,
  SupplyLink,
} from '../../types';
import { CARGO_STATUSES } from '../../types';
import { useI18n } from '../../i18n';
import { getProductName } from '../../constants/products';
import {
  DELAY_REASON_KEYS,
  SHIPMENT_EVENT_TYPES,
  SHIPMENT_TIMING_KINDS,
  STATUS_REQUIRES_REASON,
  type DelayReasonKey,
} from '../../constants/shipmentEvents';
import { SearchableSelect } from '../UI/SearchableSelect';

interface ShipmentEventFormProps {
  shipments: SupplyLink[];
  factories: Factory[];
  products: Product[];
  selectedShipmentId?: string;
  lockShipment?: boolean;
  /** Hide the form heading when the parent already shows the section title. */
  hideTitle?: boolean;
  onSubmit: (shipmentId: string, input: ShipmentEventInput) => Promise<void>;
  onOpenShipment?: (shipmentId: string) => void;
}

function toDatetimeLocalValue(isoOrLocal?: string | null): string {
  if (!isoOrLocal) return '';
  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowDatetimeLocal(): string {
  return toDatetimeLocalValue(new Date().toISOString());
}

function shiftEtaHours(baseIso: string | undefined, hours: number, sign: 1 | -1): string {
  const base = baseIso ? new Date(baseIso) : new Date();
  if (Number.isNaN(base.getTime())) return nowDatetimeLocal();
  base.setMinutes(base.getMinutes() + sign * Math.round(hours * 60));
  return toDatetimeLocalValue(base.toISOString());
}

export const ShipmentEventForm: React.FC<ShipmentEventFormProps> = ({
  shipments,
  factories,
  products,
  selectedShipmentId,
  lockShipment = false,
  hideTitle = false,
  onSubmit,
  onOpenShipment,
}) => {
  const { t, locale } = useI18n();
  const factoryMap = useMemo(() => new Map(factories.map(f => [f.id, f])), [factories]);

  const [shipmentId, setShipmentId] = useState(selectedShipmentId || shipments[0]?.id || '');
  const [eventType, setEventType] = useState<ShipmentEventType>('status_change');
  const [newStatus, setNewStatus] = useState<CargoStatus>('en_route');
  const [timingKind, setTimingKind] = useState<ShipmentTimingKind>('on_time');
  const [delayReasonKey, setDelayReasonKey] = useState<DelayReasonKey>('maneuvering');
  const [customDelayReason, setCustomDelayReason] = useState('');
  const [delayHours, setDelayHours] = useState('');
  const [earlyHours, setEarlyHours] = useState('');
  const [comment, setComment] = useState('');
  const [etaAfter, setEtaAfter] = useState('');
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [productId, setProductId] = useState('');
  const [actualDepartureAt, setActualDepartureAt] = useState('');
  const [actualArrivalAt, setActualArrivalAt] = useState('');
  const [progressPct, setProgressPct] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [waybillNumber, setWaybillNumber] = useState('');
  const [driverInfo, setDriverInfo] = useState('');
  const [applyTransport, setApplyTransport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSavedShipmentId, setLastSavedShipmentId] = useState<string | null>(null);

  const selectedShipment = shipments.find(s => s.id === shipmentId);
  const showReason =
    eventType === 'delay'
    || newStatus === 'delayed'
    || newStatus === 'alert'
    || (eventType === 'status_change' && STATUS_REQUIRES_REASON.includes(newStatus));

  useEffect(() => {
    if (selectedShipmentId) setShipmentId(selectedShipmentId);
  }, [selectedShipmentId]);

  useEffect(() => {
    if (!selectedShipment) return;
    setOriginId(selectedShipment.origin_id);
    setDestinationId(selectedShipment.destination_id);
    setProductId(selectedShipment.product_id || '');
    setNewStatus(selectedShipment.status || 'en_route');
    setActualDepartureAt(toDatetimeLocalValue(selectedShipment.actual_departure_at));
    setActualArrivalAt(toDatetimeLocalValue(selectedShipment.actual_arrival_at));
    setProgressPct(
      selectedShipment.progress_pct != null ? String(Math.round(selectedShipment.progress_pct)) : '',
    );
    setVehicleNumber(selectedShipment.vehicle_number || '');
    setTrailerNumber(selectedShipment.trailer_number || '');
    setContainerNumber(selectedShipment.container_number || '');
    setWaybillNumber(selectedShipment.waybill_number || '');
    setDriverInfo(selectedShipment.driver_info || '');
  }, [selectedShipment]);

  useEffect(() => {
    if (eventType === 'delay') {
      setTimingKind('delay');
      setNewStatus('delayed');
    } else if (eventType === 'early') {
      setTimingKind('early');
    } else if (eventType === 'comment') {
      setTimingKind('on_time');
    }
  }, [eventType]);

  const prevStatusRef = React.useRef<CargoStatus | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = newStatus;
    if (prev === newStatus) return;
    if (newStatus === 'en_route') {
      setActualDepartureAt((v) => v || nowDatetimeLocal());
    }
    if (newStatus === 'arrived') {
      setActualArrivalAt((v) => v || nowDatetimeLocal());
      setProgressPct('100');
    }
  }, [newStatus]);

  useEffect(() => {
    const hours = Number(delayHours);
    if (eventType === 'delay' && Number.isFinite(hours) && hours > 0) {
      const base = selectedShipment?.eta_at || selectedShipment?.eta;
      setEtaAfter(shiftEtaHours(base, hours, 1));
    }
  }, [delayHours, eventType, selectedShipment?.eta, selectedShipment?.eta_at]);

  useEffect(() => {
    const hours = Number(earlyHours);
    if (eventType === 'early' && Number.isFinite(hours) && hours > 0) {
      const base = selectedShipment?.eta_at || selectedShipment?.eta;
      setEtaAfter(shiftEtaHours(base, hours, -1));
    }
  }, [earlyHours, eventType, selectedShipment?.eta, selectedShipment?.eta_at]);

  const shipmentOptions = useMemo(
    () => shipments.map(s => {
      const orig = factoryMap.get(s.origin_id)?.name || s.origin_id;
      const dest = factoryMap.get(s.destination_id)?.name || s.destination_id;
      const product = s.product_id ? getProductName(s.product_id, locale, products) : s.cargo_type;
      return {
        value: s.id,
        label: `${orig} → ${dest} · ${product} · ${s.shipment_date || s.period} · ${s.volume}${s.unit}`,
        keywords: `${orig} ${dest} ${product} ${s.id}`,
      };
    }),
    [shipments, factoryMap, locale, products],
  );

  const siteOptions = useMemo(
    () => factories
      .filter(f => f.is_active !== false)
      .sort((a, b) => a.name.localeCompare(b.name, locale))
      .map(f => ({
        value: f.id,
        label: `${f.name} (${f.id})`,
        keywords: `${f.name} ${f.id} ${f.address || ''} ${f.code || ''}`,
      })),
    [factories, locale],
  );

  const productOptions = useMemo(
    () => products.filter(p => p.is_active !== false).map(p => ({
      value: p.id,
      label: locale === 'ru' ? p.name_ru : p.name_en,
      keywords: `${p.name_ru} ${p.name_en} ${p.id}`,
    })),
    [products, locale],
  );

  const eventTypeOptions = useMemo(
    () => SHIPMENT_EVENT_TYPES.map(type => ({
      value: type,
      label: t(`shipmentEvents.types.${type}`),
    })),
    [t],
  );

  const timingOptions = useMemo(
    () => SHIPMENT_TIMING_KINDS.map(kind => ({
      value: kind,
      label: t(`shipmentEvents.timingKind.${kind}`),
    })),
    [t],
  );

  const statusOptions = useMemo(
    () => CARGO_STATUSES.map(status => ({
      value: status,
      label: t(`status.${status}_full`),
    })),
    [t],
  );

  const delayReasonOptions = useMemo(
    () => DELAY_REASON_KEYS.map(key => ({
      value: key,
      label: t(`shipmentEvents.delayReasons.${key}`),
    })),
    [t],
  );

  const resolveDelayReason = () => {
    if (delayReasonKey === 'other') return customDelayReason.trim();
    return t(`shipmentEvents.delayReasons.${delayReasonKey}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId) {
      setError(t('shipmentEvents.selectShipment'));
      return;
    }
    if (eventType === 'eta_update' && !etaAfter.trim()) {
      setError(t('shipmentEvents.etaRequired'));
      return;
    }
    if (showReason && !resolveDelayReason()) {
      setError(t('shipmentEvents.reasonRequired'));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: ShipmentEventInput = {
        event_type: eventType,
        timing_kind: timingKind,
        origin_id: originId || undefined,
        destination_id: destinationId || undefined,
        product_id: productId || undefined,
        comment: comment.trim() || undefined,
        eta_after: etaAfter.trim() || undefined,
        delay_hours: delayHours ? Number(delayHours) : undefined,
        early_hours: earlyHours ? Number(earlyHours) : undefined,
        actual_departure_at: actualDepartureAt.trim() || undefined,
        actual_arrival_at: actualArrivalAt.trim() || undefined,
        progress_pct: progressPct !== '' ? Number(progressPct) : undefined,
        vehicle_number: vehicleNumber.trim() || undefined,
        trailer_number: trailerNumber.trim() || undefined,
        container_number: containerNumber.trim() || undefined,
        waybill_number: waybillNumber.trim() || undefined,
        driver_info: driverInfo.trim() || undefined,
        apply_transport_to_shipment: applyTransport,
      };

      if (eventType === 'status_change' || eventType === 'delay' || eventType === 'early') {
        payload.new_status = newStatus;
      }

      if (showReason) {
        payload.delay_reason = resolveDelayReason();
      }

      await onSubmit(shipmentId, payload);
      setComment('');
      setCustomDelayReason('');
      setDelayHours('');
      setEarlyHours('');
      setEtaAfter('');
      setSuccess(t('shipmentEvents.saved'));
      setLastSavedShipmentId(shipmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="shipment-events-panel bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
      {!hideTitle && (
        <div className="font-semibold text-white text-sm">{t('shipmentEvents.addEvent')}</div>
      )}

      {error && (
        <div className="text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{error}</div>
      )}
      {success && (
        <div className="shipment-event-success text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {success}
          </span>
          {lastSavedShipmentId && onOpenShipment ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200"
              onClick={() => onOpenShipment(lastSavedShipmentId)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('shipmentEvents.openShipment')}
            </button>
          ) : null}
        </div>
      )}

      <section className="shipment-event-section space-y-3">
        <h3 className="shipment-event-section-title">{t('shipmentEvents.sectionEvent')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 md:col-span-2">
            <span className="text-slate-400">{t('shipmentEvents.shipment')}</span>
            <SearchableSelect
              value={shipmentId}
              disabled={lockShipment}
              onChange={setShipmentId}
              options={shipmentOptions}
              allowEmpty
              placeholder={t('shipmentEvents.selectShipment')}
              emptyLabel={t('shipmentEvents.selectShipment')}
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.eventType')}</span>
            <SearchableSelect
              value={eventType}
              onChange={v => setEventType(v as ShipmentEventType)}
              options={eventTypeOptions}
              searchable={false}
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.timing')}</span>
            <SearchableSelect
              value={timingKind}
              onChange={v => setTimingKind(v as ShipmentTimingKind)}
              options={timingOptions}
              searchable={false}
            />
          </label>

          {(eventType === 'status_change' || eventType === 'delay' || eventType === 'early') && (
            <label className="space-y-1">
              <span className="text-slate-400">{t('shipmentEvents.newStatus')}</span>
              <SearchableSelect
                value={newStatus}
                onChange={v => setNewStatus(v as CargoStatus)}
                options={statusOptions}
                searchable={false}
              />
            </label>
          )}

          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.progressPct')}</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={progressPct}
              onChange={e => setProgressPct(e.target.value)}
              placeholder="0–100"
            />
          </label>
        </div>
      </section>

      <section className="shipment-event-section space-y-3">
        <h3 className="shipment-event-section-title">{t('shipmentEvents.sectionTiming')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {showReason && (
            <>
              {(eventType === 'delay' || newStatus === 'delayed') && (
                <label className="space-y-1">
                  <span className="text-slate-400">{t('shipmentEvents.delayHours')}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={delayHours}
                    onChange={e => setDelayHours(e.target.value)}
                  />
                </label>
              )}
              <label className="space-y-1">
                <span className="text-slate-400">{t('shipmentEvents.delayReason')}</span>
                <SearchableSelect
                  value={delayReasonKey}
                  onChange={v => setDelayReasonKey(v as DelayReasonKey)}
                  options={delayReasonOptions}
                  searchable={false}
                />
              </label>
              {delayReasonKey === 'other' && (
                <label className="space-y-1 md:col-span-2">
                  <span className="text-slate-400">{t('shipmentEvents.customReason')}</span>
                  <input
                    value={customDelayReason}
                    onChange={e => setCustomDelayReason(e.target.value)}
                  />
                </label>
              )}
            </>
          )}

          {eventType === 'early' && (
            <label className="space-y-1">
              <span className="text-slate-400">{t('shipmentEvents.earlyHours')}</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={earlyHours}
                onChange={e => setEarlyHours(e.target.value)}
              />
            </label>
          )}

          {(eventType === 'eta_update' || eventType === 'delay' || eventType === 'early') && (
            <label className="space-y-1">
              <span className="text-slate-400">
                {t('shipmentEvents.etaAfter')}
                {eventType === 'eta_update' ? ' *' : ''}
              </span>
              <input
                type="datetime-local"
                value={etaAfter}
                onChange={e => setEtaAfter(e.target.value)}
                required={eventType === 'eta_update'}
              />
            </label>
          )}

          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.actualDeparture')}</span>
            <input
              type="datetime-local"
              value={actualDepartureAt}
              onChange={e => setActualDepartureAt(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.actualArrival')}</span>
            <input
              type="datetime-local"
              value={actualArrivalAt}
              onChange={e => setActualArrivalAt(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="shipment-event-section space-y-3">
        <div>
          <h3 className="shipment-event-section-title">{t('shipmentEvents.sectionRoute')}</h3>
          <p className="shipment-event-section-hint">{t('shipmentEvents.snapshotHint')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.origin')}</span>
            <SearchableSelect
              value={originId}
              onChange={setOriginId}
              options={siteOptions}
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.destination')}</span>
            <SearchableSelect
              value={destinationId}
              onChange={setDestinationId}
              options={siteOptions}
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-slate-400">{t('shipmentEvents.product')}</span>
            <SearchableSelect
              value={productId}
              onChange={setProductId}
              options={productOptions}
              allowEmpty
              emptyLabel="—"
            />
          </label>
        </div>
      </section>

      <section className="shipment-event-section space-y-3">
        <div>
          <h3 className="shipment-event-section-title">{t('shipmentEvents.sectionTransport')}</h3>
          <p className="shipment-event-section-hint">{t('shipmentEvents.transportHint')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.vehicleNumber')}</span>
            <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.trailerNumber')}</span>
            <input type="text" value={trailerNumber} onChange={e => setTrailerNumber(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.containerNumber')}</span>
            <input type="text" value={containerNumber} onChange={e => setContainerNumber(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">{t('shipmentEvents.waybillNumber')}</span>
            <input type="text" value={waybillNumber} onChange={e => setWaybillNumber(e.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-slate-400">{t('shipmentEvents.driverInfo')}</span>
            <input type="text" value={driverInfo} onChange={e => setDriverInfo(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 md:col-span-2 text-slate-300 min-h-[2.5rem]">
            <input
              type="checkbox"
              checked={applyTransport}
              onChange={e => setApplyTransport(e.target.checked)}
            />
            {t('shipmentEvents.applyTransport')}
          </label>
        </div>
      </section>

      <section className="shipment-event-section space-y-3">
        <h3 className="shipment-event-section-title">{t('shipmentEvents.sectionComment')}</h3>
        <label className="space-y-1 block">
          <span className="text-slate-400">{t('shipmentEvents.comment')}</span>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('shipments.delayPlaceholder')}
          />
        </label>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !shipmentId}
          className="shipment-event-save-btn flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? t('shipmentEvents.saving') : t('shipmentEvents.save')}
        </button>
      </div>
    </form>
  );
};
