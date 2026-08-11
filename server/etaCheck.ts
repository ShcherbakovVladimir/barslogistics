import type { ShipmentEvent, SupplyLink } from "../src/types.js";
import { getServerT } from "../src/i18n/translations.js";
import { getShipmentsForEtaCheck } from "./repositories.js";
import { recordStatusChangeEvent } from "./shipmentEvents.js";
import { SYSTEM_ACTOR } from "./systemActor.js";
import { resolveEtaInstant } from "./etaUtils.js";

export type EtaDelayResult = {
  event: ShipmentEvent;
  shipment: SupplyLink;
};

/** Mark en-route shipments as delayed when parsed ETA is in the past. */
export async function checkEtaOverdueShipments(): Promise<EtaDelayResult[]> {
  const candidates = await getShipmentsForEtaCheck();
  if (candidates.length === 0) return [];

  const now = new Date();
  const st = getServerT("ru");
  const delayReason = st("server.etaOverdueReason");
  const results: EtaDelayResult[] = [];

  for (const link of candidates) {
    if (link.status === "delayed" || link.status === "alert" || link.status === "arrived") {
      continue;
    }

    const etaAt = resolveEtaInstant(link.eta_at, link.eta, now);
    if (!etaAt || etaAt.getTime() >= now.getTime()) continue;

    try {
      const { event, shipment } = await recordStatusChangeEvent(
        link.id,
        "delayed",
        SYSTEM_ACTOR,
        delayReason,
        "system",
      );
      results.push({ event, shipment });
    } catch (error) {
      console.error(`ETA overdue check failed for ${link.id}:`, error);
    }
  }

  return results;
}
