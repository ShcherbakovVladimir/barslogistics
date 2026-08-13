import { pool } from "../db.js";
import type { ErrorLog, ErrorLogFilters, ErrorLogLevel, ErrorLogSource } from "../../src/types.js";

const MAX_MESSAGE = 4000;
const MAX_STACK = 16000;
const MAX_ROUTE = 500;
const MAX_RETAINED = 2000;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

const loggedErrors = new WeakSet<object>();

export interface AppErrorInput {
  error?: unknown;
  level?: ErrorLogLevel;
  source?: ErrorLogSource;
  message?: string;
  stack?: string | null;
  route?: string | null;
  status_code?: number | null;
  user_id?: string | null;
  username?: string | null;
  ip_address?: string | null;
  meta?: Record<string, unknown> | null;
}

function clip(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function normalizeError(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || "Error",
      stack: error.stack ?? null,
    };
  }
  if (typeof error === "string") {
    return { message: error, stack: null };
  }
  try {
    return { message: JSON.stringify(error), stack: null };
  } catch {
    return { message: String(error), stack: null };
  }
}

export function markErrorLogged(error: unknown): void {
  if (error && typeof error === "object") {
    loggedErrors.add(error);
  }
}

export function wasErrorLogged(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && loggedErrors.has(error));
}

function mapRow(row: Record<string, unknown>): ErrorLog {
  const meta = row.meta;
  return {
    id: String(row.id),
    timestamp: toIso(row.timestamp),
    level: row.level as ErrorLogLevel,
    source: row.source as ErrorLogSource,
    message: String(row.message ?? ""),
    stack: row.stack != null ? String(row.stack) : null,
    route: row.route != null ? String(row.route) : null,
    status_code: row.status_code != null ? Number(row.status_code) : null,
    user_id: row.user_id != null ? String(row.user_id) : null,
    username: row.username != null ? String(row.username) : null,
    ip_address: row.ip_address != null ? String(row.ip_address) : null,
    meta: meta && typeof meta === "object" && !Array.isArray(meta)
      ? meta as Record<string, unknown>
      : null,
  };
}

function makeId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Persist an application error. Never throws. */
export async function logAppError(input: AppErrorInput): Promise<void> {
  if (wasErrorLogged(input.error)) return;
  markErrorLogged(input.error);

  const fromError = input.error !== undefined ? normalizeError(input.error) : { message: "", stack: null };
  const message = clip(input.message || fromError.message || "Unknown error", MAX_MESSAGE);
  if (!message) return;

  const level: ErrorLogLevel = input.level ?? "error";
  const source: ErrorLogSource = input.source ?? "http";

  try {
    await pool.query(
      `INSERT INTO error_logs (
         id, timestamp, level, source, message, stack, route, status_code,
         user_id, username, ip_address, meta
       ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        makeId(),
        level,
        source,
        message,
        clip(input.stack ?? fromError.stack, MAX_STACK),
        clip(input.route, MAX_ROUTE),
        input.status_code ?? null,
        input.user_id ?? null,
        clip(input.username, 120),
        clip(input.ip_address, 80),
        input.meta ?? null,
      ],
    );

    await pool.query(
      `DELETE FROM error_logs
       WHERE id NOT IN (
         SELECT id FROM error_logs ORDER BY timestamp DESC LIMIT $1
       )`,
      [MAX_RETAINED],
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[error-logger] failed to persist: ${detail}\n`);
  }
}

export async function getErrorLogs(
  filters: ErrorLogFilters = {},
): Promise<{ logs: ErrorLog[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.level) {
    params.push(filters.level);
    conditions.push(`level = $${params.length}`);
  }
  if (filters.source) {
    params.push(filters.source);
    conditions.push(`source = $${params.length}`);
  }
  const search = filters.search?.trim();
  if (search) {
    params.push(`%${search.slice(0, 200)}%`);
    const idx = params.length;
    conditions.push(
      `(message ILIKE $${idx} OR COALESCE(route, '') ILIKE $${idx} OR COALESCE(username, '') ILIKE $${idx} OR COALESCE(stack, '') ILIKE $${idx})`,
    );
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(MAX_LIMIT, Math.max(1, filters.limit ?? DEFAULT_LIMIT));

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM error_logs ${where}`,
    params,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM error_logs ${where}
     ORDER BY timestamp DESC
     LIMIT $${params.length}`,
    params,
  );

  const logs = rows.map((row) => mapRow(row as Record<string, unknown>));
  if (filters.sort === "oldest") logs.reverse();
  return { logs, total };
}
