import type { Express } from "express";
import path from "path";
import multer from "multer";
import {
  assertConversationAccess,
  conversationParticipantIds,
  getAttachmentForDownload,
  getChatDirectory,
  getChatMaxFileBytes,
  getConversationMessages,
  getOrCreateConversation,
  insertChatMessage,
  listConversations,
  markConversationRead,
  saveChatAttachment,
} from "./repository.js";
import { contentDispositionAttachment, decodeUploadFilename } from "./filename.js";
import { broadcastChatToUsers } from "./broadcast.js";
import { notifyChatRecipientsViaWebPush } from "../push/send.js";
import { notifyUsers } from "../notifications/service.js";
import { getServerT } from "../../src/i18n/translations.js";
import { requireAuth, type AuthRequest } from "../auth.js";
import { requireRouteParam } from "../security/validate.js";

const st = getServerT("ru");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getChatMaxFileBytes() },
});

function dispatchChatMessage(
  conv: Awaited<ReturnType<typeof assertConversationAccess>>,
  senderId: string,
  conversationId: string,
  message: Awaited<ReturnType<typeof insertChatMessage>>,
): void {
  const participantIds = conversationParticipantIds(conv);
  broadcastChatToUsers(participantIds, {
    type: "CHAT_MESSAGE",
    conversation_id: conversationId,
    message,
    participant_ids: participantIds,
  });
  void notifyChatRecipientsViaWebPush({
    conversationId,
    senderName: message.sender_name,
    body: message.body,
    recipientIds: participantIds.filter((id) => id !== senderId),
  });
  const recipients = participantIds.filter((id) => id !== senderId);
  const preview = message.body.trim().slice(0, 160) || "…";
  void notifyUsers(recipients, {
    title: st("notifications.chatTitle"),
    message: st("notifications.chatMessage", {
      name: message.sender_name,
      preview,
    }),
    type: "info",
    linkType: "chat",
    linkId: conversationId,
  });
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/chat/users", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const data = await getChatDirectory(user.id);
      res.json({ status: "success", data });
    } catch (error) {
      console.error("GET /api/chat/users:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/chat/conversations", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const data = await listConversations(user.id);
      res.json({ status: "success", data });
    } catch (error) {
      console.error("GET /api/chat/conversations:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/chat/conversations", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const peerId = String(req.body?.peer_id || req.body?.user_id || "");
      if (!peerId) return res.status(400).json({ error: "peer_id required" });
      const conv = await getOrCreateConversation(user.id, peerId);
      const messages = await getConversationMessages(conv.id, user.id, { limit: 50 });
      res.json({ status: "success", data: { conversation_id: conv.id, messages } });
    } catch (error) {
      console.error("POST /api/chat/conversations:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed" });
    }
  });

  app.get("/api/chat/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const before = req.query.before ? String(req.query.before) : undefined;
      const data = await getConversationMessages(id, user.id, { limit, before });
      res.json({ status: "success", data });
    } catch (error) {
      console.error("GET /api/chat/conversations/:id/messages:", error);
      res.status(error instanceof Error && error.message === "Forbidden" ? 403 : 404).json({
        error: error instanceof Error ? error.message : "Not found",
      });
    }
  });

  app.post("/api/chat/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const body = String(req.body?.body ?? "");
      const conv = await assertConversationAccess(id, user.id);
      const message = await insertChatMessage(id, user.id, body);
      dispatchChatMessage(conv, user.id, id, message);
      res.status(201).json({ status: "success", data: message });
    } catch (error) {
      console.error("POST /api/chat/conversations/:id/messages:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed" });
    }
  });

  app.post(
    "/api/chat/conversations/:id/attachments",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
        const user = (req as AuthRequest).user;
        const conv = await assertConversationAccess(id, user.id);
        const file = req.file;
        if (!file) return res.status(400).json({ error: "file required" });

        const attachment = await saveChatAttachment(user.id, id, {
          originalname: decodeUploadFilename(file.originalname),
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        });

        const body = String(req.body?.body ?? "").trim() || `📎 ${attachment.original_name}`;
        const message = await insertChatMessage(id, user.id, body, attachment.id);
        dispatchChatMessage(conv, user.id, id, message);
        res.status(201).json({ status: "success", data: message });
      } catch (error) {
        console.error("POST /api/chat/conversations/:id/attachments:", error);
        res.status(400).json({ error: error instanceof Error ? error.message : "Upload failed" });
      }
    },
  );

  app.post("/api/chat/conversations/:id/read", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const conv = await assertConversationAccess(id, user.id);
      const updated = await markConversationRead(id, user.id);
      const participantIds = conversationParticipantIds(conv);
      broadcastChatToUsers(participantIds, {
        type: "CHAT_READ",
        conversation_id: id,
        reader_id: user.id,
        participant_ids: participantIds,
      });
      res.json({ status: "success", data: { updated } });
    } catch (error) {
      console.error("POST /api/chat/conversations/:id/read:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed" });
    }
  });

  app.get("/api/chat/attachments/:id/download", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const file = await getAttachmentForDownload(id, user.id);
      if (file.mimeType) res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", contentDispositionAttachment(file.originalName));
      res.sendFile(path.resolve(file.storagePath));
    } catch (error) {
      console.error("GET /api/chat/attachments/:id/download:", error);
      res.status(404).json({ error: error instanceof Error ? error.message : "Not found" });
    }
  });
}
