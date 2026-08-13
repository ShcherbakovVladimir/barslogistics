import type { ParsedAddress } from './types.js';

function clean(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function capture(match: RegExpMatchArray, index: number): string {
  return match[index] ?? '';
}

export function parseAddressComponents(raw: string): ParsedAddress {
  const address = clean(raw);
  if (!address) return { raw: '' };

  let station: string | undefined;
  const stationMatch = address.match(/станц(?:ия|\.)\s+([^,;]+)/i);
  if (stationMatch) station = clean(capture(stationMatch, 1));

  let region: string | undefined;
  const regionMatch = address.match(
    /^((?:[А-Яа-яЁё\s-]+(?:область|край|респ\.?|республика|АО|округ|автономная\s+область)))/i,
  );
  if (regionMatch) region = clean(capture(regionMatch, 1));

  let city: string | undefined;
  const cityPatterns = [
    /(?:^|[,\s])(?:г\.|город)\s*([^,;]+)/i,
    /(?:^|[,\s])(?:р\.?\s*п\.?|п\.?\s*г\.?\s*т\.?|пгт\.?|п\.|пос\.|посёлок|поселок)\s*([^,;]+)/i,
    /(?:^|[,\s])(?:с\.|село|д\.|дер\.)\s*([^,;]+)/i,
  ];
  for (const re of cityPatterns) {
    const m = address.match(re);
    if (m) {
      city = clean(capture(m, 1));
      break;
    }
  }
  if (!city && address.includes(',')) {
    const first = clean(address.split(',')[0] ?? '');
    if (first && !/\b(область|край|респ|округ)\b/i.test(first)) {
      city = first.replace(/^г\.\s*/i, '');
    }
  }

  let street: string | undefined;
  let house: string | undefined;
  const streetMatch = address.match(
    /(?:ул\.?|улица|пр\.?|просп\.?|проспект|пер\.?|переулок|ш\.?|шоссе|наб\.?|набережная)\s*([^,;]+)/i,
  );
  if (streetMatch) {
    const tail = clean(capture(streetMatch, 1));
    const houseMatch = tail.match(/^(.+?)\s+(?:д\.?|дом)\s*([^,;\s]+)/i);
    if (houseMatch) {
      street = clean(capture(houseMatch, 1));
      house = clean(capture(houseMatch, 2));
    } else {
      street = tail;
    }
  }

  if (!house) {
    const houseMatch = address.match(/(?:д\.?|дом)\s*([^,;\s]+)/i);
    if (houseMatch) house = clean(capture(houseMatch, 1));
  }

  return { raw: address, region, city, street, house, station };
}

export function buildNominatimQuery(parsed: ParsedAddress): string {
  const parts: string[] = [];
  if (parsed.region) parts.push(parsed.region);
  if (parsed.city) parts.push(parsed.city);
  if (parsed.street) parts.push(`ул. ${parsed.street}`);
  if (parsed.house) parts.push(`д. ${parsed.house}`);
  if (parsed.station) parts.push(`станция ${parsed.station}`);
  if (!parts.length) parts.push(parsed.raw);
  parts.push('Россия');
  return parts.join(', ');
}
