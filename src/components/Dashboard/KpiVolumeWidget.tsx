import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { VolumeBreakdownRow } from '../../utils/kpiAnalytics';

type KpiWidgetTone = 'violet' | 'indigo' | 'emerald';

interface KpiVolumeWidgetProps {
  title: string;
  icon: LucideIcon;
  tone?: KpiWidgetTone;
  rows: VolumeBreakdownRow[];
  emptyLabel: string;
  showShipmentCount?: boolean;
}

export const KpiVolumeWidget: React.FC<KpiVolumeWidgetProps> = ({
  title,
  icon: Icon,
  tone = 'indigo',
  rows,
  emptyLabel,
  showShipmentCount = true,
}) => {
  const { t, localeTag } = useI18n();

  const maxVolume = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.volume), 0) || 1,
    [rows],
  );

  return (
    <section className={`kpi-widget kpi-widget--${tone}`}>
      <div className="kpi-widget-head">
        <h2 className="kpi-widget-title">
          <span className="kpi-widget-icon" aria-hidden>
            <Icon />
          </span>
          <span className="truncate">{title}</span>
        </h2>
        <span className="kpi-widget-count">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="kpi-widget-empty">{emptyLabel}</p>
      ) : (
        <div className="kpi-widget-list theme-scrollbar">
          {rows.map(row => {
            const pct = Math.round((row.volume / maxVolume) * 100);
            return (
              <div key={row.id} className="kpi-widget-row">
                <div className="kpi-widget-row-top">
                  <span className="kpi-widget-row-label">{row.label}</span>
                  <span className="kpi-widget-row-value">
                    {row.volume.toLocaleString(localeTag)} {t('common.tons')}
                    {showShipmentCount && (
                      <span className="kpi-widget-row-meta">
                        {t('dashboard.shipmentCountShort', { count: row.shipmentCount })}
                      </span>
                    )}
                  </span>
                </div>
                <div className="kpi-widget-bar" aria-hidden>
                  <div className="kpi-widget-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
