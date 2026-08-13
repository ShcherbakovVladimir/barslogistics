import type { Express } from "express";
import { requireAuth, type AuthRequest } from "../auth.js";
import { requireRouteParam } from "../security/validate.js";
import {
  countUnreadNotifications,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  softDeleteAllNotifications,
  softDeleteNotification,
} from "./repository.js";
import { emitNotificationUpdated } from "./service.js";

export function registerNotificationRoutes(app: Express): void {
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const limit = req.query.limit ? Number(req.query.limit) : 80;
      const data = await listUserNotifications(user.id, { limit });
      const unread = await countUnreadNotifications(user.id);
      res.json({ status: "success", data: { items: data, unread } });
    } catch (error) {
      console.error("GET /api/notifications:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const item = await markNotificationRead(user.id, id);
      if (!item) return res.status(404).json({ error: "Not found" });
      emitNotificationUpdated(user.id, item);
      res.json({ status: "success", data: item });
    } catch (error) {
      console.error("POST /api/notifications/:id/read:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const updated = await markAllNotificationsRead(user.id);
      const items = await listUserNotifications(user.id);
      res.json({ status: "success", data: { updated, items } });
    } catch (error) {
      console.error("POST /api/notifications/read-all:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const item = await softDeleteNotification(user.id, id);
      if (!item) return res.status(404).json({ error: "Not found" });
      emitNotificationUpdated(user.id, item);
      res.json({ status: "success", data: item });
    } catch (error) {
      console.error("DELETE /api/notifications/:id:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const deleted = await softDeleteAllNotifications(user.id);
      res.json({ status: "success", data: { deleted } });
    } catch (error) {
      console.error("DELETE /api/notifications:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
}
