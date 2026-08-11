import type { Express } from "express";
import { requireAuth, type AuthRequest } from "../auth.js";
import { deletePushSubscription, upsertPushSubscription } from "./repository.js";
import { configureWebPush, getVapidPublicKey, isWebPushConfigured } from "./vapid.js";

export function registerPushRoutes(app: Express): void {
  configureWebPush();

  app.get("/api/push/vapid-public-key", (_req, res) => {
    const publicKey = getVapidPublicKey();
    // Optional feature: return 200 with enabled=false so browsers don't log a hard 503.
    if (!publicKey) {
      return res.json({ status: "success", data: { public_key: null, enabled: false } });
    }
    res.json({ status: "success", data: { public_key: publicKey, enabled: isWebPushConfigured() } });
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      if (!isWebPushConfigured()) {
        return res.status(503).json({ error: "Web Push is not configured on this server" });
      }

      const user = (req as AuthRequest).user;
      const endpoint = String(req.body?.endpoint ?? "");
      const p256dh = String(req.body?.keys?.p256dh ?? "");
      const auth = String(req.body?.keys?.auth ?? "");

      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: "Invalid push subscription" });
      }

      await upsertPushSubscription(
        user.id,
        { endpoint, keys: { p256dh, auth } },
        req.headers["user-agent"],
      );

      res.status(201).json({ status: "success", data: { subscribed: true } });
    } catch (error) {
      console.error("POST /api/push/subscribe:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.delete("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const endpoint = req.body?.endpoint ? String(req.body.endpoint) : undefined;
      const removed = await deletePushSubscription(user.id, endpoint);
      res.json({ status: "success", data: { removed } });
    } catch (error) {
      console.error("DELETE /api/push/subscribe:", error);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });
}
