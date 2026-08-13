import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, MapPin, Search, Truck, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { isShipmentInUserScope } from '../../utils/permissions';
import { sortShipments } from '../../utils/shipmentSort';
import type { Factory, SupplyLink, User } from '../../types';
import { isActiveShipment } from './activeShipments';

export interface ActiveShipmentsDrawerProps {
  open: boolean;
  onClose: () => void;
  supplyLinks: SupplyLink[];
  factories: Factory[];
  currentUser: User;
  onSelectShipment: (shipment: SupplyLink) => void;
  onShowOnMap: (shipment: SupplyLink) => void;
  focusShipmentId?: string | null;
  onFocusShipmentConsumed?: () => void;
}

export const ActiveShipmentsDrawer: React.FC<ActiveShipmentsDrawerProps> = ({
  open,
  onClose,
  supplyLinks,
  factories,
  currentUser,
  onSelectShipment,
  onShowOnMap,
  focusShipmentId,
  onFocusShipmentConsumed,
}) => {
  const { t, localeTag } = useI18n();
  const [search, setSearch] = useState('');

  const factoryMap = useMemo(() => new Map(factories.map(f => [f.id, f])), [factories]);

  const statusLabels = useMemo(() => ({
    en_route: { text: t('status.en_route'), badgeClass: 'active-shipment-status-badge--en_route' },
    delayed: { text: t('status.delayed'), badgeClass: 'active-shipment-status-badge--delayed' },
    arrived: { text: t('status.arrived'), badgeClass: 'active-shipment-status-badge--arrived' },
    loading: { text: t('status.loading'), badgeClass: 'active-shipment-status-badge--loading' },
    alert: { text: t('status.alert'), badgeClass: 'active-shipment-status-badge--alert' },
  }), [t]);

  const activeLinks = useMemo(() => {
    const scoped = supplyLinks.filter(
      l => isShipmentInUserScope(l, currentUser) && isActiveShipment(l),
    );
    const filtered = search.trim()
      ? scoped.filter(l => {
          const q = search.trim().toLowerCase();
          const orig = factoryMap.get(l.origin_id);
          const dest = factoryMap.get(l.destination_id);
          return (
            l.cargo_type.toLowerCase().includes(q)
            || (orig?.name || '').toLowerCase().includes(q)
            || (dest?.name || '').toLowerCase().includes(q)
            || (l.carrier_name || '').toLowerCase().includes(q)
          );
        })
      : scoped;
    return sortShipments(filtered, 'updated_desc');
  }, [supplyLinks, currentUser, search, factoryMap]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !focusShipmentId) return;
    const el = document.getElementById(`active-shipment-${focusShipmentId}`);
    el?.scrollIntoView({ block: 'nearest' });
    onFocusShipmentConsumed?.();
  }, [open, focusShipmentId, onFocusShipmentConsumed]);

  const formatShipmentDate = (link: SupplyLink) => {
    const raw = link.shipment_date || link.period;
    if (!raw) return '—';
    if (raw.length === 4) return raw;
    const ts = Date.parse(raw);
    if (Number.isNaN(ts)) return raw;
    return new Date(ts).toLocaleDateString(localeTag);
  };

  if (!open) return null;

  return (
    <div className="tasks-drawer-root" role="presentation">
      <button type="button" className="tasks-drawer-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <aside
        className="tasks-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('shipments.activeDrawerTitle')}
      >
        <header className="tasks-drawer-header">
          <div className="tasks-drawer-header-main min-w-0">
            <div className="min-w-0 flex items-start gap-1.5">
              <Truck className="tasks-drawer-header-icon tasks-drawer-header-icon--emerald" aria-hidden />
              <div className="min-w-0">
                <h2 className="tasks-drawer-title truncate">{t('shipments.activeDrawerTitle')}</h2>
                <p className="tasks-drawer-subtitle">{t('shipments.activeDrawerSubtitle')}</p>
              </div>
            </div>
          </div>
          <button type="button" className="tasks-drawer-icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="tasks-drawer-body scroll-area">
          <div className="tasks-drawer-search-wrap">
            <div className="tasks-drawer-search">
              <Search className="tasks-drawer-search-icon" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('shipments.activeDrawerSearch')}
                className="tasks-drawer-search-input"
              />
            </div>
          </div>

          <div className="tasks-board-list space-y-2 px-3 pb-3">
            {activeLinks.length === 0 ? (
              <p className="tasks-empty">{t('shipments.activeDrawerEmpty')}</p>
            ) : (
              activeLinks.map(link => {
                const orig = factoryMap.get(link.origin_id);
                const dest = factoryMap.get(link.destination_id);
                const badge = statusLabels[link.status || 'en_route'];
                return (
                  <div key={link.id} id={`active-shipment-${link.id}`} className="tasks-board-card">
                    <button
                      type="button"
                      className="tasks-board-card-main"
                      onClick={() => onSelectShipment(link)}
                    >
                      <Truck className="tasks-board-card-icon tasks-board-card-icon--emerald" />
                      <div className="min-w-0 text-left flex-1">
                        <div className="font-semibold truncate">{link.cargo_type}</div>
                        <div className="tasks-board-card-meta truncate">
                          {link.volume.toLocaleString(localeTag)} {link.unit}
                          {' · '}
                          {formatShipmentDate(link)}
                        </div>
                        <div className="tasks-board-card-route truncate">
                          <span className="truncate">{orig?.name || t('common.sender')}</span>
                          <ArrowRight className="tasks-board-card-route-arrow" aria-hidden />
                          <span className="truncate">{dest?.name || t('common.receiver')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`active-shipment-status-badge ${badge.badgeClass}`}>
                            {badge.text}
                          </span>
                          {link.eta ? (
                            <span className="active-shipment-eta">
                              <Clock className="w-3 h-3 shrink-0" aria-hidden />
                              {t('shipments.eta', { eta: link.eta })}
                            </span>
                          ) : null}
                        </div>
                        {(link.progress_pct ?? 0) > 0 ? (
                          <div className="active-shipment-progress" aria-hidden>
                            <div
                              className="active-shipment-progress-fill"
                              style={{ width: `${Math.min(100, link.progress_pct || 0)}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="tasks-drawer-icon-btn"
                      onClick={() => {
                        onShowOnMap(link);
                        onClose();
                      }}
                      aria-label={t('shipments.showOnMap')}
                      title={t('shipments.showOnMap')}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
