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
    en_route: { text: t('status.en_route'), bg: 'bg-emerald-500/10', textCol: 'text-emerald-400', border: 'border-emerald-500/30' },
    delayed: { text: t('status.delayed'), bg: 'bg-amber-500/10', textCol: 'text-amber-400', border: 'border-amber-500/30' },
    arrived: { text: t('status.arrived'), bg: 'bg-slate-500/10', textCol: 'text-slate-400', border: 'border-slate-500/30' },
    loading: { text: t('status.loading'), bg: 'bg-purple-500/10', textCol: 'text-purple-400', border: 'border-purple-500/30' },
    alert: { text: t('status.alert'), bg: 'bg-red-500/10', textCol: 'text-red-400', border: 'border-red-500/30' },
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
        className="tasks-drawer-panel bg-slate-900/96 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl text-slate-200"
        role="dialog"
        aria-modal="true"
        aria-label={t('shipments.activeDrawerTitle')}
      >
        <header className="tasks-drawer-header border-b border-slate-700">
          <div className="tasks-drawer-header-main min-w-0">
            <div className="min-w-0 flex items-start gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
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
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-700 text-xs text-white">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('shipments.activeDrawerSearch')}
                className="bg-transparent focus:outline-none w-full min-w-0 placeholder-slate-500"
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
                      <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0 text-left flex-1">
                        <div className="font-semibold truncate">{link.cargo_type}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {link.volume.toLocaleString(localeTag)} {link.unit}
                          {' · '}
                          {formatShipmentDate(link)}
                        </div>
                        <div className="text-[10px] text-slate-300 truncate mt-0.5 flex items-center gap-1">
                          <span className="truncate">{orig?.name || t('common.sender')}</span>
                          <ArrowRight className="w-3 h-3 shrink-0 text-slate-500" aria-hidden />
                          <span className="truncate">{dest?.name || t('common.receiver')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badge.bg} ${badge.textCol} ${badge.border}`}>
                            {badge.text}
                          </span>
                          {link.eta ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                              <Clock className="w-3 h-3 shrink-0" aria-hidden />
                              {t('shipments.eta', { eta: link.eta })}
                            </span>
                          ) : null}
                        </div>
                        {(link.progress_pct ?? 0) > 0 ? (
                          <div className="mt-1.5 h-1 rounded-full bg-slate-800 overflow-hidden" aria-hidden>
                            <div
                              className="h-full bg-emerald-500/80 rounded-full"
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
