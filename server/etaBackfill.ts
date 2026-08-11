import { pool } from "./db.js";
import { parseEtaToDate } from "./etaUtils.js";

/** One-time fill of eta_at from legacy eta text where possible. */
export async function backfillSupplyLinkEtaAt(): Promise<void> {
  const { rows } = await pool.query<{ id: string; eta: string }>(
    `SELECT id, eta FROM supply_links
     WHERE eta_at IS NULL AND eta IS NOT NULL AND TRIM(eta) <> ''`,
  );
  if (rows.length === 0) return;

  let updated = 0;
  for (const row of rows) {
    const parsed = parseEtaToDate(row.eta);
    if (!parsed) continue;
    await pool.query(`UPDATE supply_links SET eta_at = $2 WHERE id = $1`, [row.id, parsed.toISOString()]);
    updated++;
  }
  if (updated > 0) {
    console.log(`Backfilled eta_at for ${updated} shipment(s)`);
  }
}
