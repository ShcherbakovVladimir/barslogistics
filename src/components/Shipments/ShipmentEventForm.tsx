import React, { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
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
  onSubmit: (shipmentId: string, input: ShipmentEventInput) => Promise<void>;
}

export const ShipmentEventForm: React.FC<ShipmentEventFormProps> = ({
  shipments,
  factories,
  products,
  selectedShipmentId,
  lockShipment = false,
  onSubmit,
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedShipment = shipments.find(s => s.id === shipmentId);

  React.useEffect(() => {
    if (selectedShipmentId) setShipmentId(selectedShipmentId);
  }, [selectedShipmentId]);

  React.useEffect(() => {
    if (!selectedShipment) return;
    setOriginId(selectedShipment.origin_id);
    setDestinationId(selectedShipment.destination_id);
    setProductId(selectedShipment.product_id || '');
    setNewStatus(selectedShipment.status || 'en_route');
  }, [selectedShipment]);

  React.useEffect(() => {
    if (eventType === 'delay') {
      setTimingKind('delay');
      setNewStatus('delayed');
    } else if (eventType === 'early') {
      setTimingKind('early');
    } else if (eventType === 'comment') {
      setTimingKind('on_time');
    }
  }, [eventType]);

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
    setSaving(true);
    setError('');
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
      };

      if (eventType === 'status_change' || eventType === 'delay' || eventType === 'early') {
        payload.new_status = newStatus;
      }

      if (eventType === 'delay' || STATUS_REQUIRES_REASON.includes(newStatus)) {
        payload.delay_reason = resolveDelayReason();
      }

      await onSubmit(shipmentId, payload);
      setComment('');
      setCustomDelayReason('');
      setDelayHours('');
      setEarlyHours('');
      setEtaAfter('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shipment-events-panel bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
      <div className="font-semibold text-white text-sm">{t('shipmentEvents.addEvent')}</div>

      {error && (
        <div className="text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{error}</div>
      )}

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

        {(eventType === 'delay' || newStatus === 'delayed') && (
          <>
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
                <span className="text-slate-400">{t('shipmentEvents.comment')}</span>
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
            <span className="text-slate-400">{t('shipmentEvents.etaAfter')}</span>
            <input
              type="datetime-local"
              value={etaAfter}
              onChange={e => setEtaAfter(e.target.value)}
            />
          </label>
        )}

        <label className="space-y-1 md:col-span-2">
          <span className="text-slate-400">{t('shipmentEvents.comment')}</span>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('shipments.delayPlaceholder')}
          />
        </label>
      </div>

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
