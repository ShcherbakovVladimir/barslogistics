import { pool } from "./db.js";

/** Average hours from shipment_date to first arrived event (or last_updated if arrived). */
export async function fetchAvgDeliveryHours(): Promise<number> {
  const { rows } = await pool.query<{ avg_hours: string | null }>(
    `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (arrived_at - started_at)) / 3600.0)::numeric, 1) AS avg_hours
     FROM (
       SELECT
         sl.id,
         sl.shipment_date::timestamp AS started_at,
         COALESCE(
           (
             SELECT MIN(se.created_at)
             FROM shipment_events se
             WHERE se.shipment_id = sl.id AND se.new_status = 'arrived'
           ),
           CASE WHEN sl.status = 'arrived' THEN sl.last_updated END
         ) AS arrived_at
       FROM supply_links sl
       WHERE sl.shipment_date IS NOT NULL
         AND (
           sl.status = 'arrived'
           OR EXISTS (
             SELECT 1 FROM shipment_events se
             WHERE se.shipment_id = sl.id AND se.new_status = 'arrived'
           )
         )
     ) t
     WHERE arrived_at IS NOT NULL AND arrived_at > started_at`,
  );
  const raw = rows[0]?.avg_hours;
  return raw != null ? Number(raw) : 0;
}
