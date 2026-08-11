import { pool } from '../db.js';
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
  UserRole,
} from '../../src/types.js';

function makeId(): string {
  return `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const USER_JOIN = `SELECT t.*,
  u.name AS user_name,
  u.username AS user_username,
  u.email AS user_email,
  u.role AS user_role
  FROM support_tickets t
  JOIN users u ON u.id = t.user_id`;

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    user_name: row.user_name != null ? String(row.user_name) : undefined,
    user_username: row.user_username != null ? String(row.user_username) : undefined,
    user_email: row.user_email != null ? String(row.user_email) : undefined,
    user_role: row.user_role != null ? (row.user_role as UserRole) : undefined,
    subject: String(row.subject),
    message: String(row.message),
    category: row.category as SupportTicketCategory,
    status: row.status as SupportTicketStatus,
    page_context: row.page_context != null ? String(row.page_context) : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

export async function listSupportTicketsForUser(userId: string, isAdmin: boolean): Promise<SupportTicket[]> {
  const sql = isAdmin
    ? `${USER_JOIN} ORDER BY t.created_at DESC LIMIT 200`
    : `${USER_JOIN} WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 100`;
  const params = isAdmin ? [] : [userId];
  const { rows } = await pool.query(sql, params);
  return rows.map(mapTicket);
}

export async function getSupportTicketById(id: string): Promise<SupportTicket | null> {
  const { rows } = await pool.query(`${USER_JOIN} WHERE t.id = $1`, [id]);
  return rows[0] ? mapTicket(rows[0]) : null;
}

export async function createSupportTicket(input: {
  userId: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  pageContext?: string | null;
}): Promise<SupportTicket> {
  const id = makeId();
  await pool.query(
    `INSERT INTO support_tickets (id, user_id, subject, message, category, page_context)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      input.userId,
      input.subject.trim(),
      input.message.trim(),
      input.category,
      input.pageContext?.trim() || null,
    ],
  );
  const ticket = await getSupportTicketById(id);
  if (!ticket) throw new Error('Failed to create support ticket');
  return ticket;
}

export async function updateSupportTicketStatus(
  id: string,
  status: SupportTicketStatus,
): Promise<SupportTicket | null> {
  const { rowCount } = await pool.query(
    `UPDATE support_tickets SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, status],
  );
  if (!rowCount) return null;
  return getSupportTicketById(id);
}

export async function listAdminUserIds(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND COALESCE(notifications_enabled, true) = true`,
  );
  return rows.map(r => String(r.id));
}
