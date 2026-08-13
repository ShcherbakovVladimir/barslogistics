import { ArrowRight, Truck } from 'lucide-react';
import type { AggregatedRoute, Factory, User, Product } from '../../types';
import { useI18n } from '../../i18n';
import { getProductName } from '../../constants/products';
import { canSeeDealAmount } from '../../utils/permissions';

export interface RouteDetailModalProps {
  route: AggregatedRoute | null;
  factories: Factory[];
  products: Product[];
  user: User;
  onClose: () => void;
  onSelectShipment: (id: string) => void;
}

export function RouteDetailModal({
  route,
  factories,
  products,
  user,
  onClose,
  onSelectShipment,
}: RouteDetailModalProps) {
  const { t, locale } = useI18n();
  if (!route) return null;

  const factoryMap = new Map(factories.map(f => [f.id, f]));
  const orig = factoryMap.get(route.origin_id);
  const dest = factoryMap.get(route.destination_id);
  const showAmount = route.shipments.some(s => canSeeDealAmount(user, s));

  return (
    <div className="modal-backdrop">
      <div className="modal-panel route-detail-modal max-w-lg w-full">
        <div className="modal-panel-header">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="route-detail-modal-icon" />
              <div className="min-w-0">
                <h3 className="route-detail-modal-title">{t('routeModal.title')}</h3>
                <p className="route-detail-modal-subtitle truncate">
                  {getProductName(route.product_id, locale, products)} &bull; {t(`flowType.${route.flow_type}`)}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="route-detail-modal-dismiss" aria-label={t('common.close')}>✕</button>
          </div>
        </div>

        <div className="modal-panel-body modal-scrollbar space-y-4">
        <div className="route-detail-modal-summary space-y-2">
          <div className="route-detail-summary-route">
            <span className="min-w-0 truncate">{orig?.name}</span>
            <ArrowRight className="route-detail-summary-arrow hidden sm:block" />
            <span className="min-w-0 truncate">{dest?.name}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <div>
              <span className="route-detail-summary-label">{t('routeModal.shipmentCount')}</span>
              <div className="route-detail-summary-value">{route.shipment_count}</div>
            </div>
            <div>
              <span className="route-detail-summary-label">{t('routeModal.totalVolume')}</span>
              <div className="route-detail-summary-value route-detail-summary-value--volume">{route.total_volume.toLocaleString()} {route.unit}</div>
            </div>
            {showAmount && (
              <div className="col-span-2">
                <span className="route-detail-summary-label">{t('routeModal.totalAmount')}</span>
                <div className="route-detail-summary-value route-detail-summary-value--amount">{route.total_amount.toLocaleString()} ₽</div>
              </div>
            )}
            <div>
              <span className="route-detail-summary-label">{t('routeModal.status')}</span>
              <div className="route-detail-summary-value">{route.status ? t(`status.${route.status}`) : '—'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="route-detail-section-heading">{t('routeModal.shipmentsList')}</h4>
          {route.shipments.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectShipment(s.id)}
              className="route-detail-shipment-btn"
            >
              <div className="flex justify-between items-center">
                <span className="route-detail-shipment-title">{s.cargo_type}</span>
                <span className="route-detail-shipment-meta">{s.shipment_date || s.period}</span>
              </div>
              <div className="flex justify-between mt-1 route-detail-shipment-meta">
                <span>{s.volume} {s.unit}</span>
                {canSeeDealAmount(user, s) && s.amount != null && (
                  <span className="route-detail-shipment-amount">{s.amount.toLocaleString()} ₽</span>
                )}
                <span>{s.status ? t(`status.${s.status}`) : ''}</span>
              </div>
              {s.manager_name && (
                <div className="route-detail-shipment-manager">{t('shipmentModal.manager')}: {s.manager_name}</div>
              )}
            </button>
          ))}
        </div>
        </div>

        <div className="modal-panel-footer text-right">
          <button
            type="button"
            onClick={onClose}
            className="route-detail-modal-btn route-detail-modal-btn--close px-4 py-2 rounded-xl text-xs font-semibold"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
