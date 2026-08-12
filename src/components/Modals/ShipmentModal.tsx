import React, { useCallback, useEffect, useState } from 'react';
import { SupplyLink, Factory, User, Product, TransportAsset } from '../../types';
import { useI18n } from '../../i18n';
import { getProductName } from '../../constants/products';
import { canSeeDealAmount, canCreateShipmentEvent } from '../../utils/permissions';
import { ApiService } from '../../services/api';
import { Truck, ArrowRight, AlertTriangle, MapPin, Gauge, Clock, Edit3, FileText, Activity } from 'lucide-react';
import { ShipmentEventTimeline } from '../Shipments/ShipmentEventTimeline';
import { ShipmentEventForm } from '../Shipments/ShipmentEventForm';
import { ShipmentLogisticsPanel } from '../Shipments/ShipmentLogisticsPanel';
import type { ShipmentEvent, ShipmentEventInput } from '../../types';

type ModalTab = 'overview' | 'events' | 'logistics';

interface ShipmentModalProps {
  shipment: SupplyLink | null;
  onClose: () => void;
  factories: Factory[];
  supplyLinks: SupplyLink[];
  products: Product[];
  transportAssets?: TransportAsset[];
  onShipmentUpdated: (shipment: SupplyLink) => void;
  currentUser: User;
  canEdit?: boolean;
  onEdit?: (shipment: SupplyLink) => void;
  onShowOnMap?: (shipment: SupplyLink) => void;
}

export const ShipmentModal: React.FC<ShipmentModalProps> = ({
  shipment,
  onClose,
  factories,
  supplyLinks,
  products,
  transportAssets = [],
  onShipmentUpdated,
  currentUser,
  canEdit = false,
  onEdit,
  onShowOnMap,
}) => {
  const { t, locale, localeTag } = useI18n();
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [tab, setTab] = useState<ModalTab>('overview');

  const canManage = shipment ? canCreateShipmentEvent(currentUser, shipment) : false;

  const loadEvents = useCallback(async (shipmentId: string) => {
    setLoadingEvents(true);
    try {
      const data = await ApiService.getShipmentEvents(shipmentId);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (shipment) {
      void loadEvents(shipment.id);
      setTab('overview');
    } else {
      setEvents([]);
    }
  }, [shipment, loadEvents]);

  if (!shipment) return null;

  const factoryMap = new Map<string, Factory>(factories.map(f => [f.id, f]));
  const orig = factoryMap.get(shipment.origin_id);
  const dest = factoryMap.get(shipment.destination_id);
  const productLabel = shipment.product_id
    ? getProductName(shipment.product_id, locale, products)
    : shipment.cargo_type;

  const showAmount = canSeeDealAmount(currentUser, shipment);

  const hasGps = shipment.current_lat != null && shipment.current_lng != null;
  const coordsLabel = hasGps
    ? `${shipment.current_lat!.toFixed(5)}, ${shipment.current_lng!.toFixed(5)}`
    : t('shipmentModal.noGpsData');

  const handleCreateEvent = async (_shipmentId: string, input: ShipmentEventInput) => {
    const { shipment: updated, event } = await ApiService.createShipmentEvent(shipment.id, input);
    onShipmentUpdated(updated);
    setEvents(prev => [event, ...prev]);
  };

  const tabs: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('shipmentModal.tabOverview'), icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'events', label: t('shipmentModal.tabEvents'), icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'logistics', label: t('shipmentModal.tabLogistics'), icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel shipment-detail-modal bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full text-slate-100 shadow-2xl">
        <div className="modal-panel-header">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-base text-white truncate">{productLabel}</h3>
                <p className="text-xs text-slate-400 truncate">{t('shipmentModal.trip', { id: shipment.id.slice(0, 8) })} &bull; {shipment.carrier_name || shipment.manager_name}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="shipment-detail-modal-dismiss shrink-0 text-slate-400 hover:text-white p-1" aria-label={t('common.close')}>✕</button>
          </div>

          <div className="shipment-detail-tabs mt-3 flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`shipment-detail-tab inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === item.id
                    ? 'shipment-detail-tab--active bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-panel-body modal-scrollbar space-y-4">
          {tab === 'overview' && (
            <>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-bold text-sm text-white">
                  <span className="min-w-0 truncate">{orig?.name || t('shipmentModal.origin')}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
                  <span className="min-w-0 truncate">{dest?.name || t('shipmentModal.destination')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">{t('shipmentModal.shipmentDate')}</span>
                    <div className="font-semibold text-white">{shipment.shipment_date || shipment.period}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('common.status')}</span>
                    <div className="font-semibold text-emerald-400">{shipment.status ? t(`status.${shipment.status}`) : '—'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('shipmentModal.volume')}</span>
                    <div className="font-semibold text-emerald-400">{shipment.volume} {shipment.unit}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('shipmentModal.amount')}</span>
                    <div className="font-semibold text-amber-400">
                      {showAmount && shipment.amount != null
                        ? `${shipment.amount.toLocaleString()} ₽`
                        : t('shipmentModal.amountHidden')}
                    </div>
                  </div>
                  {shipment.manager_name && (
                    <div className="col-span-2">
                      <span className="text-slate-400">{t('shipmentModal.manager')}</span>
                      <div className="font-semibold text-white">{shipment.manager_name}</div>
                    </div>
                  )}
                  {(shipment.vehicle_number || shipment.waybill_number || shipment.transport_mode) && (
                    <>
                      {shipment.transport_mode && (
                        <div>
                          <span className="text-slate-400">{t('shipmentLogistics.transportMode')}</span>
                          <div className="font-semibold text-white">{t(`shipmentLogistics.modes.${shipment.transport_mode}`)}</div>
                        </div>
                      )}
                      {shipment.vehicle_number && (
                        <div>
                          <span className="text-slate-400">{t('shipmentLogistics.vehicleNumber')}</span>
                          <div className="font-semibold text-white font-mono">{shipment.vehicle_number}</div>
                        </div>
                      )}
                      {shipment.waybill_number && (
                        <div>
                          <span className="text-slate-400">{t('shipmentLogistics.waybillNumber')}</span>
                          <div className="font-semibold text-white font-mono">{shipment.waybill_number}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>{t('shipmentModal.progress')}</span>
                    <span>{shipment.progress_pct || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${shipment.progress_pct || 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400">{t('shipmentModal.channel')}</span>
                  <div className="font-bold text-white text-sm mt-0.5">{shipment.source === 'own' ? t('shipmentModal.channelOwn') : t('shipmentModal.channelRzd')}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400">{t('shipmentModal.eta')}</span>
                  <div className="font-bold text-blue-400 text-sm mt-0.5">{shipment.eta || t('shipmentModal.etaPending')}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t('shipmentModal.coordinates')}
                  </span>
                  <div className={`font-mono text-sm mt-0.5 ${hasGps ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {coordsLabel}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    {t('shipmentModal.speed')}
                  </span>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {shipment.speed_kmh != null
                      ? `${Math.round(shipment.speed_kmh)} ${t('shipmentModal.speedUnit')}`
                      : t('shipmentModal.noGpsData')}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('shipmentModal.lastUpdated')}
                  </span>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {shipment.last_updated
                      ? new Date(shipment.last_updated).toLocaleString(localeTag)
                      : t('shipmentModal.noGpsData')}
                  </div>
                </div>
              </div>

              {shipment.delay_reason && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t('shipmentModal.delayReason', { reason: shipment.delay_reason })}</span>
                </div>
              )}
            </>
          )}

          {tab === 'events' && (
            <div className="space-y-4 shipment-events-panel">
              {canManage && (
                <ShipmentEventForm
                  shipments={supplyLinks}
                  factories={factories}
                  products={products}
                  transportAssets={transportAssets}
                  selectedShipmentId={shipment.id}
                  lockShipment
                  onSubmit={handleCreateEvent}
                />
              )}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">{t('shipmentEvents.timeline')}</h4>
                <ShipmentEventTimeline
                  events={events}
                  factories={factories}
                  loading={loadingEvents}
                />
              </div>
            </div>
          )}

          {tab === 'logistics' && (
            <ShipmentLogisticsPanel
              shipment={shipment}
              canManage={canManage}
              onShipmentUpdated={onShipmentUpdated}
              transportAssets={transportAssets}
            />
          )}
        </div>

        <div className="modal-panel-footer flex flex-wrap items-center justify-end gap-2">
          {onShowOnMap && (
            <button
              type="button"
              onClick={() => onShowOnMap(shipment)}
              className="shipment-detail-modal-btn shipment-detail-modal-btn--map inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            >
              <MapPin className="w-3.5 h-3.5" />
              {t('shipments.showOnMap')}
            </button>
          )}
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(shipment)}
              className="shipment-detail-modal-btn shipment-detail-modal-btn--edit inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {t('shipments.editButton')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shipment-detail-modal-btn shipment-detail-modal-btn--close px-4 py-2 rounded-xl text-xs font-semibold"
          >
            {t('common.close')}
          </button>
        </div>

      </div>
    </div>
  );
};
