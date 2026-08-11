import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight, Edit3, Save, X,
} from 'lucide-react';
import type {
  CargoStatus, Factory, FlowType, Product, SalesManager, SupplyLink, ThirdPartyCarrier, User,
} from '../../types';
import { CARGO_STATUSES } from '../../types';
import { useI18n } from '../../i18n';
import { activeProducts, getProductName } from '../../constants/products';
import { activeCarriers } from '../../constants/carriers';
import { activeSalesManagers, salesManagerLabel } from '../../constants/salesManagers';
import { canSeeDealAmount } from '../../utils/permissions';
import { SearchableSelect } from '../UI/SearchableSelect';
import { DELAY_REASON_KEYS } from '../../constants/shipmentEvents';

const FLOWS: FlowType[] = ['shipment', 'purchase', 'internal'];

export interface ShipmentEditModalProps {
  shipment: SupplyLink;
  factories: Factory[];
  products: Product[];
  carriers: ThirdPartyCarrier[];
  salesManagers: SalesManager[];
  currentUser: User;
  saving?: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Record<string, unknown>) => Promise<void>;
}

export const ShipmentEditModal: React.FC<ShipmentEditModalProps> = ({
  shipment,
  factories,
  products,
  carriers,
  salesManagers,
  currentUser,
  saving = false,
  onClose,
  onSave,
}) => {
  const { t, locale } = useI18n();
  const catalog = useMemo(() => activeProducts(products), [products]);
  const carrierList = useMemo(() => activeCarriers(carriers), [carriers]);
  const managerList = useMemo(() => activeSalesManagers(salesManagers), [salesManagers]);

  const siteOptions = useMemo(
    () => factories.map(f => ({ value: f.id, label: f.name, keywords: `${f.region} ${f.holding}` })),
    [factories],
  );

  const [originId, setOriginId] = useState(shipment.origin_id);
  const [destinationId, setDestinationId] = useState(shipment.destination_id);
  const [productId, setProductId] = useState(shipment.product_id || catalog[0]?.id || '');
  const [flowType, setFlowType] = useState<FlowType>(shipment.flow_type || 'shipment');
  const [volume, setVolume] = useState(String(shipment.volume));
  const [unit, setUnit] = useState(shipment.unit || 'т');
  const [shipmentDate, setShipmentDate] = useState(shipment.shipment_date || new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<CargoStatus>(shipment.status || 'en_route');
  const [source, setSource] = useState<'own' | 'rzd'>(shipment.source || 'own');
  const [carrierId, setCarrierId] = useState(shipment.carrier_id || '');
  const [salesManagerId, setSalesManagerId] = useState(shipment.sales_manager_id || '');
  const [amount, setAmount] = useState(shipment.amount != null ? String(shipment.amount) : '');
  const [driverInfo, setDriverInfo] = useState(shipment.driver_info || '');
  const [eta, setEta] = useState(shipment.eta || '');
  const [delayReasonKey, setDelayReasonKey] = useState('maneuvering');
  const [customDelayReason, setCustomDelayReason] = useState(shipment.delay_reason || '');
  const [error, setError] = useState('');

  const showAmount = canSeeDealAmount(currentUser, shipment);

  useEffect(() => {
    setOriginId(shipment.origin_id);
    setDestinationId(shipment.destination_id);
    setProductId(shipment.product_id || catalog[0]?.id || '');
    setFlowType(shipment.flow_type || 'shipment');
    setVolume(String(shipment.volume));
    setUnit(shipment.unit || 'т');
    setShipmentDate(shipment.shipment_date || new Date().toISOString().slice(0, 10));
    setStatus(shipment.status || 'en_route');
    setSource(shipment.source || 'own');
    setCarrierId(shipment.carrier_id || '');
    setSalesManagerId(shipment.sales_manager_id || '');
    setAmount(shipment.amount != null ? String(shipment.amount) : '');
    setDriverInfo(shipment.driver_info || '');
    setEta(shipment.eta || '');
    setCustomDelayReason(shipment.delay_reason || '');
    setError('');
  }, [shipment, catalog]);

  const swapDirection = () => {
    setOriginId(destinationId);
    setDestinationId(originId);
  };

  const resolveDelayReason = () => {
    if (status !== 'delayed' && status !== 'alert') return undefined;
    if (delayReasonKey === 'other') return customDelayReason.trim() || undefined;
    return t(`shipmentEvents.delayReasons.${delayReasonKey}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!originId || !destinationId) {
      setError(t('myData.validationRequired'));
      return;
    }
    if (originId === destinationId) {
      setError(t('shipments.originDestSame'));
      return;
    }
    if (!volume.trim() || Number(volume) <= 0) {
      setError(t('myData.validationRequired'));
      return;
    }

    const product = catalog.find(p => p.id === productId);
    try {
      await onSave(shipment.id, {
        origin_id: originId,
        destination_id: destinationId,
        product_id: productId || undefined,
        cargo_type: product ? getProductName(product.id, locale, catalog) : shipment.cargo_type,
        flow_type: flowType,
        volume: Number(volume),
        unit: unit.trim() || 'т',
        shipment_date: shipmentDate,
        status,
        source,
        carrier_id: carrierId || undefined,
        sales_manager_id: salesManagerId || undefined,
        amount: showAmount && amount.trim() ? Number(amount) : undefined,
        driver_info: driverInfo.trim() || undefined,
        eta: eta.trim() || undefined,
        delay_reason: resolveDelayReason(),
        site_id: shipment.site_id,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shipments.saveFailed'));
    }
  };

  return (
    <div className="modal-backdrop">
      <form
        onSubmit={handleSubmit}
        className="modal-panel shipment-events-panel bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full text-slate-100 shadow-2xl"
      >
        <div className="modal-panel-header">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span>{t('shipments.editTitle')}</span>
            </h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label={t('common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">{shipment.id}</p>
        </div>

        <div className="modal-panel-body modal-scrollbar space-y-4 text-xs">
          {error && (
            <div className="text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1 md:col-span-2">
              <span className="text-slate-400">{t('shipmentEvents.origin')}</span>
              <SearchableSelect value={originId} onChange={setOriginId} options={siteOptions} />
            </label>

            <div className="md:col-span-2 flex justify-center">
              <button
                type="button"
                onClick={swapDirection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-200 text-[11px] font-semibold"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {t('shipments.swapDirection')}
              </button>
            </div>

            <label className="space-y-1 md:col-span-2">
              <span className="text-slate-400">{t('shipmentEvents.destination')}</span>
              <SearchableSelect value={destinationId} onChange={setDestinationId} options={siteOptions} />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('shipmentEvents.product')}</span>
              <SearchableSelect
                value={productId}
                onChange={setProductId}
                options={catalog.map(p => ({ value: p.id, label: getProductName(p.id, locale, catalog) }))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('myData.flowType')}</span>
              <SearchableSelect
                value={flowType}
                onChange={v => setFlowType(v as FlowType)}
                options={FLOWS.map(flow => ({ value: flow, label: t(`flowType.${flow}`) }))}
                searchable={false}
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('myData.volume')}</span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={volume}
                onChange={e => setVolume(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('shipments.unitLabel')}</span>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('shipmentModal.shipmentDate')}</span>
              <input
                type="date"
                required
                value={shipmentDate}
                onChange={e => setShipmentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('shipments.newStatus')}</span>
              <SearchableSelect
                value={status}
                onChange={v => setStatus(v as CargoStatus)}
                options={CARGO_STATUSES.map(s => ({ value: s, label: t(`status.${s}_full`) }))}
                searchable={false}
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('shipments.allChannels')}</span>
              <SearchableSelect
                value={source}
                onChange={v => setSource(v as 'own' | 'rzd')}
                options={[
                  { value: 'own', label: t('shipments.ownChannel') },
                  { value: 'rzd', label: t('shipments.rzdChannel') },
                ]}
                searchable={false}
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('myData.carrier')}</span>
              <SearchableSelect
                value={carrierId}
                onChange={setCarrierId}
                allowEmpty
                emptyLabel={t('searchableSelect.select')}
                options={carrierList.map(c => ({ value: c.id, label: c.name }))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">{t('myData.manager')}</span>
              <SearchableSelect
                value={salesManagerId}
                onChange={setSalesManagerId}
                allowEmpty
                emptyLabel={t('searchableSelect.select')}
                options={managerList.map(m => ({ value: m.id, label: salesManagerLabel(m) }))}
              />
            </label>

            {showAmount && (
              <label className="space-y-1">
                <span className="text-slate-400">{t('shipmentModal.amount')}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                />
              </label>
            )}

            <label className="space-y-1">
              <span className="text-slate-400">{t('shipmentModal.eta')}</span>
              <input
                value={eta}
                onChange={e => setEta(e.target.value)}
                placeholder={t('shipmentModal.etaPending')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-slate-400">{t('shipments.driverInfo')}</span>
              <input
                value={driverInfo}
                onChange={e => setDriverInfo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              />
            </label>
          </div>

          {(status === 'delayed' || status === 'alert') && (
            <div className="space-y-2">
              <label className="block space-y-1">
                <span className="text-slate-400">{t('shipments.delayReason')}</span>
                <SearchableSelect
                  value={delayReasonKey}
                  onChange={setDelayReasonKey}
                  options={DELAY_REASON_KEYS.map(key => ({
                    value: key,
                    label: t(`shipmentEvents.delayReasons.${key}`),
                  }))}
                  searchable={false}
                />
              </label>
              {delayReasonKey === 'other' && (
                <textarea
                  rows={3}
                  placeholder={t('shipments.delayPlaceholder')}
                  value={customDelayReason}
                  onChange={e => setCustomDelayReason(e.target.value)}
                />
              )}
            </div>
          )}
        </div>

        <div className="modal-panel-footer flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? t('common.saving') : t('shipments.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};
