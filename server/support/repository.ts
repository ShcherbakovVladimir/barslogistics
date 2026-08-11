import { pool } from '../db.js';
import type { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '../../src/types.js';

function makeId(): string {
  return `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    user_name: row.user_name != null ? String(row.user_name) : undefined,
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
    ? `SELECT t.*, u.name AS user_name
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC
       LIMIT 200`
    : `SELECT t.*, u.name AS user_name
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 100`;
  const params = isAdmin ? [] : [userId];
  const { rows } = await pool.query(sql, params);
  return rows.map(mapTicket);
}

export async function createSupportTicket(input: {
  userId: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  pageContext?: string | null;
}): Promise<SupportTicket> {
  const id = makeId();
  const { rows } = await pool.query(
    `INSERT INTO support_tickets (id, user_id, subject, message, category, page_context)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      id,
      input.userId,
      input.subject.trim(),
      input.message.trim(),
      input.category,
      input.pageContext?.trim() || null,
    ],
  );
  const ticket = mapTicket(rows[0]);
  const userRow = await pool.query('SELECT name FROM users WHERE id = $1', [input.userId]);
  if (userRow.rows[0]) {
    ticket.user_name = String(userRow.rows[0].name);
  }
  return ticket;
}

export async function listAdminUserIds(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND COALESCE(notifications_enabled, true) = true`,
  );
  return rows.map(r => String(r.id));
}
