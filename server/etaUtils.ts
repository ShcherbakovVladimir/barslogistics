const RU_MONTHS: Record<string, number> = {
  янв: 0,
  фев: 1,
  мар: 2,
  апр: 3,
  май: 4,
  июн: 5,
  июл: 6,
  авг: 7,
  сен: 8,
  окт: 9,
  ноя: 10,
  дек: 11,
};

function monthFromToken(token: string): number | null {
  const key = token.replace(/\./g, "").slice(0, 3).toLowerCase();
  return RU_MONTHS[key] ?? null;
}

/** Best-effort parse of display ETA strings (ru locale, ISO, time-only). */
export function parseEtaToDate(eta: string, reference = new Date()): Date | null {
  const trimmed = eta.trim();
  if (!trimmed) return null;

  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return new Date(iso);

  const dayMonthTime = trimmed.match(/(\d{1,2})\s*([а-яё]+)\.?\s*,?\s*(\d{1,2}):(\d{2})/i);
  if (dayMonthTime) {
    const month = monthFromToken(dayMonthTime[2]);
    if (month != null) {
      const year = reference.getFullYear();
      const d = new Date(
        year,
        month,
        parseInt(dayMonthTime[1], 10),
        parseInt(dayMonthTime[3], 10),
        parseInt(dayMonthTime[4], 10),
        0,
        0,
      );
      if (d.getTime() - reference.getTime() > 180 * 86_400_000) {
        d.setFullYear(year - 1);
      }
      return d;
    }
  }

  const timeDayMonth = trimmed.match(/(\d{1,2}):(\d{2})\s*,?\s*(\d{1,2})\s*([а-яё]+)/i);
  if (timeDayMonth) {
    const month = monthFromToken(timeDayMonth[4]);
    if (month != null) {
      const year = reference.getFullYear();
      const d = new Date(
        year,
        month,
        parseInt(timeDayMonth[3], 10),
        parseInt(timeDayMonth[1], 10),
        parseInt(timeDayMonth[2], 10),
        0,
        0,
      );
      if (d.getTime() - reference.getTime() > 180 * 86_400_000) {
        d.setFullYear(year - 1);
      }
      return d;
    }
  }

  const timeOnly = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (timeOnly) {
    const d = new Date(reference);
    d.setSeconds(0, 0);
    d.setHours(parseInt(timeOnly[1], 10), parseInt(timeOnly[2], 10), 0, 0);
    if (d.getTime() < reference.getTime() - 60_000) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  return null;
}

const RU_ETA_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  day: 'numeric',
  month: 'short',
};

/** Human-readable ETA label stored in supply_links.eta */
export function formatEtaDisplay(date: Date, locale: 'ru' | 'en' = 'ru'): string {
  return date.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB', RU_ETA_FORMAT);
}

export function resolveEtaFields(
  etaInput: string | undefined | null,
  reference = new Date(),
): { eta: string | null; eta_at: Date | null } {
  if (!etaInput?.trim()) return { eta: null, eta_at: null };

  const trimmed = etaInput.trim();
  const isoMs = Date.parse(trimmed);
  const parsed = parseEtaToDate(trimmed, reference)
    ?? (Number.isNaN(isoMs) ? null : new Date(isoMs));

  if (parsed) {
    return { eta: formatEtaDisplay(parsed), eta_at: parsed };
  }

  return { eta: trimmed, eta_at: null };
}

export function resolveEtaInstant(
  etaAt?: string | Date | null,
  etaText?: string | null,
  reference = new Date(),
): Date | null {
  if (etaAt) {
    const d = etaAt instanceof Date ? etaAt : new Date(etaAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (etaText?.trim()) return parseEtaToDate(etaText, reference);
  return null;
}
