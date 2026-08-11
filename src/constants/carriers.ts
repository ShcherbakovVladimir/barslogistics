import type { ThirdPartyCarrier } from '../types';

export function activeCarriers(carriers: ThirdPartyCarrier[]): ThirdPartyCarrier[] {
  return carriers.filter(c => c.is_active !== false);
}

export function getCarrierLabel(carrier: ThirdPartyCarrier): string {
  return carrier.name;
}

export function resolveCarrierName(
  carrierId: string | undefined,
  carrierName: string | undefined,
  carriers: ThirdPartyCarrier[],
): string {
  if (carrierId) {
    const c = carriers.find(x => x.id === carrierId);
    if (c) return c.name;
  }
  return carrierName || '—';
}
