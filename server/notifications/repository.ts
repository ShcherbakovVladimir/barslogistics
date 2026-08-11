import crypto from "crypto";
import { pool } from "../db.js";
import type { NotificationItem } from "../../src/types.js";

export type NotificationType = NotificationItem["type"];

export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkType?: string | null;
  linkId?: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_type: string | null;
  link_id: string | null;
  created_at: Date;
  read_at: Date | null;
  deleted_at: Date | null;
};

export function mapNotificationRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    timestamp: row.created_at.toISOString(),
    read: Boolean(row.read_at),
    link_id: row.link_id ?? undefined,
    link_type: row.link_type ?? undefined,
    deleted: Boolean(row.deleted_at),
  };
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationItem> {
  const id = `notif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const { rows } = await pool.query<NotificationRow>(
    `INSERT INTO user_notifications (id, user_id, title, message, type, link_type, link_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      id,
      input.userId,
      input.title,
      input.message,
      input.type ?? "info",
      input.linkType ?? null,
      input.linkId ?? null,
    ],
  );
  return mapNotificationRow(rows[0]);
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
): Promise<NotificationItem[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return [];

  const created: NotificationItem[] = [];
  for (const userId of unique) {
    created.push(await createNotification({ ...input, userId }));
  }
  return created;
}

export async function listUserNotifications(
  userId: string,
  options: { limit?: number; includeDeleted?: boolean } = {},
): Promise<NotificationItem[]> {
  const limit = Math.min(Math.max(options.limit ?? 80, 1), 200);
  const deletedClause = options.includeDeleted ? "" : "AND deleted_at IS NULL";
  const { rows } = await pool.query<NotificationRow>(
    `SELECT * FROM user_notifications
     WHERE user_id = $1 ${deletedClause}
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map(mapNotificationRow);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM user_notifications
     WHERE user_id = $1 AND deleted_at IS NULL AND read_at IS NULL`,
    [userId],
  );
  return Number.parseInt(rows[0]?.count ?? "0", 10) || 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<NotificationItem | null> {
  const { rows } = await pool.query<NotificationRow>(
    `UPDATE user_notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [notificationId, userId],
  );
  return rows[0] ? mapNotificationRow(rows[0]) : null;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await pool.query(
    `UPDATE user_notifications
     SET read_at = NOW()
     WHERE user_id = $1 AND deleted_at IS NULL AND read_at IS NULL`,
    [userId],
  );
  return result.rowCount ?? 0;
}

export async function softDeleteNotification(
  userId: string,
  notificationId: string,
): Promise<NotificationItem | null> {
  const { rows } = await pool.query<NotificationRow>(
    `UPDATE user_notifications
     SET deleted_at = NOW(), read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [notificationId, userId],
  );
  return rows[0] ? mapNotificationRow(rows[0]) : null;
}

export async function softDeleteAllNotifications(userId: string): Promise<number> {
  const result = await pool.query(
    `UPDATE user_notifications
     SET deleted_at = NOW(), read_at = COALESCE(read_at, NOW())
     WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  return result.rowCount ?? 0;
}
