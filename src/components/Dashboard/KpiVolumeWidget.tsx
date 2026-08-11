import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { VolumeBreakdownRow } from '../../utils/kpiAnalytics';

interface KpiVolumeWidgetProps {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  rows: VolumeBreakdownRow[];
  emptyLabel: string;
  barClassName?: string;
  showShipmentCount?: boolean;
}

export const KpiVolumeWidget: React.FC<KpiVolumeWidgetProps> = ({
  title,
  icon: Icon,
  iconClassName = 'text-indigo-400',
  rows,
  emptyLabel,
  barClassName = 'from-indigo-500 to-emerald-400',
  showShipmentCount = true,
}) => {
  const { t, localeTag } = useI18n();

  const maxVolume = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.volume), 0) || 1,
    [rows],
  );

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${iconClassName}`} />
          <span className="truncate">{title}</span>
        </h3>
        <span className="text-[10px] text-slate-500 shrink-0">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 italic flex-1">{emptyLabel}</p>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-80 pr-1 flex-1">
          {rows.map(row => {
            const pct = Math.round((row.volume / maxVolume) * 100);
            return (
              <div key={row.id} className="space-y-1 text-xs">
                <div className="flex items-start justify-between gap-2 text-slate-300">
                  <span className="font-medium leading-snug">{row.label}</span>
                  <span className="font-bold text-white shrink-0 text-right">
                    {row.volume.toLocaleString(localeTag)} {t('common.tons')}
                    {showShipmentCount && (
                      <span className="block text-[10px] font-normal text-slate-400">
                        {t('dashboard.shipmentCountShort', { count: row.shipmentCount })}
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${barClassName} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
