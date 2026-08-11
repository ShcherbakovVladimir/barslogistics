import { Readable } from 'stream';

/** Minimal dBase III reader for KLADR .DBF files (CP866 text fields). */

export interface DbfField {
  name: string;
  type: string;
  length: number;
  decimalCount: number;
}

export interface DbfHeader {
  recordCount: number;
  headerLength: number;
  recordLength: number;
  fields: DbfField[];
}

function decodeCp866(buffer: Buffer): string {
  return buffer.toString('binary')
    .replace(/\0/g, '')
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0);
      if (code < 128) return ch;
      // CP866 Cyrillic block → UTF-8 via Unicode mapping (subset)
      const cp866ToUnicode: Record<number, string> = {
        0x80: 'А', 0x81: 'Б', 0x82: 'В', 0x83: 'Г', 0x84: 'Д', 0x85: 'Е', 0x86: 'Ж', 0x87: 'З',
        0x88: 'И', 0x89: 'Й', 0x8a: 'К', 0x8b: 'Л', 0x8c: 'М', 0x8d: 'Н', 0x8e: 'О', 0x8f: 'П',
        0x90: 'Р', 0x91: 'С', 0x92: 'Т', 0x93: 'У', 0x94: 'Ф', 0x95: 'Х', 0x96: 'Ц', 0x97: 'Ч',
        0x98: 'Ш', 0x99: 'Щ', 0x9a: 'Ъ', 0x9b: 'Ы', 0x9c: 'Ь', 0x9d: 'Э', 0x9e: 'Ю', 0x9f: 'Я',
        0xa0: 'а', 0xa1: 'б', 0xa2: 'в', 0xa3: 'г', 0xa4: 'д', 0xa5: 'е', 0xa6: 'ж', 0xa7: 'з',
        0xa8: 'и', 0xa9: 'й', 0xaa: 'к', 0xab: 'л', 0xac: 'м', 0xad: 'н', 0xae: 'о', 0xaf: 'п',
        0xe0: 'р', 0xe1: 'с', 0xe2: 'т', 0xe3: 'у', 0xe4: 'ф', 0xe5: 'х', 0xe6: 'ц', 0xe7: 'ч',
        0xe8: 'ш', 0xe9: 'щ', 0xea: 'ъ', 0xeb: 'ы', 0xec: 'ь', 0xed: 'э', 0xee: 'ю', 0xef: 'ё',
        0xf0: 'ю', 0xf1: 'я',
      };
      return cp866ToUnicode[code] ?? '';
    })
    .join('')
    .trim();
}

export function parseDbfHeader(buffer: Buffer): DbfHeader {
  if (buffer.length < 32) throw new Error('Invalid DBF: too short');
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields: DbfField[] = [];
  let offset = 32;
  while (offset + 32 <= headerLength - 1) {
    const name = buffer.subarray(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const type = String.fromCharCode(buffer[offset + 11]);
    const length = buffer[offset + 16];
    const decimalCount = buffer[offset + 17];
    if (!name) break;
    fields.push({ name, type, length, decimalCount });
    offset += 32;
  }
  return { recordCount, headerLength, recordLength, fields };
}

export function parseDbfRecord(record: Buffer, fields: DbfField[]): Record<string, string> {
  const row: Record<string, string> = {};
  let pos = 1; // skip deletion flag
  for (const field of fields) {
    const slice = record.subarray(pos, pos + field.length);
    const raw = field.type === 'N' || field.type === 'F'
      ? slice.toString('ascii').trim()
      : decodeCp866(slice);
    row[field.name] = raw;
    pos += field.length;
  }
  return row;
}

export async function readDbfRecords(
  filePath: string,
  onBatch: (rows: Record<string, string>[], index: number) => Promise<void>,
  batchSize = 100,
): Promise<number> {
  const { readFile } = await import('fs/promises');
  const buffer = await readFile(filePath);
  const header = parseDbfHeader(buffer);
  let processed = 0;
  let batch: Record<string, string>[] = [];
  let batchIndex = 0;

  for (let i = 0; i < header.recordCount; i++) {
    const start = header.headerLength + i * header.recordLength;
    const record = buffer.subarray(start, start + header.recordLength);
    if (record[0] === 0x2a) continue; // deleted
    batch.push(parseDbfRecord(record, header.fields));
    processed++;
    if (batch.length >= batchSize) {
      await onBatch(batch, batchIndex++);
      batch = [];
    }
  }
  if (batch.length) await onBatch(batch, batchIndex);
  return processed;
}

export async function streamDownload(url: string, destPath: string): Promise<void> {
  const { createWriteStream } = await import('fs');
  const { pipeline } = await import('stream/promises');
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(600_000) });
  if (!res.ok || !res.body) throw new Error(`Download failed: HTTP ${res.status}`);
  const nodeStream = Readable.fromWeb(res.body as import('stream/web').ReadableStream);
  await pipeline(nodeStream, createWriteStream(destPath));
}
