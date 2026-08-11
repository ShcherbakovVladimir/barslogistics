import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pool } from "../db.js";
import { decodeUploadFilename, safeStoredBasename } from "../chat/filename.js";
import { avatarFileAbsolutePath, getAvatarFilesDir, getAvatarMaxFileBytes } from "./files.js";

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

export type UserAvatarFile = {
  absolutePath: string;
  mimeType: string;
  updatedAt: string | null;
};

function unlinkQuiet(filePath: string | null | undefined): void {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore missing file */
  }
}

export async function getUserAvatarFile(userId: string): Promise<UserAvatarFile | null> {
  const { rows } = await pool.query<{
    avatar_path: string | null;
    avatar_mime: string | null;
    avatar_updated_at: Date | null;
  }>("SELECT avatar_path, avatar_mime, avatar_updated_at FROM users WHERE id = $1", [userId]);
  const row = rows[0];
  if (!row?.avatar_path) return null;
  const absolutePath = avatarFileAbsolutePath(row.avatar_path);
  if (!fs.existsSync(absolutePath)) return null;
  return {
    absolutePath,
    mimeType: row.avatar_mime || "image/jpeg",
    updatedAt: row.avatar_updated_at ? new Date(row.avatar_updated_at).toISOString() : null,
  };
}

export async function saveUserAvatar(
  userId: string,
  file: Express.Multer.File,
): Promise<{ has_avatar: boolean; avatar_version: string }> {
  if (!file?.buffer?.length) throw new Error("file is required");
  if (file.size > getAvatarMaxFileBytes()) throw new Error("FILE_TOO_LARGE");

  const mime = String(file.mimetype || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) throw new Error("INVALID_IMAGE_TYPE");

  const existing = await pool.query<{ avatar_path: string | null }>(
    "SELECT avatar_path FROM users WHERE id = $1",
    [userId],
  );
  if (!existing.rows[0]) throw new Error("User not found");

  const original = decodeUploadFilename(file.originalname);
  const stem = safeStoredBasename(original).replace(/\.[^.]+$/, "") || "avatar";
  const ext = EXT_BY_MIME[mime] || path.extname(stem) || ".jpg";
  const storedName = `${userId}_${crypto.randomBytes(4).toString("hex")}_${stem}${ext}`;
  const absPath = path.join(getAvatarFilesDir(), storedName);

  fs.writeFileSync(absPath, file.buffer, { mode: 0o640 });

  const prevPath = existing.rows[0].avatar_path;
  if (prevPath) {
    try {
      unlinkQuiet(avatarFileAbsolutePath(prevPath));
    } catch {
      /* ignore */
    }
  }

  const { rows } = await pool.query<{ avatar_updated_at: Date }>(
    `UPDATE users
     SET avatar_path = $2,
         avatar_mime = $3,
         avatar_updated_at = NOW()
     WHERE id = $1
     RETURNING avatar_updated_at`,
    [userId, storedName, mime],
  );

  return {
    has_avatar: true,
    avatar_version: new Date(rows[0].avatar_updated_at).toISOString(),
  };
}

export async function deleteUserAvatar(userId: string): Promise<boolean> {
  const { rows } = await pool.query<{ avatar_path: string | null }>(
    "SELECT avatar_path FROM users WHERE id = $1",
    [userId],
  );
  const row = rows[0];
  if (!row) throw new Error("User not found");
  if (!row.avatar_path) return false;

  try {
    unlinkQuiet(avatarFileAbsolutePath(row.avatar_path));
  } catch {
    /* ignore */
  }

  await pool.query(
    `UPDATE users
     SET avatar_path = NULL, avatar_mime = NULL, avatar_updated_at = NULL
     WHERE id = $1`,
    [userId],
  );
  return true;
}
