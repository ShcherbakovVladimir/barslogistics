import path from "path";
import fs from "fs";

export function getTransportFilesDir(): string {
  const dir = process.env.TRANSPORT_FILES_DIR || path.join(process.cwd(), "data", "transport");
  fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
  return dir;
}

export function getTransportMaxFileBytes(): number {
  const raw = process.env.TRANSPORT_MAX_FILE_BYTES?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5 * 1024 * 1024;
}

export function transportFileAbsolutePath(storedName: string): string {
  const base = getTransportFilesDir();
  const resolved = path.resolve(base, storedName);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new Error("Invalid transport photo path");
  }
  return resolved;
}
