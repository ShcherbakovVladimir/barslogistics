import { createHash } from 'crypto';

export interface ParsedRzdRow {
  shipmentDate: string;
  cargoCode: string;
  cargoName: string;
  originCountry: string;
  originRegion: string;
  originStationCis: string;
  originStationCisCode: string;
  originRailway: string;
  originStationName: string;
  originStationCode: string;
  shipper: string;
  destCountry: string;
  destRegion: string;
  destStationName: string;
  consignee: string;
  volume: number;
}

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

function parseVolume(value: string): number | null {
  const v = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const HEADER_MAP: Record<string, keyof ParsedRzdRow | 'skip'> = {
  'дата отправления': 'shipmentDate',
  'код груза': 'cargoCode',
  'груз': 'cargoName',
  'государство отправления': 'originCountry',
  'станция отправления снг': 'originStationCis',
  'код станции отправления снг': 'originStationCisCode',
  'область отправления': 'originRegion',
  'дорога отправления': 'originRailway',
  'станция отправления рф': 'originStationName',
  'код станции отправления рф': 'originStationCode',
  'грузоотправитель': 'shipper',
  'государство назначения': 'destCountry',
  'область назначения': 'destRegion',
  'станция назначения рф': 'destStationName',
  'грузополучатель': 'consignee',
  'объем': 'volume',
};

export function parseRzdAnalyticsCsv(csvText: string): { rows: ParsedRzdRow[]; errors: string[] } {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const errors: string[] = [];
  if (lines.length < 2) return { rows: [], errors: ['CSV file is empty'] };

  const headerLine = lines[0];
  if (!headerLine) return { rows: [], errors: ['CSV file is empty'] };

  const headers = parseCsvLine(headerLine, ';').map(normalizeHeader);
  const colIndex: Partial<Record<keyof ParsedRzdRow, number>> = {};
  headers.forEach((h, idx) => {
    const mapped = HEADER_MAP[h];
    if (mapped && mapped !== 'skip') colIndex[mapped] = idx;
  });

  const required: (keyof ParsedRzdRow)[] = ['shipmentDate', 'cargoName', 'originStationName', 'destStationName', 'volume'];
  for (const key of required) {
    if (colIndex[key] == null) errors.push(`Missing column: ${key}`);
  }
  if (errors.length) return { rows: [], errors };

  const rows: ParsedRzdRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = parseCsvLine(line, ';');
    const get = (key: keyof ParsedRzdRow) => {
      const idx = colIndex[key];
      return idx != null ? (cells[idx] ?? '').trim() : '';
    };

    const dateRaw = get('shipmentDate');
    const shipmentDate = parseDate(dateRaw);
    if (!shipmentDate) {
      errors.push(`Row ${i + 1}: invalid date "${dateRaw}"`);
      continue;
    }

    const volume = parseVolume(String(colIndex.volume != null ? cells[colIndex.volume] : ''));
    if (volume == null) {
      errors.push(`Row ${i + 1}: invalid volume`);
      continue;
    }

    const originStationName = get('originStationName') || get('originStationCis');
    const destStationName = get('destStationName');
    if (!originStationName || !destStationName) {
      errors.push(`Row ${i + 1}: missing station name`);
      continue;
    }

    rows.push({
      shipmentDate,
      cargoCode: get('cargoCode'),
      cargoName: get('cargoName') || '—',
      originCountry: get('originCountry') || 'РОССИЯ',
      originRegion: get('originRegion'),
      originStationCis: get('originStationCis'),
      originStationCisCode: get('originStationCisCode'),
      originRailway: get('originRailway'),
      originStationName,
      originStationCode: get('originStationCode') || get('originStationCisCode'),
      shipper: get('shipper'),
      destCountry: get('destCountry') || 'РОССИЯ',
      destRegion: get('destRegion'),
      destStationName,
      consignee: get('consignee'),
      volume,
    });
  }

  return { rows, errors };
}

export function computeRowContentHash(row: ParsedRzdRow): string {
  const key = [
    row.shipmentDate,
    row.cargoCode,
    row.cargoName,
    row.originStationCode,
    row.originStationName,
    row.destStationName,
    row.shipper,
    row.consignee,
    row.volume.toFixed(3),
  ].join('|').toUpperCase();
  return createHash('sha256').update(key).digest('hex');
}

export function computeFileHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function makeRecordId(): string {
  return `rzd_rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function makeBatchId(): string {
  return `rzd_batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
