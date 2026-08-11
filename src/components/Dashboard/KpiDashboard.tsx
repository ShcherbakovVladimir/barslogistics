import React, { useMemo, useState } from 'react';
import {
  Factory,
  Product,
  SalesManager,
  SupplyLink,
  User,
  PeriodFilterState,
} from '../../types';
import { useI18n } from '../../i18n';
import { defaultPeriodFilter } from '../../utils/periodFilter';
import {
  computeKpiAnalytics,
  filterOwnKpiShipments,
  formatKpiPeriodLabel,
} from '../../utils/kpiAnalytics';
import { computeAvgDeliveryHours } from '../../utils/kpi';
import { canSeeGlobalFinancials, canSeeSiteFinancials } from '../../utils/permissions';
import { KpiPeriodSelector } from './KpiPeriodSelector';
import { KpiVolumeWidget } from './KpiVolumeWidget';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Users,
  Building2,
  Banknote,
  ArrowUpRight,
} from 'lucide-react';

interface KpiDashboardProps {
  factories: Factory[];
  supplyLinks: SupplyLink[];
  products: Product[];
  salesManagers: SalesManager[];
  currentUser?: User | null;
  onSelectShipment: (shipment: SupplyLink) => void;
}

export const KpiDashboard: React.FC<KpiDashboardProps> = ({
  factories,
  supplyLinks,
  products,
  salesManagers,
  currentUser,
  onSelectShipment,
}) => {
  const { t, locale, localeTag } = useI18n();
  const [period, setPeriod] = useState<PeriodFilterState>(() => defaultPeriodFilter());
  const factoryMap = useMemo(() => new Map(factories.map(f => [f.id, f])), [factories]);

  const analytics = useMemo(
    () =>
      computeKpiAnalytics(
        supplyLinks,
        factories,
        products,
        salesManagers,
        period,
        locale,
        {
          unassignedManager: t('dashboard.unassignedManager'),
          otherProduct: t('common.other'),
        },
        currentUser,
      ),
    [supplyLinks, factories, products, salesManagers, period, locale, t, currentUser],
  );

  const filteredLinks = useMemo(
    () => filterOwnKpiShipments(supplyLinks, period, currentUser),
    [supplyLinks, period, currentUser],
  );

  const operationalStats = useMemo(() => {
    const enRoute = filteredLinks.filter(s => s.status === 'en_route').length;
    const delayed = filteredLinks.filter(s => s.status === 'delayed').length;
    const arrived = filteredLinks.filter(s => s.status === 'arrived').length;
    return {
      enRoute,
      delayed,
      arrived,
      avgDeliveryHours: computeAvgDeliveryHours(filteredLinks),
    };
  }, [filteredLinks]);

  const delayedList = useMemo(
    () => filteredLinks.filter(s => s.status === 'delayed'),
    [filteredLinks],
  );

  const periodLabel = formatKpiPeriodLabel(period, locale, {
    customRange: t('dashboard.periodCustomRange'),
    year: (y) => t('dashboard.periodYear', { year: y }),
    quarter: (q, y) => t('dashboard.periodQuarter', { quarter: q, year: y }),
    week: (w, y) => t('dashboard.periodWeek', { week: w, year: y }),
  });
  const canPreviewMoney = Boolean(
    currentUser &&
    (canSeeGlobalFinancials(currentUser.role) ||
      canSeeSiteFinancials(currentUser.role) ||
      currentUser.role === 'manager'),
  );

  return (
    <div className="kpi-dashboard-page p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-slate-950 min-h-full text-slate-100">

      <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>{t('dashboard.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
            <p className="text-[11px] text-emerald-400/90 mt-2 font-medium">{t('dashboard.ownDataOnly')}</p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <KpiPeriodSelector period={period} onChange={setPeriod} />
            <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('dashboard.periodLabel', { period: periodLabel })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.totalShipments')}</span>
            <Truck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            {analytics.totalShipments.toLocaleString(localeTag)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">{t('dashboard.totalShipmentsHint')}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.totalVolume')}</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            {(analytics.totalVolume / 1000).toLocaleString(localeTag, { maximumFractionDigits: 1 })} {t('common.thousandTons')}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">{t('dashboard.volumeOwnHint')}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.active')}</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            {operationalStats.enRoute}
            <span className="text-xs text-slate-400 font-normal ml-1">
              {t('common.of')} {analytics.totalShipments}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">{t('dashboard.speed')}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.delays')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 tracking-tight">
            {operationalStats.delayed}
            {analytics.totalShipments > 0 && (
              <span className="text-xs text-slate-400 font-normal ml-1">
                ({((operationalStats.delayed / analytics.totalShipments) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-amber-400/80 font-medium">{t('dashboard.delaysHint')}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.avgDelivery')}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            {operationalStats.avgDeliveryHours} {t('common.hours')}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">{t('dashboard.scheduleCompliance')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <KpiVolumeWidget
          title={t('dashboard.widgetManagers')}
          icon={Users}
          iconClassName="text-violet-400"
          rows={analytics.byManager}
          emptyLabel={t('dashboard.emptyManagers')}
          barClassName="from-violet-500 to-fuchsia-400"
        />

        <KpiVolumeWidget
          title={t('dashboard.widgetProducts')}
          icon={Package}
          iconClassName="text-indigo-400"
          rows={analytics.byProduct}
          emptyLabel={t('dashboard.emptyProducts')}
          barClassName="from-indigo-500 to-emerald-400"
        />

        <KpiVolumeWidget
          title={t('dashboard.widgetOurSites')}
          icon={Building2}
          iconClassName="text-emerald-400"
          rows={analytics.byOurSite}
          emptyLabel={t('dashboard.emptyOurSites')}
          barClassName="from-emerald-500 to-cyan-400"
        />
      </div>

      <div className="bg-slate-900 border border-dashed border-slate-700 p-5 rounded-2xl shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span>{t('dashboard.moneyModuleTitle')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl">{t('dashboard.moneyModuleHint')}</p>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-slate-500 border border-slate-700 rounded-lg px-2 py-1 shrink-0">
            {t('dashboard.comingSoon')}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {canPreviewMoney ? (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">{t('dashboard.moneyModulePreview')}</div>
              <div className="mt-2 text-xl font-bold text-slate-300">
                {analytics.totalAmount > 0
                  ? analytics.totalAmount.toLocaleString(localeTag, { maximumFractionDigits: 0 })
                  : '—'}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex items-center">
              <p className="text-xs text-slate-500 italic">{t('dashboard.moneyModuleRestricted')}</p>
            </div>
          )}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex items-center">
            <p className="text-xs text-slate-500 italic">{t('dashboard.moneyModuleFuture')}</p>
          </div>
        </div>
      </div>

      {delayedList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{t('dashboard.delaysTitle', { count: delayedList.length })}</span>
            </h3>
            <span className="text-xs text-slate-400">{t('dashboard.delaysAction')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {delayedList.map(s => {
              const orig = factoryMap.get(s.origin_id);
              const dest = factoryMap.get(s.destination_id);
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectShipment(s)}
                  className="p-3.5 bg-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-xl transition-colors cursor-pointer flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>{s.cargo_type}</span>
                      <span className="text-slate-400 font-normal">({s.volume} {s.unit})</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {orig?.name || t('common.pointA')} &rarr; {dest?.name || t('common.pointB')}
                    </div>
                    <div className="text-amber-300 text-[11px] pt-1">
                      {t('dashboard.reasonLabel', { reason: s.delay_reason || t('dashboard.defaultDelayReason') })}
                    </div>
                  </div>
                  <button className="px-2.5 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-lg text-[10px] font-semibold border border-amber-500/30 shrink-0 flex items-center gap-1">
                    <span>{t('common.details')}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
