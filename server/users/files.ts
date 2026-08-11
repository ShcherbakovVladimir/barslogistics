import fs from "fs";
import path from "path";

export function getAvatarFilesDir(): string {
  const dir = process.env.AVATAR_FILES_DIR || path.join(process.cwd(), "data", "avatars");
  fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
  return dir;
}

export function getAvatarMaxFileBytes(): number {
  const raw = process.env.AVATAR_MAX_FILE_BYTES?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2 * 1024 * 1024;
}

export function avatarFileAbsolutePath(storedName: string): string {
  const base = getAvatarFilesDir();
  const resolved = path.resolve(base, storedName);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new Error("Invalid avatar path");
  }
  return resolved;
}
