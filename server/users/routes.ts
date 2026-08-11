import type { Express } from "express";
import multer from "multer";
import { requireAuth, type AuthRequest } from "../auth.js";
import { getUserById } from "../repositories.js";
import { deleteUserAvatar, getUserAvatarFile, saveUserAvatar } from "./avatars.js";
import { getAvatarMaxFileBytes } from "./files.js";

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getAvatarMaxFileBytes() },
});

function canManageAvatar(actorId: string, actorRole: string, targetId: string): boolean {
  return actorId === targetId || actorRole === "admin";
}

export function registerUserAvatarRoutes(app: Express): void {
  app.get("/api/users/:id/avatar", requireAuth, async (req, res) => {
    try {
      const file = await getUserAvatarFile(req.params.id);
      if (!file) return res.status(404).json({ error: "Avatar not found" });
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "private, max-age=86400");
      if (file.updatedAt) res.setHeader("Last-Modified", new Date(file.updatedAt).toUTCString());
      res.sendFile(file.absolutePath);
    } catch (error) {
      console.error("GET /api/users/:id/avatar:", error);
      res.status(500).json({ error: "Failed to load avatar" });
    }
  });

  app.post(
    "/api/users/:id/avatar",
    requireAuth,
    (req, res, next) => {
      avatarUpload.single("file")(req, res, (err: unknown) => {
        if (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          if (String(msg).includes("File too large") || String(msg).includes("LIMIT_FILE_SIZE")) {
            return res.status(400).json({ error: "FILE_TOO_LARGE" });
          }
          return res.status(400).json({ error: msg });
        }
        next();
      });
    },
    async (req, res) => {
      try {
        const actor = (req as AuthRequest).user;
        const targetId = req.params.id;
        if (!canManageAvatar(actor.id, actor.role, targetId)) {
          return res.status(403).json({ error: "Forbidden" });
        }
        const target = await getUserById(targetId);
        if (!target) return res.status(404).json({ error: "User not found" });
        const file = req.file;
        if (!file) return res.status(400).json({ error: "file is required" });

        await saveUserAvatar(targetId, file);
        const user = await getUserById(targetId);
        res.json({ status: "success", data: user ?? target });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Upload failed";
        if (msg === "User not found") return res.status(404).json({ error: msg });
        if (msg === "INVALID_IMAGE_TYPE" || msg === "FILE_TOO_LARGE" || msg === "file is required") {
          return res.status(400).json({ error: msg });
        }
        console.error("POST /api/users/:id/avatar:", error);
        res.status(500).json({ error: "Failed to save avatar" });
      }
    },
  );

  app.delete("/api/users/:id/avatar", requireAuth, async (req, res) => {
    try {
      const actor = (req as AuthRequest).user;
      const targetId = req.params.id;
      if (!canManageAvatar(actor.id, actor.role, targetId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await deleteUserAvatar(targetId);
      const user = await getUserById(targetId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ status: "success", data: user });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delete failed";
      if (msg === "User not found") return res.status(404).json({ error: msg });
      console.error("DELETE /api/users/:id/avatar:", error);
      res.status(500).json({ error: "Failed to delete avatar" });
    }
  });
}
