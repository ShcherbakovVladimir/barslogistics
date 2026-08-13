export interface ParsedInternalShipmentRow {
  shipmentDate: string;
  cargoGroup: string;
  description: string;
  siteName: string;
  latitude: number;
  longitude: number;
  siteAddress: string;
  consignee: string;
  deliveryAddress: string;
  volume: number;
  managerName: string;
}

export interface InternalShipmentsCsvStructureResult {
  ok: boolean;
  errors: string[];
  delimiter: ';' | ',';
  headers: string[];
}

const HEADER_MAP: Record<string, keyof ParsedInternalShipmentRow | 'skip'> = {
  'дата отправления': 'shipmentDate',
  'груз': 'cargoGroup',
  'описание': 'description',
  'площадка': 'siteName',
  'широта': 'latitude',
  'долгота': 'longitude',
  'адрес прощадки': 'siteAddress',
  'адрес площадки': 'siteAddress',
  'грузополучатель': 'consignee',
  'адрес поставки': 'deliveryAddress',
  'объем': 'volume',
  'объём': 'volume',
  'менеджер': 'managerName',
};

/** Semicolon-separated template for internal shipments CSV. */
export const INTERNAL_SHIPMENTS_CSV_TEMPLATE = [
  'Дата отправления;Груз;Описание;Площадка;Широта;Долгота;Адрес площадки;Грузополучатель;Адрес поставки;Объем;Менеджер',
  '15.01.2025;Металлолом;Лом чёрных металлов;БМЗ Транзит;52.88;30.03;Гомельская область;ООО Пример;г. Минск, ул. Примерная 1;120.5;Иванов',
  '16.01.2025;Металлолом;Лом чёрных металлов;Красный Октябрь;48.71;44.52;Волгоградская область;АО Получатель;г. Волгоград, ул. Заводская 10;85;Петров',
].join('\n');

export const INTERNAL_SHIPMENTS_CSV_TEMPLATE_FILENAME = 'internal_shipments_template.csv';

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function parseDate(value: string): string | null {
  const v = value.trim();
  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m?.[1] || !m[2] || !m[3]) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseNumber(value: string): number | null {
  const v = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function validateInternalShipmentsCsvStructure(csvText: string): InternalShipmentsCsvStructureResult {
  const errors: string[] = [];
  const rawLines = csvText.split(/\r?\n/);
  const lines = rawLines.filter(l => l.trim());

  if (lines.length === 0) {
    return { ok: false, errors: ['CSV file is empty'], delimiter: ';', headers: [] };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return { ok: false, errors: ['CSV file is empty'], delimiter: ';', headers: [] };
  }

  const delimiter: ';' | ',' = headerLine.includes(';') ? ';' : ',';
  const headers = parseCsvLine(headerLine, delimiter).map(normalizeHeader);
  const columnMap = headers.map(h => HEADER_MAP[h] ?? null);

  if (!columnMap.includes('shipmentDate')) {
    errors.push('Missing required column: Дата отправления');
  }
  if (!columnMap.includes('siteName')) {
    errors.push('Missing required column: Площадка');
  }
  if (!columnMap.includes('volume')) {
    errors.push('Missing required column: Объем');
  }

  const unknown = headers.filter((h, i) => h && columnMap[i] == null);
  if (unknown.length > 0 && errors.length === 0 && lines.length < 2) {
    errors.push('CSV file has no data rows');
  } else if (lines.length < 2 && errors.length === 0) {
    errors.push('CSV file has no data rows');
  }

  return {
    ok: errors.length === 0,
    errors,
    delimiter,
    headers,
  };
}

export function parseInternalShipmentsCsv(csvText: string): { rows: ParsedInternalShipmentRow[]; errors: string[] } {
  const structure = validateInternalShipmentsCsvStructure(csvText);
  if (!structure.ok) {
    return { rows: [], errors: structure.errors };
  }

  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const delimiter = structure.delimiter;
  const headerLine = lines[0];
  if (!headerLine) {
    return { rows: [], errors: ['CSV file is empty'] };
  }
  const headers = parseCsvLine(headerLine, delimiter).map(normalizeHeader);
  const columnMap: (keyof ParsedInternalShipmentRow | 'skip' | null)[] = headers.map(h => HEADER_MAP[h] ?? null);

  const errors: string[] = [];
  const rows: ParsedInternalShipmentRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = parseCsvLine(line, delimiter);
    if (cells.every(c => !c.trim())) continue;

    const raw: Partial<Record<keyof ParsedInternalShipmentRow, string>> = {};
    columnMap.forEach((key, idx) => {
      if (!key || key === 'skip') return;
      raw[key] = cells[idx] ?? '';
    });

    const shipmentDate = parseDate(String(raw.shipmentDate ?? ''));
    const volume = parseNumber(String(raw.volume ?? ''));
    const latitude = parseNumber(String(raw.latitude ?? ''));
    const longitude = parseNumber(String(raw.longitude ?? ''));

    if (!shipmentDate) {
      errors.push(`Row ${i + 1}: invalid date`);
      continue;
    }
    if (volume == null || volume <= 0) {
      errors.push(`Row ${i + 1}: invalid volume`);
      continue;
    }
    if (!raw.siteName?.trim()) {
      errors.push(`Row ${i + 1}: missing site`);
      continue;
    }

    rows.push({
      shipmentDate,
      cargoGroup: String(raw.cargoGroup ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      siteName: String(raw.siteName).trim(),
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      siteAddress: String(raw.siteAddress ?? '').trim(),
      consignee: String(raw.consignee ?? '').trim(),
      deliveryAddress: String(raw.deliveryAddress ?? '').trim(),
      volume,
      managerName: String(raw.managerName ?? '').trim(),
    });
  }

  return { rows, errors };
}

export function downloadInternalShipmentsCsvTemplate(): void {
  const blob = new Blob(['\uFEFF' + INTERNAL_SHIPMENTS_CSV_TEMPLATE], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = INTERNAL_SHIPMENTS_CSV_TEMPLATE_FILENAME;
  a.click();
  URL.revokeObjectURL(url);
}
