import React, { useMemo } from 'react';
import type { PeriodFilterState } from '../../types';
import { useI18n } from '../../i18n';
import { SearchableSelect } from '../UI/SearchableSelect';

interface KpiPeriodSelectorProps {
  period: PeriodFilterState;
  onChange: (period: PeriodFilterState) => void;
}

export const KpiPeriodSelector: React.FC<KpiPeriodSelectorProps> = ({ period, onChange }) => {
  const { t, localeTag } = useI18n();
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(
    () => Array.from({ length: 8 }, (_, i) => {
      const y = currentYear - i + 1;
      return { value: String(y), label: String(y) };
    }),
    [currentYear],
  );

  const periodValueOptions = useMemo(() => {
    const year = period.year ?? currentYear;
    if (period.granularity === 'quarter') {
      return [1, 2, 3, 4].map(q => ({ value: String(q), label: t('mapFilter.quarterN', { n: q }) }));
    }
    if (period.granularity === 'month') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const label = new Intl.DateTimeFormat(localeTag, { month: 'long' }).format(new Date(year, i, 1));
        return { value: String(m), label };
      });
    }
    if (period.granularity === 'week') {
      return Array.from({ length: 52 }, (_, i) => ({
        value: String(i + 1),
        label: t('mapFilter.weekN', { n: i + 1 }),
      }));
    }
    return [];
  }, [period.granularity, period.year, currentYear, t, localeTag]);

  return (
    <div className="kpi-period-selector">
      <div className="kpi-period-granularity" role="group">
        {(['year', 'quarter', 'month', 'week'] as const).map(g => {
          const active = period.granularity === g && period.mode === 'preset';
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange({
                ...period,
                mode: 'preset',
                granularity: g,
                year: period.year ?? currentYear,
                value: 1,
              })}
              className={`kpi-period-granularity-btn${active ? ' is-active' : ''}`}
            >
              {t(`mapFilter.granularity.${g}`)}
            </button>
          );
        })}
      </div>

      <div className="kpi-period-selects">
        <div className="kpi-period-select kpi-period-select--year">
          <SearchableSelect
            value={String(period.year ?? currentYear)}
            onChange={v => onChange({ ...period, year: Number(v) })}
            options={yearOptions}
            searchable={false}
            className="w-full"
            panelClassName="shipments-list-dropdown-panel"
            listClassName="shipment-events-scroll"
          />
        </div>
        {period.granularity !== 'year' && (
          <div className="kpi-period-select kpi-period-select--value">
            <SearchableSelect
              value={String(period.value ?? 1)}
              onChange={v => onChange({ ...period, value: Number(v) })}
              options={periodValueOptions}
              searchable={period.granularity === 'week'}
              className="w-full"
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>
        )}
      </div>
    </div>
  );
};
