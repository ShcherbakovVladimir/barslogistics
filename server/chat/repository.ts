import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pool } from "../db.js";
import type { ChatAttachment, ChatConversationSummary, ChatMessage, ChatUserDirectoryEntry, UserRole } from "../../src/types.js";
import { decodeUploadFilename, safeStoredBasename } from "./filename.js";

const MAX_BODY_LENGTH = 8000;

export function getChatFilesDir(): string {
  const dir = process.env.CHAT_FILES_DIR || path.join(process.cwd(), "data", "chat-files");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getChatMaxFileBytes(): number {
  return Number(process.env.CHAT_MAX_FILE_BYTES) || 20 * 1024 * 1024;
}

function orderedPair(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

function conversationIdFor(userId1: string, userId2: string): string {
  const [a, b] = orderedPair(userId1, userId2);
  return `conv_${a}_${b}`;
}

function isParticipant(conversationId: string, userId: string, userA: string, userB: string): boolean {
  return conversationId === conversationIdFor(userA, userB) && (userId === userA || userId === userB);
}

type ConversationRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: Date;
  updated_at: Date;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_id: string | null;
  created_at: Date;
  read_at: Date | null;
  sender_name: string | null;
  sender_username: string | null;
  att_original_name: string | null;
  att_mime_type: string | null;
  att_size_bytes: string | null;
};

function mapMessage(row: MessageRow, viewerId: string): ChatMessage {
  const attachment: ChatAttachment | null = row.attachment_id
    ? {
        id: row.attachment_id,
        original_name: decodeUploadFilename(row.att_original_name || "file"),
        mime_type: row.att_mime_type,
        size_bytes: Number(row.att_size_bytes ?? 0),
      }
    : null;

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_name: row.sender_name || row.sender_username || row.sender_id,
    sender_username: row.sender_username || row.sender_id,
    body: row.body,
    attachment,
    created_at: row.created_at.toISOString(),
    read_at: row.read_at ? row.read_at.toISOString() : null,
    is_own: row.sender_id === viewerId,
  };
}

export async function getChatDirectory(currentUserId: string): Promise<ChatUserDirectoryEntry[]> {
  const { rows } = await pool.query<{
    id: string;
    username: string;
    name: string | null;
    role: UserRole;
    has_conversation: boolean;
    has_avatar: boolean;
    avatar_updated_at: Date | null;
  }>(
    `SELECT u.id, u.username, u.name, u.role,
            (u.avatar_path IS NOT NULL AND u.avatar_path <> '') AS has_avatar,
            u.avatar_updated_at,
            EXISTS (
              SELECT 1 FROM chat_conversations c
              WHERE (c.user_a_id = u.id AND c.user_b_id = $1)
                 OR (c.user_b_id = u.id AND c.user_a_id = $1)
            ) AS has_conversation
     FROM users u
     WHERE u.id <> $1
     ORDER BY COALESCE(u.name, u.username)`,
    [currentUserId],
  );

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    name: row.name || row.username,
    role: row.role,
    has_conversation: row.has_conversation,
    has_avatar: Boolean(row.has_avatar),
    avatar_version: row.has_avatar && row.avatar_updated_at
      ? new Date(row.avatar_updated_at).toISOString()
      : undefined,
  }));
}

export async function listConversations(currentUserId: string): Promise<ChatConversationSummary[]> {
  const { rows } = await pool.query<{
    id: string;
    user_a_id: string;
    user_b_id: string;
    updated_at: Date;
    peer_id: string;
    peer_name: string | null;
    peer_username: string;
    peer_role: UserRole;
    peer_has_avatar: boolean;
    peer_avatar_updated_at: Date | null;
    last_body: string | null;
    last_at: Date | null;
    unread_count: string;
  }>(
    `SELECT c.id, c.user_a_id, c.user_b_id, c.updated_at,
            CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END AS peer_id,
            u.name AS peer_name,
            u.username AS peer_username,
            u.role AS peer_role,
            (u.avatar_path IS NOT NULL AND u.avatar_path <> '') AS peer_has_avatar,
            u.avatar_updated_at AS peer_avatar_updated_at,
            lm.body AS last_body,
            lm.created_at AS last_at,
            COALESCE((
              SELECT COUNT(*)::text FROM chat_messages um
              WHERE um.conversation_id = c.id
                AND um.sender_id <> $1
                AND um.read_at IS NULL
            ), '0') AS unread_count
     FROM chat_conversations c
     JOIN users u ON u.id = CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END
     LEFT JOIN LATERAL (
       SELECT body, created_at FROM chat_messages m
       WHERE m.conversation_id = c.id
       ORDER BY m.created_at DESC
       LIMIT 1
     ) lm ON TRUE
     WHERE c.user_a_id = $1 OR c.user_b_id = $1
     ORDER BY c.updated_at DESC`,
    [currentUserId],
  );

  return rows.map((row) => ({
    id: row.id,
    peer_id: row.peer_id,
    peer_name: row.peer_name || row.peer_username,
    peer_username: row.peer_username,
    peer_role: row.peer_role,
    peer_has_avatar: Boolean(row.peer_has_avatar),
    peer_avatar_version: row.peer_has_avatar && row.peer_avatar_updated_at
      ? new Date(row.peer_avatar_updated_at).toISOString()
      : undefined,
    last_message: row.last_body ?? undefined,
    last_message_at: row.last_at?.toISOString(),
    unread_count: Number.parseInt(row.unread_count, 10) || 0,
  }));
}

export async function getOrCreateConversation(
  currentUserId: string,
  peerUserId: string,
): Promise<ConversationRow> {
  if (currentUserId === peerUserId) {
    throw new Error("Cannot chat with yourself");
  }

  const peerCheck = await pool.query("SELECT id FROM users WHERE id = $1", [peerUserId]);
  if (!peerCheck.rows[0]) throw new Error("User not found");

  const [userA, userB] = orderedPair(currentUserId, peerUserId);
  const id = conversationIdFor(currentUserId, peerUserId);

  const existing = await pool.query<ConversationRow>(
    "SELECT * FROM chat_conversations WHERE id = $1",
    [id],
  );
  if (existing.rows[0]) return existing.rows[0];

  const { rows } = await pool.query<ConversationRow>(
    `INSERT INTO chat_conversations (id, user_a_id, user_b_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_a_id, user_b_id) DO UPDATE SET updated_at = chat_conversations.updated_at
     RETURNING *`,
    [id, userA, userB],
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to create conversation");
  return row;
}

export async function assertConversationAccess(
  conversationId: string,
  userId: string,
): Promise<ConversationRow> {
  const { rows } = await pool.query<ConversationRow>(
    "SELECT * FROM chat_conversations WHERE id = $1",
    [conversationId],
  );
  const conv = rows[0];
  if (!conv) throw new Error("Conversation not found");
  if (conv.user_a_id !== userId && conv.user_b_id !== userId) {
    throw new Error("Forbidden");
  }
  return conv;
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  options: { limit?: number; before?: string } = {},
): Promise<ChatMessage[]> {
  await assertConversationAccess(conversationId, userId);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);

  const params: unknown[] = [conversationId];
  let beforeClause = "";
  if (options.before) {
    params.push(options.before);
    beforeClause = `AND m.created_at < (SELECT created_at FROM chat_messages WHERE id = $${params.length})`;
  }
  params.push(limit);

  const { rows } = await pool.query<MessageRow>(
    `SELECT m.*, u.name AS sender_name, u.username AS sender_username,
            a.original_name AS att_original_name, a.mime_type AS att_mime_type, a.size_bytes AS att_size_bytes
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN chat_attachments a ON a.id = m.attachment_id
     WHERE m.conversation_id = $1 ${beforeClause}
     ORDER BY m.created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return rows.reverse().map((row) => mapMessage(row, userId));
}

export async function insertChatMessage(
  conversationId: string,
  senderId: string,
  body: string,
  attachmentId?: string | null,
): Promise<ChatMessage> {
  const trimmed = body.trim();
  if (!trimmed && !attachmentId) {
    throw new Error("Message body or attachment required");
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error("Message too long");
  }

  await assertConversationAccess(conversationId, senderId);
  const id = `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  await pool.query(
    `INSERT INTO chat_messages (id, conversation_id, sender_id, body, attachment_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, conversationId, senderId, trimmed, attachmentId ?? null],
  );

  await pool.query(
    "UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1",
    [conversationId],
  );

  const messages = await getConversationMessages(conversationId, senderId, { limit: 1 });
  const message = messages.find((m) => m.id === id);
  if (!message) throw new Error("Failed to load created message");
  return message;
}

export async function markConversationRead(conversationId: string, readerId: string): Promise<number> {
  await assertConversationAccess(conversationId, readerId);
  const result = await pool.query(
    `UPDATE chat_messages
     SET read_at = NOW()
     WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
    [conversationId, readerId],
  );
  return result.rowCount ?? 0;
}

export async function saveChatAttachment(
  uploaderId: string,
  conversationId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
): Promise<ChatAttachment> {
  await assertConversationAccess(conversationId, uploaderId);

  if (file.size <= 0) throw new Error("Empty file");
  if (file.size > getChatMaxFileBytes()) {
    throw new Error(`File exceeds limit of ${getChatMaxFileBytes()} bytes`);
  }

  const id = `chatf_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const displayName = decodeUploadFilename(file.originalname);
  const safeBase = safeStoredBasename(displayName);
  const storedName = `${id}_${safeBase}`;
  const convDir = path.join(getChatFilesDir(), conversationId);
  fs.mkdirSync(convDir, { recursive: true });
  const storagePath = path.join(convDir, storedName);
  fs.writeFileSync(storagePath, file.buffer);

  await pool.query(
    `INSERT INTO chat_attachments (id, uploader_id, original_name, stored_name, mime_type, size_bytes, storage_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, uploaderId, displayName, storedName, file.mimetype || null, file.size, storagePath],
  );

  return {
    id,
    original_name: displayName,
    mime_type: file.mimetype || null,
    size_bytes: file.size,
  };
}

export async function getAttachmentForDownload(
  attachmentId: string,
  userId: string,
): Promise<{ storagePath: string; originalName: string; mimeType: string | null }> {
  const { rows } = await pool.query<{
    storage_path: string;
    original_name: string;
    mime_type: string | null;
    conversation_id: string;
    user_a_id: string;
    user_b_id: string;
  }>(
    `SELECT a.storage_path, a.original_name, a.mime_type, m.conversation_id, c.user_a_id, c.user_b_id
     FROM chat_attachments a
     JOIN chat_messages m ON m.attachment_id = a.id
     JOIN chat_conversations c ON c.id = m.conversation_id
     WHERE a.id = $1`,
    [attachmentId],
  );
  const row = rows[0];
  if (!row) throw new Error("Attachment not found");
  if (row.user_a_id !== userId && row.user_b_id !== userId) {
    throw new Error("Forbidden");
  }
  if (!fs.existsSync(row.storage_path)) throw new Error("File missing on disk");
  return {
    storagePath: row.storage_path,
    originalName: decodeUploadFilename(row.original_name),
    mimeType: row.mime_type,
  };
}

export function conversationParticipantIds(conv: ConversationRow): string[] {
  return [conv.user_a_id, conv.user_b_id];
}

export { isParticipant, conversationIdFor };
