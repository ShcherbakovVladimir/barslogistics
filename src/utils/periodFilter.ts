import type { PeriodFilterState } from '../types';

export function parseShipmentDate(link: { shipment_date?: string; period?: string }): Date | null {
  if (link.shipment_date) {
    const d = new Date(link.shipment_date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (link.period) {
    const year = parseInt(link.period, 10);
    if (!Number.isNaN(year)) return new Date(year, 6, 1);
  }
  return null;
}

function startOfWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getPeriodBounds(period: PeriodFilterState): { start: Date; end: Date } | null {
  if (period.mode === 'range') {
    if (!period.rangeStart || !period.rangeEnd) return null;
    const start = new Date(period.rangeStart);
    const end = new Date(period.rangeEnd);
    end.setHours(23, 59, 59, 999);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return { start, end };
  }

  const year = period.year ?? new Date().getFullYear();
  const v = period.value ?? 1;

  switch (period.granularity) {
    case 'year': {
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
    }
    case 'quarter': {
      const q = Math.max(1, Math.min(4, v));
      const startMonth = (q - 1) * 3;
      return {
        start: new Date(year, startMonth, 1),
        end: new Date(year, startMonth + 3, 0, 23, 59, 59, 999),
      };
    }
    case 'month': {
      const m = Math.max(1, Math.min(12, v));
      return {
        start: new Date(year, m - 1, 1),
        end: new Date(year, m, 0, 23, 59, 59, 999),
      };
    }
    case 'week': {
      const start = startOfWeek(year, Math.max(1, Math.min(53, v)));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default:
      return null;
  }
}

export function isDateInPeriod(date: Date, bounds: { start: Date; end: Date }): boolean {
  return date >= bounds.start && date <= bounds.end;
}

export function matchesPeriodFilter(
  link: { shipment_date?: string; period?: string },
  period: PeriodFilterState,
): boolean {
  const bounds = getPeriodBounds(period);
  if (!bounds) return true;
  const d = parseShipmentDate(link);
  if (!d) return false;
  return isDateInPeriod(d, bounds);
}

export function defaultPeriodFilter(): PeriodFilterState {
  const now = new Date();
  return {
    mode: 'preset',
    granularity: 'year',
    year: now.getFullYear(),
  };
}

/** Same period slot one calendar year earlier (YoY comparison). */
export function getPreviousYearPeriod(period: PeriodFilterState): PeriodFilterState {
  if (period.mode === 'range') {
    const shiftIso = (iso?: string): string | undefined => {
      if (!iso) return undefined;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    };
    return {
      ...period,
      rangeStart: shiftIso(period.rangeStart),
      rangeEnd: shiftIso(period.rangeEnd),
    };
  }
  const year = (period.year ?? new Date().getFullYear()) - 1;
  return { ...period, year };
}
