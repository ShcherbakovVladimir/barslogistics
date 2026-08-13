import type { Express } from "express";
import path from "path";
import multer from "multer";
import { requireAuth, type AuthRequest } from "../auth.js";
import { requireRouteParam } from "../security/validate.js";
import { contentDispositionAttachment } from "../chat/filename.js";
import { getUserById } from "../repositories.js";
import { scopeSupplyLinkForUser } from "../scoping.js";
import { getShipmentMaxFileBytes } from "./files.js";
import {
  deleteShipmentDocument,
  getShipmentDocumentForDownload,
  listShipmentDocuments,
  saveShipmentDocument,
  updateShipmentLogistics,
} from "./logistics.js";

const shipmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getShipmentMaxFileBytes() },
});

export function registerShipmentLogisticsRoutes(app: Express): void {
  app.get("/api/shipments/:id/documents", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const fullUser = await getUserById(user.id);
      if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
      const data = await listShipmentDocuments(id, fullUser);
      res.json({ status: "success", data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Database error";
      if (msg === "Forbidden") return res.status(403).json({ error: msg });
      if (msg === "Shipment not found") return res.status(404).json({ error: msg });
      console.error("GET /api/shipments/:id/documents:", error);
      res.status(500).json({ error: msg });
    }
  });

  app.post(
    "/api/shipments/:id/documents",
    requireAuth,
    (req, res, next) => {
      shipmentUpload.single("file")(req, res, (err: unknown) => {
        if (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          return res.status(400).json({ error: msg });
        }
        next();
      });
    },
    async (req, res) => {
      try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
        const user = (req as AuthRequest).user;
        const fullUser = await getUserById(user.id);
        if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
        const file = req.file;
        if (!file) return res.status(400).json({ error: "file is required" });
        const doc = await saveShipmentDocument(fullUser, id, file, {
          doc_type: req.body?.doc_type ? String(req.body.doc_type) : undefined,
          note: req.body?.note ? String(req.body.note) : undefined,
        });
        res.status(201).json({ status: "success", data: doc });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Database error";
        if (msg === "Forbidden") return res.status(403).json({ error: msg });
        if (msg === "Shipment not found") return res.status(404).json({ error: msg });
        console.error("POST /api/shipments/:id/documents:", error);
        res.status(500).json({ error: msg });
      }
    },
  );

  app.get("/api/shipments/documents/:id/download", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const fullUser = await getUserById(user.id);
      if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
      const file = await getShipmentDocumentForDownload(id, fullUser);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", contentDispositionAttachment(file.originalName));
      res.sendFile(path.resolve(file.storagePath));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Download failed";
      if (msg === "Forbidden") return res.status(403).json({ error: msg });
      if (msg.includes("not found") || msg.includes("missing")) {
        return res.status(404).json({ error: msg });
      }
      console.error("GET /api/shipments/documents/:id/download:", error);
      res.status(500).json({ error: msg });
    }
  });

  app.delete("/api/shipments/documents/:id", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const fullUser = await getUserById(user.id);
      if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
      const shipmentId = await deleteShipmentDocument(id, fullUser);
      res.json({ status: "success", data: { deleted: true, shipment_id: shipmentId } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Database error";
      if (msg === "Forbidden") return res.status(403).json({ error: msg });
      if (msg.includes("not found")) return res.status(404).json({ error: msg });
      console.error("DELETE /api/shipments/documents/:id:", error);
      res.status(500).json({ error: msg });
    }
  });

  app.patch("/api/shipments/:id/logistics", requireAuth, async (req, res) => {
    try {
      const id = requireRouteParam(req, res, 'id');
      if (!id) return;
      const user = (req as AuthRequest).user;
      const fullUser = await getUserById(user.id);
      if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
      const body = (req.body || {}) as Record<string, unknown>;
      const updated = await updateShipmentLogistics(id, fullUser, body);
      const visible = scopeSupplyLinkForUser(updated, fullUser);
      if (!visible) return res.status(403).json({ error: "Forbidden" });
      res.json({ status: "success", data: visible });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Database error";
      if (msg === "Forbidden") return res.status(403).json({ error: msg });
      if (msg === "Shipment not found") return res.status(404).json({ error: msg });
      if (msg === "Invalid transport_mode" || msg === "Invalid timestamp") {
        return res.status(400).json({ error: msg });
      }
      console.error("PATCH /api/shipments/:id/logistics:", error);
      res.status(500).json({ error: msg });
    }
  });
}
