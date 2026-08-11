import type { CargoStatus, ShipmentEventType, ShipmentTimingKind } from '../types';

export const SHIPMENT_EVENT_TYPES: ShipmentEventType[] = [
  'status_change',
  'comment',
  'delay',
  'early',
  'eta_update',
];

export const SHIPMENT_TIMING_KINDS: ShipmentTimingKind[] = ['on_time', 'delay', 'early'];

export const DELAY_REASON_KEYS = [
  'maneuvering',
  'weather',
  'railway',
  'port',
  'documents',
  'equipment',
  'customs',
  'other',
] as const;

export type DelayReasonKey = typeof DELAY_REASON_KEYS[number];

export const STATUS_REQUIRES_REASON: CargoStatus[] = ['delayed', 'alert'];
