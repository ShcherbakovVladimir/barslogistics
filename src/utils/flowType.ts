import type { Factory, FlowType } from '../types';

export function inferFlowType(origin?: Factory | null, dest?: Factory | null): FlowType {
  if (!origin || !dest) return 'shipment';
  if (origin.is_ours && dest.is_ours) return 'internal';
  if (origin.is_ours && !dest.is_ours) return 'shipment';
  if (!origin.is_ours && dest.is_ours) return 'purchase';
  return 'shipment';
}
