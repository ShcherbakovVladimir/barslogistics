import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { getAppViewportRect } from '../../utils/viewport';

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const PANEL_MIN_WIDTH = 160;
const PANEL_PREFERRED_WIDTH = 172;
const YEARS_PER_PAGE = 12;

type PanelView = 'days' | 'months' | 'years';

function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y == null || m == null || d == null) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Monday-based calendar cells for a month view. */
function buildMonthGrid(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const startPad = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function yearPageStart(year: number): number {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

export interface TasksDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const TasksDatePicker: React.FC<TasksDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  id,
}) => {
  const { t, locale } = useI18n();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('days');
  const [panelPos, setPanelPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const selected = parseYmd(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? new Date()));

  const weekdays = locale === 'en' ? WEEKDAYS_EN : WEEKDAYS_RU;
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const todayYmd = toYmd(new Date());
  const localeCode = locale === 'en' ? 'en-GB' : 'ru-RU';

  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      try {
        return new Date(2020, i, 1).toLocaleDateString(localeCode, { month: 'short' });
      } catch {
        return String(i + 1);
      }
    });
  }, [localeCode]);

  const yearStart = yearPageStart(viewMonth.getFullYear());
  const years = useMemo(
    () => Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearStart + i),
    [yearStart],
  );

  const displayLabel = useMemo(() => {
    if (!selected) return placeholder || t('tasks.dueDatePlaceholder');
    try {
      return selected.toLocaleDateString(localeCode, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  }, [selected, placeholder, t, localeCode, value]);

  const monthTitle = useMemo(() => {
    try {
      return viewMonth.toLocaleDateString(localeCode, { month: 'long' });
    } catch {
      return monthNames[viewMonth.getMonth()];
    }
  }, [viewMonth, localeCode, monthNames]);

  const yearTitle = String(viewMonth.getFullYear());
  const yearsRangeLabel = `${yearStart} – ${yearStart + YEARS_PER_PAGE - 1}`;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const { top: vTop, left: vLeft, width: vWidth, height: vHeight } = getAppViewportRect();
      const width = Math.min(
        Math.max(PANEL_MIN_WIDTH, PANEL_PREFERRED_WIDTH),
        Math.max(PANEL_MIN_WIDTH, vWidth - 16),
      );
      let left = rect.left;
      if (left + width > vLeft + vWidth - 8) left = vLeft + vWidth - 8 - width;
      left = Math.max(vLeft + 8, left);
      const panelH = panelView === 'days' ? 220 : 180;
      const below = rect.bottom + 6;
      const above = rect.top - 6 - panelH;
      const top = below + panelH <= vTop + vHeight - 8 ? below : Math.max(vTop + 8, above);
      setPanelPos({ left, top, width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, panelView]);

  useEffect(() => {
    if (!open) return;
    if (selected) setViewMonth(startOfMonth(selected));
    setPanelView('days');
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanelView((view) => {
          if (view === 'years') return 'months';
          if (view === 'months') return 'days';
          setOpen(false);
          return view;
        });
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, panelId]);

  const pick = (date: Date) => {
    onChange(toYmd(date));
    setOpen(false);
  };

  const pickMonth = (monthIndex: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), monthIndex, 1));
    setPanelView('days');
  };

  const pickYear = (year: number) => {
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
    setPanelView('months');
  };

  const stepNav = (dir: -1 | 1) => {
    if (panelView === 'days') setViewMonth(m => addMonths(m, dir));
    else if (panelView === 'months') setViewMonth(m => new Date(m.getFullYear() + dir, m.getMonth(), 1));
    else setViewMonth(m => new Date(m.getFullYear() + dir * YEARS_PER_PAGE, m.getMonth(), 1));
  };

  const selectedMonth = selected?.getMonth();
  const selectedYear = selected?.getFullYear();

  const panel = open && panelPos ? createPortal(
    <div
      id={panelId}
      className="tasks-date-picker-panel"
      style={{ left: panelPos.left, top: panelPos.top, width: panelPos.width }}
      role="dialog"
      aria-label={t('tasks.dueDate')}
    >
      <div className="tasks-date-picker-nav">
        <button type="button" className="tasks-date-picker-nav-btn" onClick={() => stepNav(-1)} aria-label={t('common.back')}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="tasks-date-picker-title">
          {panelView === 'days' && (
            <>
              <button
                type="button"
                className="tasks-date-picker-title-btn"
                onClick={() => setPanelView('months')}
                aria-label={t('tasks.pickMonth')}
              >
                <span className="capitalize">{monthTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
              <button
                type="button"
                className="tasks-date-picker-title-btn"
                onClick={() => setPanelView('years')}
                aria-label={t('tasks.pickYear')}
              >
                <span>{yearTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
            </>
          )}
          {panelView === 'months' && (
            <button
              type="button"
              className="tasks-date-picker-title-btn"
              onClick={() => setPanelView('years')}
              aria-label={t('tasks.pickYear')}
            >
              <span>{yearTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
            </button>
          )}
          {panelView === 'years' && (
            <div className="tasks-date-picker-month">{yearsRangeLabel}</div>
          )}
        </div>
        <button type="button" className="tasks-date-picker-nav-btn" onClick={() => stepNav(1)} aria-label={t('common.scrollNext')}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {panelView === 'days' && (
        <>
          <div className="tasks-date-picker-weekdays">
            {weekdays.map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="tasks-date-picker-grid">
            {cells.map((day, idx) => {
              if (!day) return <span key={`e-${idx}`} className="tasks-date-picker-day is-empty" />;
              const ymd = toYmd(day);
              const isSelected = value === ymd;
              const isToday = ymd === todayYmd;
              return (
                <button
                  key={ymd}
                  type="button"
                  className={`tasks-date-picker-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                  onClick={() => pick(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}

      {panelView === 'months' && (
        <div className="tasks-date-picker-period-grid">
          {monthNames.map((name, idx) => {
            const isSelected = selectedYear === viewMonth.getFullYear() && selectedMonth === idx;
            const isCurrent = new Date().getFullYear() === viewMonth.getFullYear() && new Date().getMonth() === idx;
            return (
              <button
                key={name}
                type="button"
                className={`tasks-date-picker-period${isSelected ? ' is-selected' : ''}${isCurrent ? ' is-today' : ''}`}
                onClick={() => pickMonth(idx)}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {panelView === 'years' && (
        <div className="tasks-date-picker-period-grid">
          {years.map((year) => {
            const isSelected = selectedYear === year;
            const isCurrent = new Date().getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                className={`tasks-date-picker-period${isSelected ? ' is-selected' : ''}${isCurrent ? ' is-today' : ''}`}
                onClick={() => pickYear(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      <div className="tasks-date-picker-footer">
        <button type="button" className="tasks-date-picker-footer-btn" onClick={() => pick(new Date())}>
          {t('tasks.dueToday')}
        </button>
        {!required ? (
          <button
            type="button"
            className="tasks-date-picker-footer-btn"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {t('tasks.clearDueDate')}
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="tasks-date-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        className={`tasks-date-picker-trigger${open ? ' is-open' : ''}${!value ? ' is-placeholder' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen(v => !v)}
      >
        <Calendar className="tasks-date-picker-trigger-icon" aria-hidden />
        <span className="truncate flex-1 text-left">{displayLabel}</span>
        {value && !required ? (
          <span
            role="button"
            tabIndex={-1}
            className="tasks-date-picker-clear"
            onClick={e => {
              e.stopPropagation();
              onChange('');
            }}
            aria-label={t('tasks.clearDueDate')}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : null}
      </button>
      {panel}
    </div>
  );
};

/** Normalize API / draft due dates to YYYY-MM-DD for inputs. */
export function normalizeDueDate(raw: string | null | undefined): string {
  if (!raw) return '';
  const s = String(raw).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return parseYmd(s) ? s : '';
  // ISO datetime
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const ymd = s.slice(0, 10);
    return parseYmd(ymd) ? ymd : '';
  }
  // Legacy broken Date.toString().slice(0,10) like "Wed Aug 05" — unrecoverable
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return toYmd(d);
  }
  return '';
}

export function formatDueDateLabel(raw: string, locale: string): string {
  const d = parseYmd(raw);
  if (!d) return raw;
  try {
    return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return raw;
  }
}

export function isDueDateOverdue(due: string | null | undefined, done: boolean): boolean {
  if (!due || done) return false;
  const ymd = normalizeDueDate(due);
  if (!ymd) return false;
  return ymd < toYmd(new Date());
}

export function isDueDateToday(due: string | null | undefined): boolean {
  const ymd = normalizeDueDate(due);
  return Boolean(ymd && ymd === toYmd(new Date()));
}
