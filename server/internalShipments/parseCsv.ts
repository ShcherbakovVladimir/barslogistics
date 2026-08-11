import { createHash } from 'crypto';
import {
  parseInternalShipmentsCsv,
  validateInternalShipmentsCsvStructure,
  type ParsedInternalShipmentRow,
} from '../../src/utils/internalShipmentsCsv.js';

export {
  parseInternalShipmentsCsv,
  validateInternalShipmentsCsvStructure,
  type ParsedInternalShipmentRow,
};

export function computeFileHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function computeRowContentHash(row: ParsedInternalShipmentRow): string {
  const payload = [
    row.shipmentDate,
    row.siteName,
    row.cargoGroup,
    row.description,
    row.consignee,
    row.deliveryAddress,
    row.volume.toFixed(3),
    row.managerName,
  ].join('|');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function makeBatchId(): string {
  return `sib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
