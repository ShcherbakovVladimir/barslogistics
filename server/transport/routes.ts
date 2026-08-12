import type { Express } from "express";
import multer from "multer";
import { requireAuth, requireMinRole, getClientIp, type AuthRequest } from "../auth.js";
import { insertEventLog } from "../repositories.js";
import type { TransportAssetInput, TransportPurpose } from "../../src/types.js";
import { getTransportMaxFileBytes } from "./files.js";
import {
  createTransportAsset,
  deleteTransportAsset,
  getAllTransportAssets,
  getTransportAssetById,
  updateTransportAsset,
} from "./repository.js";
import {
  deleteTransportPhoto,
  getTransportPhotoFile,
  saveTransportPhoto,
} from "./photos.js";

type BroadcastFn = (data: unknown) => void;

async function logTransportEvent(req: AuthRequest, action: string, details: string): Promise<void> {
  await insertEventLog({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    user_id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action,
    category: "import",
    details,
    ip_address: getClientIp(req),
  });
}

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getTransportMaxFileBytes() },
});

export function registerTransportAssetRoutes(app: Express, broadcast: BroadcastFn): void {
  app.get("/api/transport-assets", requireAuth, async (req, res) => {
    try {
      const all = req.query.all === "1" || req.query.all === "true";
      const purposeRaw = typeof req.query.purpose === "string" ? req.query.purpose : "all";
      const purpose =
        purposeRaw === "shipment" || purposeRaw === "site" || purposeRaw === "both" || purposeRaw === "all"
          ? (purposeRaw as TransportPurpose | "all")
          : "all";
      const siteId = typeof req.query.site_id === "string" ? req.query.site_id : undefined;
      const data = await getAllTransportAssets({
        activeOnly: !all,
        purpose,
        siteId,
      });
      res.json({ status: "success", data });
    } catch (error) {
      console.error("GET /api/transport-assets:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/transport-assets/:id", requireAuth, async (req, res) => {
    try {
      const data = await getTransportAssetById(req.params.id);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json({ status: "success", data });
    } catch (error) {
      console.error("GET /api/transport-assets/:id:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/transport-assets", requireAuth, requireMinRole("manager"), async (req, res) => {
    const { st } = req as AuthRequest;
    try {
      const body = req.body as TransportAssetInput;
      if (!body.name?.trim() || !body.type_key?.trim()) {
        return res.status(400).json({ error: st("transport.validationRequired") });
      }
      const created = await createTransportAsset(body);
      await logTransportEvent(req as AuthRequest, st("transport.logCreate"), `${created.name} (${created.id})`);
      broadcast({ type: "TRANSPORT_ASSETS_UPDATED" });
      res.status(201).json({ status: "success", data: created });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Database error";
      if (
        msg === "Invalid purpose" ||
        msg === "Invalid type_key" ||
        msg === "Invalid category for type" ||
        msg === "Name is required"
      ) {
        return res.status(400).json({ error: msg });
      }
      console.error("POST /api/transport-assets:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/transport-assets/:id", requireAuth, requireMinRole("manager"), async (req, res) => {
    const { st } = req as AuthRequest;
    try {
      const updated = await updateTransportAsset(req.params.id, req.body as Partial<TransportAssetInput>);
      if (!updated) return res.status(404).json({ error: st("transport.notFound") });
      await logTransportEvent(req as AuthRequest, st("transport.logUpdate"), `${updated.name} (${updated.id})`);
      broadcast({ type: "TRANSPORT_ASSETS_UPDATED" });
      res.json({ status: "success", data: updated });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Database error";
      if (
        msg === "Invalid purpose" ||
        msg === "Invalid type_key" ||
        msg === "Invalid category for type" ||
        msg === "Name is required"
      ) {
        return res.status(400).json({ error: msg });
      }
      console.error("PUT /api/transport-assets/:id:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/transport-assets/:id", requireAuth, requireMinRole("manager"), async (req, res) => {
    const { st } = req as AuthRequest;
    try {
      const result = await deleteTransportAsset(req.params.id);
      if (!result.ok) return res.status(404).json({ error: result.error || st("transport.notFound") });
      await logTransportEvent(req as AuthRequest, st("transport.logDelete"), req.params.id);
      broadcast({ type: "TRANSPORT_ASSETS_UPDATED" });
      res.json({ status: "success", soft: result.soft ?? false });
    } catch (error) {
      console.error("DELETE /api/transport-assets/:id:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/transport-assets/:id/photo", requireAuth, async (req, res) => {
    try {
      const file = await getTransportPhotoFile(req.params.id);
      if (!file) return res.status(404).json({ error: "Photo not found" });
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "private, max-age=86400");
      if (file.updatedAt) res.setHeader("Last-Modified", file.updatedAt);
      res.sendFile(file.absolutePath);
    } catch (error) {
      console.error("GET /api/transport-assets/:id/photo:", error);
      res.status(500).json({ error: "Failed to load photo" });
    }
  });

  app.post(
    "/api/transport-assets/:id/photo",
    requireAuth,
    requireMinRole("manager"),
    (req, res, next) => {
      photoUpload.single("file")(req, res, (err: unknown) => {
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
        const file = req.file;
        if (!file) return res.status(400).json({ error: "file is required" });
        await saveTransportPhoto(req.params.id, file);
        const data = await getTransportAssetById(req.params.id);
        if (!data) return res.status(404).json({ error: "Not found" });
        broadcast({ type: "TRANSPORT_ASSETS_UPDATED" });
        res.json({ status: "success", data });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Upload failed";
        if (
          msg === "Transport asset not found" ||
          msg === "INVALID_IMAGE_TYPE" ||
          msg === "FILE_TOO_LARGE" ||
          msg === "file is required"
        ) {
          return res.status(msg === "Transport asset not found" ? 404 : 400).json({ error: msg });
        }
        console.error("POST /api/transport-assets/:id/photo:", error);
        res.status(500).json({ error: "Failed to save photo" });
      }
    },
  );

  app.delete("/api/transport-assets/:id/photo", requireAuth, requireMinRole("manager"), async (req, res) => {
    try {
      await deleteTransportPhoto(req.params.id);
      const data = await getTransportAssetById(req.params.id);
      if (!data) return res.status(404).json({ error: "Not found" });
      broadcast({ type: "TRANSPORT_ASSETS_UPDATED" });
      res.json({ status: "success", data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delete failed";
      if (msg === "Transport asset not found") return res.status(404).json({ error: msg });
      console.error("DELETE /api/transport-assets/:id/photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });
}
