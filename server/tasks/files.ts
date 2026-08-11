import fs from "fs";
import path from "path";

export function getTaskFilesDir(): string {
  const dir = process.env.TASK_FILES_DIR || path.join(process.cwd(), "data", "task-files");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getTaskMaxFileBytes(): number {
  const raw = process.env.TASK_MAX_FILE_BYTES?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20 * 1024 * 1024;
}

export function taskFileDir(taskId: string): string {
  const dir = path.join(getTaskFilesDir(), taskId);
  fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
  return dir;
}
