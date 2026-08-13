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
import accountBackgroundWebp from '../../../assets/img/Background.webp';
import accountBackgroundJpg from '../../../assets/img/Background.jpg';
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
    <div className="kpi-dashboard-page">
      <picture className="account-page-bg" aria-hidden>
        <source srcSet={accountBackgroundWebp} type="image/webp" />
        <img
          src={accountBackgroundJpg}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      </picture>
      <div className="kpi-dashboard-inner">
      <header className="kpi-toolbar">
        <div className="kpi-toolbar-head">
          <span className="kpi-toolbar-icon" aria-hidden>
            <BarChart3 />
          </span>
          <div className="kpi-toolbar-text">
            <h1 className="kpi-title">{t('dashboard.title')}</h1>
            <p className="kpi-subtitle">{t('dashboard.subtitle')}</p>
            <p className="kpi-own-hint">{t('dashboard.ownDataOnly')}</p>
          </div>
        </div>
        <div className="kpi-toolbar-controls">
          <KpiPeriodSelector period={period} onChange={setPeriod} />
          <div className="kpi-period-chip">
            <Clock aria-hidden />
            <span>{t('dashboard.periodLabel', { period: periodLabel })}</span>
          </div>
        </div>
      </header>

      <div className="kpi-stat-grid">
        <article className="kpi-stat-card">
          <div className="kpi-stat-label">
            <span>{t('dashboard.totalShipments')}</span>
            <Truck aria-hidden />
          </div>
          <div className="kpi-stat-value">
            {analytics.totalShipments.toLocaleString(localeTag)}
          </div>
          <div className="kpi-stat-hint">{t('dashboard.totalShipmentsHint')}</div>
        </article>

        <article className="kpi-stat-card">
          <div className="kpi-stat-label">
            <span>{t('dashboard.totalVolume')}</span>
            <Package aria-hidden />
          </div>
          <div className="kpi-stat-value">
            {(analytics.totalVolume / 1000).toLocaleString(localeTag, { maximumFractionDigits: 1 })}{' '}
            {t('common.thousandTons')}
          </div>
          <div className="kpi-stat-hint">{t('dashboard.volumeOwnHint')}</div>
        </article>

        <article className="kpi-stat-card">
          <div className="kpi-stat-label">
            <span>{t('dashboard.active')}</span>
            <TrendingUp aria-hidden />
          </div>
          <div className="kpi-stat-value">
            {operationalStats.enRoute}
            <span className="kpi-stat-value-sub">
              {t('common.of')} {analytics.totalShipments}
            </span>
          </div>
          <div className="kpi-stat-hint">{t('dashboard.speed')}</div>
        </article>

        <article className="kpi-stat-card kpi-stat-card--warn">
          <div className="kpi-stat-label">
            <span>{t('dashboard.delays')}</span>
            <AlertTriangle aria-hidden />
          </div>
          <div className="kpi-stat-value kpi-stat-value--warn">
            {operationalStats.delayed}
            {analytics.totalShipments > 0 && (
              <span className="kpi-stat-value-sub">
                ({((operationalStats.delayed / analytics.totalShipments) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="kpi-stat-hint kpi-stat-hint--warn">{t('dashboard.delaysHint')}</div>
        </article>

        <article className="kpi-stat-card">
          <div className="kpi-stat-label">
            <span>{t('dashboard.avgDelivery')}</span>
            <CheckCircle2 aria-hidden />
          </div>
          <div className="kpi-stat-value">
            {operationalStats.avgDeliveryHours} {t('common.hours')}
          </div>
          <div className="kpi-stat-hint">{t('dashboard.scheduleCompliance')}</div>
        </article>
      </div>

      <div className="kpi-widgets-grid">
        <KpiVolumeWidget
          title={t('dashboard.widgetManagers')}
          icon={Users}
          tone="violet"
          rows={analytics.byManager}
          emptyLabel={t('dashboard.emptyManagers')}
        />
        <KpiVolumeWidget
          title={t('dashboard.widgetProducts')}
          icon={Package}
          tone="indigo"
          rows={analytics.byProduct}
          emptyLabel={t('dashboard.emptyProducts')}
        />
        <KpiVolumeWidget
          title={t('dashboard.widgetOurSites')}
          icon={Building2}
          tone="emerald"
          rows={analytics.byOurSite}
          emptyLabel={t('dashboard.emptyOurSites')}
        />
      </div>

      <section className="kpi-card kpi-card--dashed">
        <div className="kpi-card-head-row">
          <div>
            <h2 className="kpi-card-title">
              <Banknote aria-hidden />
              <span>{t('dashboard.moneyModuleTitle')}</span>
            </h2>
            <p className="kpi-card-hint">{t('dashboard.moneyModuleHint')}</p>
          </div>
          <span className="kpi-coming-soon">{t('dashboard.comingSoon')}</span>
        </div>
        <div className="kpi-money-grid">
          {canPreviewMoney ? (
            <div className="kpi-money-tile">
              <div className="kpi-money-label">{t('dashboard.moneyModulePreview')}</div>
              <div className="kpi-money-value">
                {analytics.totalAmount > 0
                  ? analytics.totalAmount.toLocaleString(localeTag, { maximumFractionDigits: 0 })
                  : '—'}
              </div>
            </div>
          ) : (
            <div className="kpi-money-tile kpi-money-tile--muted">
              <p>{t('dashboard.moneyModuleRestricted')}</p>
            </div>
          )}
          <div className="kpi-money-tile kpi-money-tile--muted">
            <p>{t('dashboard.moneyModuleFuture')}</p>
          </div>
        </div>
      </section>

      {delayedList.length > 0 && (
        <section className="kpi-card">
          <div className="kpi-card-head-row">
            <h2 className="kpi-card-title">
              <AlertTriangle className="kpi-card-title-warn" aria-hidden />
              <span>{t('dashboard.delaysTitle', { count: delayedList.length })}</span>
            </h2>
            <span className="kpi-card-aside">{t('dashboard.delaysAction')}</span>
          </div>

          <div className="kpi-delay-grid">
            {delayedList.map(s => {
              const orig = factoryMap.get(s.origin_id);
              const dest = factoryMap.get(s.destination_id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectShipment(s)}
                  className="kpi-delay-card"
                >
                  <div className="kpi-delay-body">
                    <div className="kpi-delay-cargo">
                      <span className="kpi-delay-dot" aria-hidden />
                      <span>{s.cargo_type}</span>
                      <span className="kpi-delay-volume">
                        ({s.volume} {s.unit})
                      </span>
                    </div>
                    <div className="kpi-delay-route">
                      {orig?.name || t('common.pointA')} → {dest?.name || t('common.pointB')}
                    </div>
                    <div className="kpi-delay-reason">
                      {t('dashboard.reasonLabel', {
                        reason: s.delay_reason || t('dashboard.defaultDelayReason'),
                      })}
                    </div>
                  </div>
                  <span className="kpi-delay-action">
                    <span>{t('common.details')}</span>
                    <ArrowUpRight aria-hidden />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};
