import crypto from "crypto";
import { pool } from "../db.js";

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function upsertPushSubscription(
  userId: string,
  input: PushSubscriptionInput,
  userAgent?: string,
): Promise<void> {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (endpoint) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent,
       updated_at = NOW()`,
    [id, userId, input.endpoint, input.keys.p256dh, input.keys.auth, userAgent ?? null],
  );
}

export async function deletePushSubscription(userId: string, endpoint?: string): Promise<number> {
  if (endpoint) {
    const result = await pool.query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [userId, endpoint],
    );
    return result.rowCount ?? 0;
  }
  const result = await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
}

export async function listPushSubscriptionsForUser(userId: string): Promise<PushSubscriptionRow[]> {
  const result = await pool.query<PushSubscriptionRow>(
    `SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth
     FROM push_subscriptions ps
     JOIN users u ON u.id = ps.user_id
     WHERE ps.user_id = $1 AND COALESCE(u.notifications_enabled, true) = true`,
    [userId],
  );
  return result.rows;
}
