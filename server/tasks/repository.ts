import type { PoolClient } from 'pg';
import { pool } from '../db.js';
import type {
  KanbanBoard,
  KanbanBoardDetail,
  KanbanBoardType,
  KanbanClassOfService,
  KanbanColumn,
  KanbanSwimlane,
  KanbanTask,
} from '../../src/types.js';

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapBoard(row: Record<string, unknown>): KanbanBoard {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    board_type: row.board_type as KanbanBoardType,
    owner_id: String(row.owner_id),
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
    member_ids: Array.isArray(row.member_ids)
      ? (row.member_ids as unknown[]).map(String)
      : undefined,
    task_count: row.task_count != null ? Number(row.task_count) : undefined,
  };
}

function mapColumn(row: Record<string, unknown>): KanbanColumn {
  return {
    id: String(row.id),
    board_id: String(row.board_id),
    name: String(row.name),
    position: Number(row.position),
    wip_limit: row.wip_limit != null ? Number(row.wip_limit) : null,
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function mapSwimlane(row: Record<string, unknown>): KanbanSwimlane {
  return {
    id: String(row.id),
    board_id: String(row.board_id),
    name: String(row.name),
    position: Number(row.position),
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function mapDueDate(raw: unknown): string | null {
  if (raw == null) return null;
  // node-pg returns DATE as Date at UTC midnight — String(date).slice(0,10) → "Wed Aug 05"
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  // ISO / pg string: "2026-08-05" or "2026-08-05T00:00:00.000Z"
  const ymd = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
}

function mapTask(row: Record<string, unknown>): KanbanTask {
  return {
    id: String(row.id),
    board_id: String(row.board_id),
    column_id: String(row.column_id),
    swimlane_id: row.swimlane_id != null ? String(row.swimlane_id) : null,
    title: String(row.title),
    description: String(row.description ?? ''),
    class_of_service: (row.class_of_service as KanbanClassOfService) || 'standard',
    assignee_id: row.assignee_id != null ? String(row.assignee_id) : null,
    assignee_name: row.assignee_name != null ? String(row.assignee_name) : null,
    assignee_has_avatar: Boolean(row.assignee_has_avatar),
    assignee_avatar_version: row.assignee_avatar_updated_at
      ? new Date(row.assignee_avatar_updated_at as string).toISOString()
      : null,
    creator_id: String(row.creator_id),
    creator_name: row.creator_name != null ? String(row.creator_name) : null,
    due_date: mapDueDate(row.due_date),
    priority: Number(row.priority ?? 0),
    position: Number(row.position),
    started_at: row.started_at ? new Date(row.started_at as string).toISOString() : null,
    completed_at: row.completed_at ? new Date(row.completed_at as string).toISOString() : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

const DEFAULT_COLUMNS: Record<KanbanBoardType, Array<{ name: string; wip_limit?: number }>> = {
  classic: [
    { name: 'Сделать' },
    { name: 'В работе', wip_limit: 5 },
    { name: 'Готово' },
  ],
  personal: [
    { name: 'Сделать' },
    { name: 'В работе' },
    { name: 'Готово' },
  ],
  team: [
    { name: 'Сделать' },
    { name: 'В работе', wip_limit: 3 },
    { name: 'Готово' },
  ],
  process: [
    { name: 'Новое' },
    { name: 'В работе', wip_limit: 5 },
    { name: 'Ожидание' },
    { name: 'Готово' },
  ],
  project: [
    { name: 'Планирование' },
    { name: 'Реализация', wip_limit: 5 },
    { name: 'Тестирование' },
    { name: 'Завершение' },
  ],
  swimlanes: [
    { name: 'Сделать' },
    { name: 'В работе', wip_limit: 4 },
    { name: 'Готово' },
  ],
};

const DEFAULT_SWIMLANES = [
  { name: 'Срочные' },
  { name: 'Стандартные' },
  { name: 'Прочее' },
];

export async function listBoardsForUser(userId: string): Promise<KanbanBoard[]> {
  const { rows } = await pool.query(
    `SELECT b.*,
            COALESCE(
              (SELECT array_agg(m.user_id ORDER BY m.created_at)
               FROM kanban_board_members m WHERE m.board_id = b.id),
              ARRAY[]::text[]
            ) AS member_ids,
            (SELECT COUNT(*)::int FROM kanban_tasks t WHERE t.board_id = b.id) AS task_count
     FROM kanban_boards b
     WHERE b.board_type = 'personal' AND b.owner_id = $1
        OR b.board_type <> 'personal' AND (
             b.owner_id = $1
          OR EXISTS (SELECT 1 FROM kanban_board_members m WHERE m.board_id = b.id AND m.user_id = $1)
          OR b.board_type IN ('classic', 'team', 'process', 'project', 'swimlanes')
        )
     ORDER BY b.updated_at DESC`,
    [userId],
  );
  return rows.map(r => mapBoard(r as Record<string, unknown>));
}

export async function userCanAccessBoard(boardId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM kanban_boards b
     WHERE b.id = $1 AND (
       b.owner_id = $2
       OR EXISTS (SELECT 1 FROM kanban_board_members m WHERE m.board_id = b.id AND m.user_id = $2)
       OR b.board_type <> 'personal'
     )`,
    [boardId, userId],
  );
  return rows.length > 0;
}

export async function getBoardDetail(boardId: string): Promise<KanbanBoardDetail | null> {
  const boardRes = await pool.query(
    `SELECT b.*,
            COALESCE(
              (SELECT array_agg(m.user_id ORDER BY m.created_at)
               FROM kanban_board_members m WHERE m.board_id = b.id),
              ARRAY[]::text[]
            ) AS member_ids
     FROM kanban_boards b WHERE b.id = $1`,
    [boardId],
  );
  if (boardRes.rows.length === 0) return null;
  const board = mapBoard(boardRes.rows[0] as Record<string, unknown>);

  const [cols, lanes, tasks] = await Promise.all([
    pool.query(`SELECT * FROM kanban_columns WHERE board_id = $1 ORDER BY position, created_at`, [boardId]),
    pool.query(`SELECT * FROM kanban_swimlanes WHERE board_id = $1 ORDER BY position, created_at`, [boardId]),
    pool.query(
      `SELECT t.*,
              ua.name AS assignee_name,
              (ua.avatar_path IS NOT NULL AND ua.avatar_path <> '') AS assignee_has_avatar,
              ua.avatar_updated_at AS assignee_avatar_updated_at,
              uc.name AS creator_name
       FROM kanban_tasks t
       LEFT JOIN users ua ON ua.id = t.assignee_id
       LEFT JOIN users uc ON uc.id = t.creator_id
       WHERE t.board_id = $1
       ORDER BY t.position, t.created_at`,
      [boardId],
    ),
  ]);

  return {
    ...board,
    columns: cols.rows.map(r => mapColumn(r as Record<string, unknown>)),
    swimlanes: lanes.rows.map(r => mapSwimlane(r as Record<string, unknown>)),
    tasks: tasks.rows.map(r => mapTask(r as Record<string, unknown>)),
  };
}

async function seedBoardStructure(
  client: PoolClient,
  boardId: string,
  boardType: KanbanBoardType,
): Promise<void> {
  const cols = DEFAULT_COLUMNS[boardType] ?? DEFAULT_COLUMNS.classic;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    await client.query(
      `INSERT INTO kanban_columns (id, board_id, name, position, wip_limit)
       VALUES ($1, $2, $3, $4, $5)`,
      [makeId('kcol'), boardId, col.name, i, col.wip_limit ?? null],
    );
  }
  if (boardType === 'swimlanes') {
    for (let i = 0; i < DEFAULT_SWIMLANES.length; i++) {
      await client.query(
        `INSERT INTO kanban_swimlanes (id, board_id, name, position)
         VALUES ($1, $2, $3, $4)`,
        [makeId('klane'), boardId, DEFAULT_SWIMLANES[i].name, i],
      );
    }
  }
}

export async function createBoard(input: {
  name: string;
  description?: string;
  board_type: KanbanBoardType;
  owner_id: string;
  member_ids?: string[];
}): Promise<KanbanBoardDetail> {
  const id = makeId('kboard');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO kanban_boards (id, name, description, board_type, owner_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.name.trim(), input.description?.trim() ?? '', input.board_type, input.owner_id],
    );
    await client.query(
      `INSERT INTO kanban_board_members (board_id, user_id, role) VALUES ($1, $2, 'owner')
       ON CONFLICT DO NOTHING`,
      [id, input.owner_id],
    );
    const members = new Set((input.member_ids ?? []).filter(uid => uid && uid !== input.owner_id));
    for (const uid of members) {
      await client.query(
        `INSERT INTO kanban_board_members (board_id, user_id, role) VALUES ($1, $2, 'member')
         ON CONFLICT DO NOTHING`,
        [id, uid],
      );
    }
    await seedBoardStructure(client, id, input.board_type);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  const detail = await getBoardDetail(id);
  if (!detail) throw new Error('Board create failed');
  return detail;
}

export async function updateBoard(
  boardId: string,
  userId: string,
  patch: { name?: string; description?: string; member_ids?: string[] },
): Promise<KanbanBoardDetail | null> {
  const { rows } = await pool.query(`SELECT owner_id FROM kanban_boards WHERE id = $1`, [boardId]);
  if (rows.length === 0) return null;
  if (String(rows[0].owner_id) !== userId) {
    const access = await userCanAccessBoard(boardId, userId);
    if (!access) return null;
  }

  if (patch.name != null || patch.description != null) {
    await pool.query(
      `UPDATE kanban_boards SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at = NOW()
       WHERE id = $1`,
      [boardId, patch.name?.trim() ?? null, patch.description?.trim() ?? null],
    );
  }

  if (patch.member_ids) {
    const ownerId = String(rows[0].owner_id);
    await pool.query(`DELETE FROM kanban_board_members WHERE board_id = $1 AND role = 'member'`, [boardId]);
    for (const uid of patch.member_ids) {
      if (!uid || uid === ownerId) continue;
      await pool.query(
        `INSERT INTO kanban_board_members (board_id, user_id, role) VALUES ($1, $2, 'member')
         ON CONFLICT DO NOTHING`,
        [boardId, uid],
      );
    }
    await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [boardId]);
  }

  return getBoardDetail(boardId);
}

export async function deleteBoard(boardId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM kanban_boards WHERE id = $1 AND owner_id = $2`,
    [boardId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createColumn(boardId: string, name: string, wipLimit?: number | null): Promise<KanbanColumn> {
  const posRes = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM kanban_columns WHERE board_id = $1`,
    [boardId],
  );
  const id = makeId('kcol');
  const position = Number(posRes.rows[0].next_pos);
  const { rows } = await pool.query(
    `INSERT INTO kanban_columns (id, board_id, name, position, wip_limit)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, boardId, name.trim(), position, wipLimit ?? null],
  );
  await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [boardId]);
  return mapColumn(rows[0] as Record<string, unknown>);
}

export async function createSwimlane(boardId: string, name: string): Promise<KanbanSwimlane> {
  const posRes = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM kanban_swimlanes WHERE board_id = $1`,
    [boardId],
  );
  const id = makeId('klane');
  const { rows } = await pool.query(
    `INSERT INTO kanban_swimlanes (id, board_id, name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, boardId, name.trim(), Number(posRes.rows[0].next_pos)],
  );
  await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [boardId]);
  return mapSwimlane(rows[0] as Record<string, unknown>);
}

async function loadTask(taskId: string): Promise<KanbanTask | null> {
  const { rows } = await pool.query(
    `SELECT t.*,
            ua.name AS assignee_name,
            (ua.avatar_path IS NOT NULL AND ua.avatar_path <> '') AS assignee_has_avatar,
            ua.avatar_updated_at AS assignee_avatar_updated_at,
            uc.name AS creator_name
     FROM kanban_tasks t
     LEFT JOIN users ua ON ua.id = t.assignee_id
     LEFT JOIN users uc ON uc.id = t.creator_id
     WHERE t.id = $1`,
    [taskId],
  );
  if (rows.length === 0) return null;
  return mapTask(rows[0] as Record<string, unknown>);
}

export async function getTaskById(taskId: string): Promise<KanbanTask | null> {
  return loadTask(taskId);
}

export async function createTask(input: {
  board_id: string;
  column_id: string;
  swimlane_id?: string | null;
  title: string;
  description?: string;
  class_of_service?: KanbanClassOfService;
  assignee_id?: string | null;
  creator_id: string;
  due_date?: string | null;
  priority?: number;
}): Promise<KanbanTask> {
  const posRes = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
     FROM kanban_tasks WHERE column_id = $1`,
    [input.column_id],
  );
  const id = makeId('ktask');
  await pool.query(
    `INSERT INTO kanban_tasks (
       id, board_id, column_id, swimlane_id, title, description,
       class_of_service, assignee_id, creator_id, due_date, priority, position, started_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
    [
      id,
      input.board_id,
      input.column_id,
      input.swimlane_id ?? null,
      input.title.trim(),
      input.description?.trim() ?? '',
      input.class_of_service ?? 'standard',
      input.assignee_id ?? null,
      input.creator_id,
      input.due_date ? String(input.due_date).slice(0, 10) : null,
      input.priority ?? 0,
      Number(posRes.rows[0].next_pos),
    ],
  );

  if (input.assignee_id) {
    await pool.query(
      `INSERT INTO kanban_board_members (board_id, user_id, role) VALUES ($1, $2, 'member')
       ON CONFLICT DO NOTHING`,
      [input.board_id, input.assignee_id],
    );
  }

  await pool.query(
    `INSERT INTO kanban_task_participants (task_id, user_id, role) VALUES ($1, $2, 'contributor')
     ON CONFLICT DO NOTHING`,
    [id, input.creator_id],
  );
  if (input.assignee_id) {
    await pool.query(
      `INSERT INTO kanban_task_participants (task_id, user_id, role) VALUES ($1, $2, 'assignee')
       ON CONFLICT (task_id, user_id) DO UPDATE SET role = 'assignee'`,
      [id, input.assignee_id],
    );
  }

  await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [input.board_id]);
  const task = await loadTask(id);
  if (!task) throw new Error('Task create failed');
  return task;
}

export async function updateTask(
  taskId: string,
  patch: {
    title?: string;
    description?: string;
    class_of_service?: KanbanClassOfService;
    assignee_id?: string | null;
    due_date?: string | null;
    priority?: number;
    swimlane_id?: string | null;
  },
): Promise<KanbanTask | null> {
  const existing = await loadTask(taskId);
  if (!existing) return null;

  await pool.query(
    `UPDATE kanban_tasks SET
       title = COALESCE($2, title),
       description = COALESCE($3, description),
       class_of_service = COALESCE($4, class_of_service),
       assignee_id = CASE WHEN $5::boolean THEN $6 ELSE assignee_id END,
       due_date = CASE WHEN $7::boolean THEN $8::date ELSE due_date END,
       priority = COALESCE($9, priority),
       swimlane_id = CASE WHEN $10::boolean THEN $11 ELSE swimlane_id END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      taskId,
      patch.title?.trim() ?? null,
      patch.description != null ? patch.description.trim() : null,
      patch.class_of_service ?? null,
      patch.assignee_id !== undefined,
      patch.assignee_id ?? null,
      patch.due_date !== undefined,
      patch.due_date ? String(patch.due_date).slice(0, 10) : null,
      patch.priority ?? null,
      patch.swimlane_id !== undefined,
      patch.swimlane_id ?? null,
    ],
  );

  if (patch.assignee_id) {
    await pool.query(
      `INSERT INTO kanban_board_members (board_id, user_id, role) VALUES ($1, $2, 'member')
       ON CONFLICT DO NOTHING`,
      [existing.board_id, patch.assignee_id],
    );
  }

  await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [existing.board_id]);
  return loadTask(taskId);
}

export async function moveTask(
  taskId: string,
  target: { column_id: string; position: number; swimlane_id?: string | null },
): Promise<KanbanTask | null> {
  const existing = await loadTask(taskId);
  if (!existing) return null;

  const colCheck = await pool.query(
    `SELECT id, wip_limit FROM kanban_columns WHERE id = $1 AND board_id = $2`,
    [target.column_id, existing.board_id],
  );
  if (colCheck.rows.length === 0) throw new Error('Invalid column');

  const wip = colCheck.rows[0].wip_limit != null ? Number(colCheck.rows[0].wip_limit) : null;
  if (wip != null && target.column_id !== existing.column_id) {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM kanban_tasks WHERE column_id = $1`,
      [target.column_id],
    );
    if (Number(countRes.rows[0].c) >= wip) {
      throw new Error(`WIP limit reached (${wip})`);
    }
  }

  const colNameRes = await pool.query(
    `SELECT name FROM kanban_columns WHERE id = $1`,
    [target.column_id],
  );
  const colName = String(colNameRes.rows[0]?.name ?? '').toLowerCase();
  const isDone = /^(готово|завершение|done|complete|completed)$/i.test(colName.trim());

  await pool.query(
    `UPDATE kanban_tasks SET
       column_id = $2,
       position = $3,
       swimlane_id = CASE WHEN $4::boolean THEN $5 ELSE swimlane_id END,
       completed_at = CASE
         WHEN $6::boolean THEN COALESCE(completed_at, NOW())
         ELSE NULL
       END,
       started_at = COALESCE(started_at, NOW()),
       updated_at = NOW()
     WHERE id = $1`,
    [
      taskId,
      target.column_id,
      target.position,
      target.swimlane_id !== undefined,
      target.swimlane_id ?? null,
      isDone,
    ],
  );
  await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [existing.board_id]);
  return loadTask(taskId);
}

export async function deleteTask(taskId: string): Promise<KanbanTask | null> {
  const existing = await loadTask(taskId);
  if (!existing) return null;
  await pool.query(`DELETE FROM kanban_tasks WHERE id = $1`, [taskId]);
  await pool.query(`UPDATE kanban_boards SET updated_at = NOW() WHERE id = $1`, [existing.board_id]);
  return existing;
}

export async function getBoardParticipantIds(boardId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT uid FROM (
       SELECT owner_id AS uid FROM kanban_boards WHERE id = $1
       UNION
       SELECT user_id AS uid FROM kanban_board_members WHERE board_id = $1
       UNION
       SELECT assignee_id AS uid FROM kanban_tasks WHERE board_id = $1 AND assignee_id IS NOT NULL
       UNION
       SELECT creator_id AS uid FROM kanban_tasks WHERE board_id = $1
     ) s`,
    [boardId],
  );
  return rows.map(r => String(r.uid));
}

export async function countOpenTasksForUser(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c
     FROM kanban_tasks t
     JOIN kanban_columns c ON c.id = t.column_id
     WHERE t.assignee_id = $1
       AND LOWER(c.name) NOT IN ('готово', 'завершение', 'done', 'complete', 'completed')`,
    [userId],
  );
  return Number(rows[0]?.c ?? 0);
}
