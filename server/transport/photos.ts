import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pool } from "../db.js";
import { decodeUploadFilename, safeStoredBasename } from "../chat/filename.js";
import { getTransportFilesDir, getTransportMaxFileBytes, transportFileAbsolutePath } from "./files.js";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export type TransportPhotoFile = {
  absolutePath: string;
  mimeType: string;
  updatedAt: string | null;
};

function unlinkQuiet(filePath: string | null | undefined): void {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

export async function getTransportPhotoFile(assetId: string): Promise<TransportPhotoFile | null> {
  const { rows } = await pool.query<{
    photo_path: string | null;
    photo_mime: string | null;
    photo_updated_at: Date | null;
  }>("SELECT photo_path, photo_mime, photo_updated_at FROM transport_assets WHERE id = $1", [assetId]);
  const row = rows[0];
  if (!row?.photo_path) return null;
  const absolutePath = transportFileAbsolutePath(row.photo_path);
  if (!fs.existsSync(absolutePath)) return null;
  return {
    absolutePath,
    mimeType: row.photo_mime || "image/jpeg",
    updatedAt: row.photo_updated_at ? new Date(row.photo_updated_at).toUTCString() : null,
  };
}

export async function saveTransportPhoto(
  assetId: string,
  file: Express.Multer.File,
): Promise<{ photo_updated_at: string }> {
  if (!file?.buffer?.length) throw new Error("file is required");
  if (file.size > getTransportMaxFileBytes()) throw new Error("FILE_TOO_LARGE");

  const mime = String(file.mimetype || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) throw new Error("INVALID_IMAGE_TYPE");

  const existing = await pool.query<{ photo_path: string | null }>(
    "SELECT photo_path FROM transport_assets WHERE id = $1",
    [assetId],
  );
  if (!existing.rows[0]) throw new Error("Transport asset not found");

  const original = decodeUploadFilename(file.originalname);
  const stem = safeStoredBasename(original).replace(/\.[^.]+$/, "") || "photo";
  const ext = EXT_BY_MIME[mime] || path.extname(stem) || ".jpg";
  const storedName = `${assetId}_${crypto.randomBytes(4).toString("hex")}_${stem}${ext}`;
  const absPath = path.join(getTransportFilesDir(), storedName);

  fs.writeFileSync(absPath, file.buffer, { mode: 0o640 });

  const prevPath = existing.rows[0].photo_path;
  if (prevPath) {
    try {
      unlinkQuiet(transportFileAbsolutePath(prevPath));
    } catch {
      /* ignore */
    }
  }

  const { rows } = await pool.query<{ photo_updated_at: Date }>(
    `UPDATE transport_assets
     SET photo_path = $2,
         photo_mime = $3,
         photo_updated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING photo_updated_at`,
    [assetId, storedName, mime],
  );

  return { photo_updated_at: new Date(rows[0].photo_updated_at).toISOString() };
}

export async function deleteTransportPhoto(assetId: string): Promise<boolean> {
  const { rows } = await pool.query<{ photo_path: string | null }>(
    "SELECT photo_path FROM transport_assets WHERE id = $1",
    [assetId],
  );
  const row = rows[0];
  if (!row) throw new Error("Transport asset not found");
  if (!row.photo_path) return false;

  try {
    unlinkQuiet(transportFileAbsolutePath(row.photo_path));
  } catch {
    /* ignore */
  }

  await pool.query(
    `UPDATE transport_assets
     SET photo_path = NULL, photo_mime = NULL, photo_updated_at = NULL, updated_at = NOW()
     WHERE id = $1`,
    [assetId],
  );
  return true;
}

export async function unlinkTransportPhotoFile(storedName: string | null | undefined): Promise<void> {
  if (!storedName) return;
  try {
    unlinkQuiet(transportFileAbsolutePath(storedName));
  } catch {
    /* ignore */
  }
}
