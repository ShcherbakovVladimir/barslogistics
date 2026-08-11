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
      <div className="modal-panel route-detail-modal bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full text-slate-100 shadow-2xl">
        <div className="modal-panel-header">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-base text-white">{t('routeModal.title')}</h3>
                <p className="text-xs text-slate-400 truncate">
                  {getProductName(route.product_id, locale, products)} &bull; {t(`flowType.${route.flow_type}`)}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="route-detail-modal-dismiss shrink-0 text-slate-400 hover:text-white p-1" aria-label={t('common.close')}>✕</button>
          </div>
        </div>

        <div className="modal-panel-body modal-scrollbar space-y-4">
        <div className="route-detail-modal-summary p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-bold text-sm text-white">
            <span className="min-w-0 truncate">{orig?.name}</span>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            <span className="min-w-0 truncate">{dest?.name}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <div>
              <span className="text-slate-400">{t('routeModal.shipmentCount')}</span>
              <div className="font-bold text-white">{route.shipment_count}</div>
            </div>
            <div>
              <span className="text-slate-400">{t('routeModal.totalVolume')}</span>
              <div className="font-bold text-emerald-400">{route.total_volume.toLocaleString()} {route.unit}</div>
            </div>
            {showAmount && (
              <div className="col-span-2">
                <span className="text-slate-400">{t('routeModal.totalAmount')}</span>
                <div className="font-bold text-amber-400">{route.total_amount.toLocaleString()} ₽</div>
              </div>
            )}
            <div>
              <span className="text-slate-400">{t('routeModal.status')}</span>
              <div className="font-bold text-white">{route.status ? t(`status.${route.status}`) : '—'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400">{t('routeModal.shipmentsList')}</h4>
          {route.shipments.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectShipment(s.id)}
              className="route-detail-shipment-btn w-full text-left p-3 bg-slate-950 border border-slate-800 rounded-xl transition-colors text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">{s.cargo_type}</span>
                <span className="text-slate-400">{s.shipment_date || s.period}</span>
              </div>
              <div className="flex justify-between mt-1 text-slate-400">
                <span>{s.volume} {s.unit}</span>
                {canSeeDealAmount(user, s) && s.amount != null && (
                  <span className="text-amber-400">{s.amount.toLocaleString()} ₽</span>
                )}
                <span>{s.status ? t(`status.${s.status}`) : ''}</span>
              </div>
              {s.manager_name && (
                <div className="mt-1 text-slate-500">{t('shipmentModal.manager')}: {s.manager_name}</div>
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
