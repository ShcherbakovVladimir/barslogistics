import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { getAppViewportRect } from '../../utils/viewport';

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const PANEL_MIN_WIDTH = 168;
const PANEL_PREFERRED_WIDTH = 176;
const YEARS_PER_PAGE = 12;

type PanelView = 'days' | 'months' | 'years';

/** Parse `YYYY-MM-DDTHH:mm` (datetime-local) into local Date parts. */
function parseLocalDateTime(value: string): { date: Date; hours: number; minutes: number } | null {
  if (!value?.trim()) return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hours = Number(m[4]);
  const minutes = Number(m[5]);
  const date = new Date(y, mo - 1, d, hours, minutes);
  if (
    date.getFullYear() !== y
    || date.getMonth() !== mo - 1
    || date.getDate() !== d
  ) {
    return null;
  }
  return { date, hours, minutes };
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalDateTimeValue(date: Date, hours: number, minutes: number): string {
  return `${toYmd(date)}T${pad2(hours)}:${pad2(minutes)}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildMonthGrid(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const startPad = (first.getDay() + 6) % 7;
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

export interface ShipmentDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

export const ShipmentDateTimePicker: React.FC<ShipmentDateTimePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}) => {
  const { t, locale, localeTag } = useI18n();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('days');
  const [panelPos, setPanelPos] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    placement: 'below' | 'above';
  } | null>(null);

  const parsed = parseLocalDateTime(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parsed?.date ?? new Date()));
  const [draftDate, setDraftDate] = useState<Date | null>(() => parsed?.date ?? null);
  const [hours, setHours] = useState(() => parsed?.hours ?? 12);
  const [minutes, setMinutes] = useState(() => parsed?.minutes ?? 0);

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
    if (!parsed) return placeholder || t('shipmentLogistics.dateTimePlaceholder');
    try {
      return parsed.date.toLocaleString(localeTag, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  }, [parsed, placeholder, t, localeTag, value]);

  const monthTitle = useMemo(() => {
    try {
      return viewMonth.toLocaleDateString(localeCode, { month: 'long' });
    } catch {
      return monthNames[viewMonth.getMonth()];
    }
  }, [viewMonth, localeCode, monthNames]);

  const yearTitle = String(viewMonth.getFullYear());
  const yearsRangeLabel = `${yearStart} – ${yearStart + YEARS_PER_PAGE - 1}`;

  useEffect(() => {
    if (!open) return;
    const next = parseLocalDateTime(value);
    setDraftDate(next?.date ?? null);
    setHours(next?.hours ?? 12);
    setMinutes(next?.minutes ?? 0);
    setViewMonth(startOfMonth(next?.date ?? new Date()));
    setPanelView('days');
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const PANEL_GAP = 6;
    const VIEWPORT_PAD = 8;
    const PREFERRED_H = panelView === 'days' ? 250 : 200;
    const MIN_H = 160;

    const compute = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const { top: vTop, left: vLeft, width: vWidth, height: vHeight } = getAppViewportRect();
      const vBottom = vTop + vHeight;

      const width = Math.min(
        Math.max(PANEL_MIN_WIDTH, PANEL_PREFERRED_WIDTH),
        Math.max(PANEL_MIN_WIDTH, vWidth - VIEWPORT_PAD * 2),
      );
      let left = rect.left;
      if (left + width > vLeft + vWidth - VIEWPORT_PAD) {
        left = vLeft + vWidth - VIEWPORT_PAD - width;
      }
      left = Math.max(vLeft + VIEWPORT_PAD, left);

      const spaceBelow = vBottom - VIEWPORT_PAD - rect.bottom - PANEL_GAP;
      const spaceAbove = rect.top - PANEL_GAP - (vTop + VIEWPORT_PAD);
      const placement: 'below' | 'above' = spaceBelow >= spaceAbove ? 'below' : 'above';
      const available = Math.max(MIN_H, placement === 'below' ? spaceBelow : spaceAbove);
      const maxHeight = Math.min(PREFERRED_H, available, vHeight - VIEWPORT_PAD * 2);

      let top = placement === 'below'
        ? rect.bottom + PANEL_GAP
        : rect.top - PANEL_GAP - maxHeight;

      top = Math.max(vTop + VIEWPORT_PAD, Math.min(top, vBottom - VIEWPORT_PAD - maxHeight));

      setPanelPos({ left, top, width, maxHeight, placement });
    };

    compute();
    const vv = window.visualViewport;
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    vv?.addEventListener('resize', compute);
    vv?.addEventListener('scroll', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
      vv?.removeEventListener('resize', compute);
      vv?.removeEventListener('scroll', compute);
    };
  }, [open, panelView]);

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

  const applyValue = (date: Date, h: number, min: number) => {
    onChange(toLocalDateTimeValue(date, h, min));
  };

  const pickDay = (date: Date) => {
    setDraftDate(date);
    applyValue(date, hours, minutes);
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
    if (panelView === 'days') setViewMonth((m) => addMonths(m, dir));
    else if (panelView === 'months') setViewMonth((m) => new Date(m.getFullYear() + dir, m.getMonth(), 1));
    else setViewMonth((m) => new Date(m.getFullYear() + dir * YEARS_PER_PAGE, m.getMonth(), 1));
  };

  const commitTime = (h: number, min: number) => {
    const safeH = Math.min(23, Math.max(0, h));
    const safeM = Math.min(59, Math.max(0, min));
    setHours(safeH);
    setMinutes(safeM);
    if (draftDate) applyValue(draftDate, safeH, safeM);
  };

  const setNow = () => {
    const now = new Date();
    const h = now.getHours();
    const min = now.getMinutes();
    setDraftDate(now);
    setHours(h);
    setMinutes(min);
    setViewMonth(startOfMonth(now));
    setPanelView('days');
    applyValue(now, h, min);
    setOpen(false);
  };

  const clear = () => {
    setDraftDate(null);
    onChange('');
    setOpen(false);
  };

  const selectedYmd = draftDate ? toYmd(draftDate) : (parsed ? toYmd(parsed.date) : '');
  const selectedMonth = (draftDate ?? parsed?.date)?.getMonth();
  const selectedYear = (draftDate ?? parsed?.date)?.getFullYear();

  const panel = open && panelPos ? createPortal(
    <div
      id={panelId}
      className={`shipment-datetime-picker-panel is-viewport-clamped shipment-datetime-picker-panel--${panelPos.placement}`}
      style={{
        left: panelPos.left,
        top: panelPos.top,
        width: panelPos.width,
        maxHeight: panelPos.maxHeight,
      }}
      role="dialog"
      aria-label={ariaLabel || t('shipmentLogistics.dateTimePlaceholder')}
    >
      <div className="shipment-datetime-picker-nav">
        <button
          type="button"
          className="shipment-datetime-picker-nav-btn"
          onClick={() => stepNav(-1)}
          aria-label={t('common.back')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="shipment-datetime-picker-title">
          {panelView === 'days' && (
            <>
              <button
                type="button"
                className="shipment-datetime-picker-title-btn"
                onClick={() => setPanelView('months')}
                aria-label={t('shipmentLogistics.pickMonth')}
              >
                <span className="capitalize">{monthTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
              <button
                type="button"
                className="shipment-datetime-picker-title-btn"
                onClick={() => setPanelView('years')}
                aria-label={t('shipmentLogistics.pickYear')}
              >
                <span>{yearTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
            </>
          )}
          {panelView === 'months' && (
            <button
              type="button"
              className="shipment-datetime-picker-title-btn"
              onClick={() => setPanelView('years')}
              aria-label={t('shipmentLogistics.pickYear')}
            >
              <span>{yearTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
            </button>
          )}
          {panelView === 'years' && (
            <div className="shipment-datetime-picker-month">{yearsRangeLabel}</div>
          )}
        </div>

        <button
          type="button"
          className="shipment-datetime-picker-nav-btn"
          onClick={() => stepNav(1)}
          aria-label={t('common.scrollNext')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {panelView === 'days' && (
        <>
          <div className="shipment-datetime-picker-weekdays">
            {weekdays.map((d) => <span key={d}>{d}</span>)}
          </div>

          <div className="shipment-datetime-picker-grid">
            {cells.map((day, idx) => {
              if (!day) return <span key={`e-${idx}`} className="shipment-datetime-picker-day is-empty" />;
              const ymd = toYmd(day);
              const isSelected = selectedYmd === ymd;
              const isToday = ymd === todayYmd;
              return (
                <button
                  key={ymd}
                  type="button"
                  className={`shipment-datetime-picker-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                  onClick={() => pickDay(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="shipment-datetime-picker-time">
            <span className="shipment-datetime-picker-time-label">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              {t('shipmentLogistics.time')}
            </span>
            <div className="shipment-datetime-picker-time-fields">
              <label className="shipment-datetime-picker-time-field">
                <span>{t('shipmentLogistics.hours')}</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hours}
                  onChange={(e) => commitTime(Number(e.target.value) || 0, minutes)}
                />
              </label>
              <span className="shipment-datetime-picker-time-sep" aria-hidden>:</span>
              <label className="shipment-datetime-picker-time-field">
                <span>{t('shipmentLogistics.minutes')}</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={minutes}
                  onChange={(e) => commitTime(hours, Number(e.target.value) || 0)}
                />
              </label>
            </div>
          </div>
        </>
      )}

      {panelView === 'months' && (
        <div className="shipment-datetime-picker-period-grid">
          {monthNames.map((name, idx) => {
            const isSelected = selectedYear === viewMonth.getFullYear() && selectedMonth === idx;
            const isCurrent = new Date().getFullYear() === viewMonth.getFullYear() && new Date().getMonth() === idx;
            return (
              <button
                key={name}
                type="button"
                className={`shipment-datetime-picker-period${isSelected ? ' is-selected' : ''}${isCurrent ? ' is-today' : ''}`}
                onClick={() => pickMonth(idx)}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {panelView === 'years' && (
        <div className="shipment-datetime-picker-period-grid">
          {years.map((year) => {
            const isSelected = selectedYear === year;
            const isCurrent = new Date().getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                className={`shipment-datetime-picker-period${isSelected ? ' is-selected' : ''}${isCurrent ? ' is-today' : ''}`}
                onClick={() => pickYear(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      <div className="shipment-datetime-picker-footer">
        <button type="button" className="shipment-datetime-picker-footer-btn" onClick={setNow}>
          {t('shipmentLogistics.dateTimeNow')}
        </button>
        <button type="button" className="shipment-datetime-picker-footer-btn" onClick={clear}>
          {t('shipmentLogistics.dateTimeClear')}
        </button>
        <button
          type="button"
          className="shipment-datetime-picker-footer-btn is-primary"
          onClick={() => setOpen(false)}
        >
          {t('common.close')}
        </button>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="shipment-datetime-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        className={`shipment-datetime-picker-trigger${open ? ' is-open' : ''}${!value ? ' is-placeholder' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0 shipment-datetime-picker-icon" aria-hidden />
        <span className="truncate flex-1 text-left">{displayLabel}</span>
        {value ? (
          <span
            role="button"
            tabIndex={-1}
            className="shipment-datetime-picker-clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            aria-label={t('shipmentLogistics.dateTimeClear')}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : null}
      </button>
      {panel}
    </div>
  );
};
