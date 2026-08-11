import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pool } from "../db.js";
import {
  decodeUploadFilename,
  safeStoredBasename,
} from "../chat/filename.js";
import { getTaskById, userCanAccessBoard } from "./repository.js";
import { getTaskMaxFileBytes, taskFileDir } from "./files.js";
import type {
  KanbanMilestoneStatus,
  KanbanTaskAttachment,
  KanbanTaskMessage,
  KanbanTaskMilestone,
  KanbanTaskParticipant,
  KanbanTaskWorkspace,
} from "../../src/types.js";

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function mapDueDate(raw: unknown): string | null {
  if (raw == null) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, "0");
    const d = String(raw.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

async function assertTaskAccess(taskId: string, userId: string): Promise<{ board_id: string }> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");
  if (!(await userCanAccessBoard(task.board_id, userId))) throw new Error("Forbidden");
  return { board_id: task.board_id };
}

function mapParticipant(row: Record<string, unknown>): KanbanTaskParticipant {
  return {
    user_id: String(row.user_id),
    name: row.name != null ? String(row.name) : "",
    username: row.username != null ? String(row.username) : "",
    role: (row.role as KanbanTaskParticipant["role"]) || "contributor",
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function mapMessage(row: Record<string, unknown>): KanbanTaskMessage {
  return {
    id: String(row.id),
    task_id: String(row.task_id),
    author_id: String(row.author_id),
    author_name: row.author_name != null ? String(row.author_name) : "",
    body: String(row.body ?? ""),
    milestone_id: row.milestone_id != null ? String(row.milestone_id) : null,
    attachment_id: row.attachment_id != null ? String(row.attachment_id) : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

function mapMilestone(row: Record<string, unknown>): KanbanTaskMilestone {
  return {
    id: String(row.id),
    task_id: String(row.task_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    position: Number(row.position),
    status: (row.status as KanbanMilestoneStatus) || "pending",
    due_date: mapDueDate(row.due_date),
    created_by: String(row.created_by),
    created_by_name: row.created_by_name != null ? String(row.created_by_name) : null,
    approved_by: row.approved_by != null ? String(row.approved_by) : null,
    approved_by_name: row.approved_by_name != null ? String(row.approved_by_name) : null,
    approved_at: row.approved_at ? new Date(row.approved_at as string).toISOString() : null,
    rejection_reason: row.rejection_reason != null ? String(row.rejection_reason) : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

function mapAttachment(row: Record<string, unknown>): KanbanTaskAttachment {
  return {
    id: String(row.id),
    task_id: String(row.task_id),
    message_id: row.message_id != null ? String(row.message_id) : null,
    milestone_id: row.milestone_id != null ? String(row.milestone_id) : null,
    uploaded_by: String(row.uploaded_by),
    uploaded_by_name: row.uploaded_by_name != null ? String(row.uploaded_by_name) : "",
    original_name: String(row.original_name),
    mime_type: row.mime_type != null ? String(row.mime_type) : null,
    size_bytes: Number(row.size_bytes),
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

export async function ensureTaskParticipant(
  taskId: string,
  userId: string,
  role: KanbanTaskParticipant["role"] = "contributor",
): Promise<void> {
  await pool.query(
    `INSERT INTO kanban_task_participants (task_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (task_id, user_id) DO UPDATE
       SET role = CASE
         WHEN kanban_task_participants.role = 'assignee' THEN kanban_task_participants.role
         WHEN EXCLUDED.role = 'assignee' THEN EXCLUDED.role
         WHEN EXCLUDED.role = 'approver' AND kanban_task_participants.role = 'contributor' THEN EXCLUDED.role
         ELSE kanban_task_participants.role
       END`,
    [taskId, userId, role],
  );
}

export async function listTaskParticipants(taskId: string): Promise<KanbanTaskParticipant[]> {
  const { rows } = await pool.query(
    `SELECT p.*, u.name, u.username
     FROM kanban_task_participants p
     JOIN users u ON u.id = p.user_id
     WHERE p.task_id = $1
     ORDER BY CASE p.role
       WHEN 'assignee' THEN 0 WHEN 'approver' THEN 1 WHEN 'contributor' THEN 2 ELSE 3 END,
       u.name`,
    [taskId],
  );
  return rows.map(r => mapParticipant(r as Record<string, unknown>));
}

export async function listTaskMessages(taskId: string): Promise<KanbanTaskMessage[]> {
  const { rows } = await pool.query(
    `SELECT m.*, u.name AS author_name,
            (SELECT a.id FROM kanban_task_attachments a WHERE a.message_id = m.id LIMIT 1) AS attachment_id
     FROM kanban_task_messages m
     JOIN users u ON u.id = m.author_id
     WHERE m.task_id = $1
     ORDER BY m.created_at ASC`,
    [taskId],
  );
  return rows.map(r => mapMessage(r as Record<string, unknown>));
}

export async function listTaskMilestones(taskId: string): Promise<KanbanTaskMilestone[]> {
  const { rows } = await pool.query(
    `SELECT m.*,
            cu.name AS created_by_name,
            au.name AS approved_by_name
     FROM kanban_task_milestones m
     JOIN users cu ON cu.id = m.created_by
     LEFT JOIN users au ON au.id = m.approved_by
     WHERE m.task_id = $1
     ORDER BY m.position ASC, m.created_at ASC`,
    [taskId],
  );
  return rows.map(r => mapMilestone(r as Record<string, unknown>));
}

export async function listTaskAttachments(taskId: string): Promise<KanbanTaskAttachment[]> {
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS uploaded_by_name
     FROM kanban_task_attachments a
     JOIN users u ON u.id = a.uploaded_by
     WHERE a.task_id = $1
     ORDER BY a.created_at DESC`,
    [taskId],
  );
  return rows.map(r => mapAttachment(r as Record<string, unknown>));
}

export async function getTaskWorkspace(taskId: string, userId: string): Promise<KanbanTaskWorkspace> {
  await assertTaskAccess(taskId, userId);
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");
  const [participants, messages, milestones, attachments] = await Promise.all([
    listTaskParticipants(taskId),
    listTaskMessages(taskId),
    listTaskMilestones(taskId),
    listTaskAttachments(taskId),
  ]);
  return { task, participants, messages, milestones, attachments };
}

export async function addTaskMessage(
  taskId: string,
  authorId: string,
  body: string,
  milestoneId?: string | null,
): Promise<KanbanTaskMessage> {
  await assertTaskAccess(taskId, authorId);
  const text = body.trim();
  if (!text) throw new Error("Message body is required");
  await ensureTaskParticipant(taskId, authorId, "contributor");
  const id = makeId("ktmsg");
  await pool.query(
    `INSERT INTO kanban_task_messages (id, task_id, author_id, body, milestone_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, taskId, authorId, text, milestoneId || null],
  );
  const { rows } = await pool.query(
    `SELECT m.*, u.name AS author_name, NULL::text AS attachment_id
     FROM kanban_task_messages m
     JOIN users u ON u.id = m.author_id
     WHERE m.id = $1`,
    [id],
  );
  return mapMessage(rows[0] as Record<string, unknown>);
}

export async function createMilestone(
  taskId: string,
  userId: string,
  input: { title: string; description?: string; due_date?: string | null },
): Promise<KanbanTaskMilestone> {
  await assertTaskAccess(taskId, userId);
  const title = input.title.trim();
  if (!title) throw new Error("Milestone title is required");
  const posRes = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM kanban_task_milestones WHERE task_id = $1`,
    [taskId],
  );
  const id = makeId("ktms");
  await pool.query(
    `INSERT INTO kanban_task_milestones (id, task_id, title, description, position, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      taskId,
      title,
      input.description?.trim() ?? "",
      Number(posRes.rows[0].next_pos),
      input.due_date || null,
      userId,
    ],
  );
  await ensureTaskParticipant(taskId, userId, "contributor");
  const list = await listTaskMilestones(taskId);
  const created = list.find(m => m.id === id);
  if (!created) throw new Error("Milestone create failed");
  return created;
}

export async function updateMilestoneStatus(
  milestoneId: string,
  userId: string,
  patch: {
    status?: KanbanMilestoneStatus;
    rejection_reason?: string | null;
    title?: string;
    description?: string;
    due_date?: string | null;
  },
): Promise<KanbanTaskMilestone> {
  const { rows: existingRows } = await pool.query(
    `SELECT * FROM kanban_task_milestones WHERE id = $1`,
    [milestoneId],
  );
  const existing = existingRows[0];
  if (!existing) throw new Error("Milestone not found");
  await assertTaskAccess(String(existing.task_id), userId);

  const nextStatus = patch.status ?? (existing.status as KanbanMilestoneStatus);
  const approving = nextStatus === "approved";
  const rejecting = nextStatus === "rejected";

  await pool.query(
    `UPDATE kanban_task_milestones SET
       title = COALESCE($2, title),
       description = COALESCE($3, description),
       due_date = CASE WHEN $4::boolean THEN $5::date ELSE due_date END,
       status = $6,
       approved_by = CASE WHEN $7 THEN $8 WHEN $9 THEN NULL ELSE approved_by END,
       approved_at = CASE WHEN $7 THEN NOW() WHEN $9 THEN NULL ELSE approved_at END,
       rejection_reason = CASE WHEN $9 THEN $10 WHEN $7 THEN NULL ELSE rejection_reason END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      milestoneId,
      patch.title?.trim() ?? null,
      patch.description != null ? patch.description.trim() : null,
      patch.due_date !== undefined,
      patch.due_date || null,
      nextStatus,
      approving,
      userId,
      rejecting,
      patch.rejection_reason?.trim() || null,
    ],
  );

  if (approving || nextStatus === "awaiting_approval") {
    await ensureTaskParticipant(String(existing.task_id), userId, approving ? "approver" : "contributor");
  }

  const list = await listTaskMilestones(String(existing.task_id));
  const updated = list.find(m => m.id === milestoneId);
  if (!updated) throw new Error("Milestone update failed");
  return updated;
}

export async function deleteMilestone(milestoneId: string, userId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT task_id, status FROM kanban_task_milestones WHERE id = $1`,
    [milestoneId],
  );
  if (!rows[0]) throw new Error("Milestone not found");
  const taskId = String(rows[0].task_id);
  await assertTaskAccess(taskId, userId);
  if (rows[0].status === "approved") throw new Error("Cannot delete an approved milestone");
  await pool.query(`DELETE FROM kanban_task_milestones WHERE id = $1`, [milestoneId]);
  return taskId;
}

export async function saveTaskAttachment(
  uploaderId: string,
  taskId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  options?: { messageId?: string | null; milestoneId?: string | null; messageBody?: string },
): Promise<{ attachment: KanbanTaskAttachment; message?: KanbanTaskMessage }> {
  await assertTaskAccess(taskId, uploaderId);
  if (file.size <= 0) throw new Error("Empty file");
  if (file.size > getTaskMaxFileBytes()) {
    throw new Error(`File exceeds limit of ${getTaskMaxFileBytes()} bytes`);
  }

  await ensureTaskParticipant(taskId, uploaderId, "contributor");

  let message: KanbanTaskMessage | undefined;
  let messageId = options?.messageId || null;
  if (!messageId) {
    const body = options?.messageBody?.trim()
      || `📎 ${decodeUploadFilename(file.originalname)}`;
    message = await addTaskMessage(taskId, uploaderId, body, options?.milestoneId);
    messageId = message.id;
  }

  const id = makeId("ktfile");
  const displayName = decodeUploadFilename(file.originalname);
  const safeBase = safeStoredBasename(displayName);
  const storedName = `${id}_${safeBase}`;
  const dir = taskFileDir(taskId);
  const storagePath = path.join(dir, storedName);
  fs.writeFileSync(storagePath, file.buffer, { mode: 0o640 });

  await pool.query(
    `INSERT INTO kanban_task_attachments (
       id, task_id, message_id, milestone_id, uploaded_by,
       original_name, stored_name, mime_type, size_bytes, storage_path
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      taskId,
      messageId,
      options?.milestoneId || null,
      uploaderId,
      displayName,
      storedName,
      file.mimetype || null,
      file.size,
      storagePath,
    ],
  );

  const attachments = await listTaskAttachments(taskId);
  const attachment = attachments.find(a => a.id === id);
  if (!attachment) throw new Error("Attachment save failed");
  return { attachment, message };
}

export async function getTaskAttachmentForDownload(
  attachmentId: string,
  userId: string,
): Promise<{ storagePath: string; originalName: string; mimeType: string | null }> {
  const { rows } = await pool.query(
    `SELECT a.storage_path, a.original_name, a.mime_type, a.task_id, t.board_id
     FROM kanban_task_attachments a
     JOIN kanban_tasks t ON t.id = a.task_id
     WHERE a.id = $1`,
    [attachmentId],
  );
  const row = rows[0];
  if (!row) throw new Error("Attachment not found");
  if (!(await userCanAccessBoard(String(row.board_id), userId))) throw new Error("Forbidden");
  if (!fs.existsSync(String(row.storage_path))) throw new Error("File missing on disk");
  return {
    storagePath: String(row.storage_path),
    originalName: decodeUploadFilename(String(row.original_name)),
    mimeType: row.mime_type != null ? String(row.mime_type) : null,
  };
}

export async function deleteTaskAttachment(attachmentId: string, userId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT a.*, t.board_id
     FROM kanban_task_attachments a
     JOIN kanban_tasks t ON t.id = a.task_id
     WHERE a.id = $1`,
    [attachmentId],
  );
  const row = rows[0];
  if (!row) throw new Error("Attachment not found");
  if (!(await userCanAccessBoard(String(row.board_id), userId))) throw new Error("Forbidden");
  if (String(row.uploaded_by) !== userId) {
    // board owner may also delete — check via board
    const board = await pool.query(`SELECT owner_id FROM kanban_boards WHERE id = $1`, [row.board_id]);
    if (board.rows[0]?.owner_id !== userId) throw new Error("Forbidden");
  }
  await pool.query(`DELETE FROM kanban_task_attachments WHERE id = $1`, [attachmentId]);
  try {
    if (fs.existsSync(String(row.storage_path))) fs.unlinkSync(String(row.storage_path));
  } catch {
    /* ignore disk errors after DB delete */
  }
  return String(row.task_id);
}

export async function getTaskParticipantIds(taskId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT user_id FROM kanban_task_participants WHERE task_id = $1`,
    [taskId],
  );
  const ids = new Set(rows.map(r => String(r.user_id)));
  const task = await getTaskById(taskId);
  if (task) {
    ids.add(task.creator_id);
    if (task.assignee_id) ids.add(task.assignee_id);
  }
  return [...ids];
}
