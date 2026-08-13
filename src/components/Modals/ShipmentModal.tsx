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
    { id: 'overview', label: t('shipmentModal.tabOverview'), icon: <Truck aria-hidden /> },
    { id: 'events', label: t('shipmentModal.tabEvents'), icon: <Activity aria-hidden /> },
    { id: 'logistics', label: t('shipmentModal.tabLogistics'), icon: <FileText aria-hidden /> },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel shipment-detail-modal max-w-3xl w-full">
        <div className="modal-panel-header">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="shipment-detail-modal-icon" aria-hidden />
              <div className="min-w-0">
                <h3 className="shipment-detail-modal-title truncate">{productLabel}</h3>
                <p className="shipment-detail-modal-subtitle truncate">
                  {t('shipmentModal.trip', { id: shipment.id.slice(0, 8) })} &bull; {shipment.carrier_name || shipment.manager_name}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="shipment-detail-modal-dismiss" aria-label={t('common.close')}>✕</button>
          </div>

          <div className="shipment-detail-tabs" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`shipment-detail-tab${tab === item.id ? ' is-active' : ''}`}
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
              <div className="shipment-detail-summary-box space-y-3">
                <div className="shipment-detail-route-row">
                  <span className="min-w-0 truncate">{orig?.name || t('shipmentModal.origin')}</span>
                  <ArrowRight className="shipment-detail-route-arrow hidden sm:block" aria-hidden />
                  <span className="min-w-0 truncate">{dest?.name || t('shipmentModal.destination')}</span>
                </div>

                <div className="shipment-detail-fields-grid">
                  <div>
                    <span className="shipment-detail-field-label">{t('shipmentModal.shipmentDate')}</span>
                    <div className="shipment-detail-field-value">{shipment.shipment_date || shipment.period}</div>
                  </div>
                  <div>
                    <span className="shipment-detail-field-label">{t('common.status')}</span>
                    <div className="shipment-detail-field-value shipment-detail-field-value--status">
                      {shipment.status ? t(`status.${shipment.status}`) : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="shipment-detail-field-label">{t('shipmentModal.volume')}</span>
                    <div className="shipment-detail-field-value shipment-detail-field-value--volume">
                      {shipment.volume} {shipment.unit}
                    </div>
                  </div>
                  <div>
                    <span className="shipment-detail-field-label">{t('shipmentModal.amount')}</span>
                    <div className="shipment-detail-field-value shipment-detail-field-value--amount">
                      {showAmount && shipment.amount != null
                        ? `${shipment.amount.toLocaleString()} ₽`
                        : t('shipmentModal.amountHidden')}
                    </div>
                  </div>
                  {shipment.manager_name && (
                    <div className="sm:col-span-2">
                      <span className="shipment-detail-field-label">{t('shipmentModal.manager')}</span>
                      <div className="shipment-detail-field-value">{shipment.manager_name}</div>
                    </div>
                  )}
                  {(shipment.vehicle_number || shipment.waybill_number || shipment.transport_mode) && (
                    <>
                      {shipment.transport_mode && (
                        <div>
                          <span className="shipment-detail-field-label">{t('shipmentLogistics.transportMode')}</span>
                          <div className="shipment-detail-field-value">
                            {t(`shipmentLogistics.modes.${shipment.transport_mode}`)}
                          </div>
                        </div>
                      )}
                      {shipment.vehicle_number && (
                        <div>
                          <span className="shipment-detail-field-label">{t('shipmentLogistics.vehicleNumber')}</span>
                          <div className="shipment-detail-field-value font-mono">{shipment.vehicle_number}</div>
                        </div>
                      )}
                      {shipment.waybill_number && (
                        <div>
                          <span className="shipment-detail-field-label">{t('shipmentLogistics.waybillNumber')}</span>
                          <div className="shipment-detail-field-value font-mono">{shipment.waybill_number}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-2">
                  <div className="shipment-detail-progress-head">
                    <span>{t('shipmentModal.progress')}</span>
                    <span>{shipment.progress_pct || 0}%</span>
                  </div>
                  <div className="shipment-detail-progress-track">
                    <div className="shipment-detail-progress-fill" style={{ width: `${shipment.progress_pct || 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="shipment-detail-stat-card">
                  <span className="shipment-detail-field-label">{t('shipmentModal.channel')}</span>
                  <div className="shipment-detail-field-value">
                    {shipment.source === 'own' ? t('shipmentModal.channelOwn') : t('shipmentModal.channelRzd')}
                  </div>
                </div>
                <div className="shipment-detail-stat-card">
                  <span className="shipment-detail-field-label">{t('shipmentModal.eta')}</span>
                  <div className="shipment-detail-field-value shipment-detail-field-value--eta">
                    {shipment.eta || t('shipmentModal.etaPending')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="shipment-detail-stat-card">
                  <span className="shipment-detail-stat-label">
                    <MapPin aria-hidden />
                    {t('shipmentModal.coordinates')}
                  </span>
                  <div className={hasGps ? 'shipment-detail-field-value--gps-ok' : 'shipment-detail-field-value--gps-missing'}>
                    {coordsLabel}
                  </div>
                </div>
                <div className="shipment-detail-stat-card">
                  <span className="shipment-detail-stat-label">
                    <Gauge aria-hidden />
                    {t('shipmentModal.speed')}
                  </span>
                  <div className="shipment-detail-field-value">
                    {shipment.speed_kmh != null
                      ? `${Math.round(shipment.speed_kmh)} ${t('shipmentModal.speedUnit')}`
                      : t('shipmentModal.noGpsData')}
                  </div>
                </div>
                <div className="shipment-detail-stat-card">
                  <span className="shipment-detail-stat-label">
                    <Clock aria-hidden />
                    {t('shipmentModal.lastUpdated')}
                  </span>
                  <div className="shipment-detail-field-value">
                    {shipment.last_updated
                      ? new Date(shipment.last_updated).toLocaleString(localeTag)
                      : t('shipmentModal.noGpsData')}
                  </div>
                </div>
              </div>

              {shipment.delay_reason ? (
                <div className="shipment-detail-alert-delay">
                  <AlertTriangle aria-hidden />
                  <span>{t('shipmentModal.delayReason', { reason: shipment.delay_reason })}</span>
                </div>
              ) : null}
            </>
          )}

          {tab === 'events' && (
            <div className="shipment-detail-events">
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
              <div className="shipment-detail-events-timeline">
                <h4 className="shipment-detail-timeline-heading">{t('shipmentEvents.timeline')}</h4>
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
              className="shipment-detail-modal-btn shipment-detail-modal-btn--map"
            >
              <MapPin aria-hidden />
              {t('shipments.showOnMap')}
            </button>
          )}
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(shipment)}
              className="shipment-detail-modal-btn shipment-detail-modal-btn--edit"
            >
              <Edit3 aria-hidden />
              {t('shipments.editButton')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shipment-detail-modal-btn shipment-detail-modal-btn--close"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
