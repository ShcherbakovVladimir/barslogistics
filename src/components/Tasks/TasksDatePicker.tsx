import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { getAppViewportRect } from '../../utils/viewport';

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
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
  const [panelPos, setPanelPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const selected = parseYmd(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? new Date()));

  const weekdays = locale === 'en' ? WEEKDAYS_EN : WEEKDAYS_RU;
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const todayYmd = toYmd(new Date());

  const displayLabel = useMemo(() => {
    if (!selected) return placeholder || t('tasks.dueDatePlaceholder');
    try {
      return selected.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  }, [selected, placeholder, t, locale, value]);

  const monthLabel = useMemo(() => {
    try {
      return viewMonth.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return `${viewMonth.getMonth() + 1}.${viewMonth.getFullYear()}`;
    }
  }, [viewMonth, locale]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const { top: vTop, left: vLeft, width: vWidth, height: vHeight } = getAppViewportRect();
      const width = Math.min(Math.max(rect.width, 280), vWidth - 16);
      let left = rect.left;
      if (left + width > vLeft + vWidth - 8) left = vLeft + vWidth - 8 - width;
      left = Math.max(vLeft + 8, left);
      const panelH = 320;
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (selected) setViewMonth(startOfMonth(selected));
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, panelId, selected]);

  const pick = (date: Date) => {
    onChange(toYmd(date));
    setOpen(false);
  };

  const panel = open && panelPos ? createPortal(
    <div
      id={panelId}
      className="tasks-date-picker-panel"
      style={{ left: panelPos.left, top: panelPos.top, width: panelPos.width }}
      role="dialog"
      aria-label={t('tasks.dueDate')}
    >
      <div className="tasks-date-picker-nav">
        <button type="button" className="tasks-date-picker-nav-btn" onClick={() => setViewMonth(m => addMonths(m, -1))} aria-label={t('common.back')}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="tasks-date-picker-month">{monthLabel}</div>
        <button type="button" className="tasks-date-picker-nav-btn" onClick={() => setViewMonth(m => addMonths(m, 1))} aria-label={t('common.scrollNext')}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
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
        <Calendar className="w-3.5 h-3.5 shrink-0 text-indigo-400" aria-hidden />
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
