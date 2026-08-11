import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { pool } from "../db.js";
import type { BackupItem } from "../../src/types.js";
import { getCloudSettings } from "./settings.js";
import { uploadToCloud } from "./cloud.js";

const BACKUP_INTERVAL_MS =
  (Number(process.env.BACKUP_INTERVAL_HOURS) || 24) * 60 * 60 * 1000;
const BACKUP_RETENTION_COUNT = Number(process.env.BACKUP_RETENTION_COUNT) || 30;

export function getBackupDir(): string {
  const dir = process.env.BACKUP_DIR || path.join(process.cwd(), "data", "backups");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, ""),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

export function isPgDumpAvailable(): boolean {
  return fs.existsSync("/usr/bin/pg_dump") || Boolean(process.env.PG_DUMP_PATH);
}

export function isPsqlAvailable(): boolean {
  return fs.existsSync("/usr/bin/psql") || Boolean(process.env.PSQL_PATH);
}

function resolvePgDumpBinary(): string {
  if (process.env.PG_DUMP_PATH) return process.env.PG_DUMP_PATH;
  if (fs.existsSync("/usr/bin/pg_dump")) return "pg_dump";
  return "pg_dump";
}

function resolvePsqlBinary(): string {
  if (process.env.PSQL_PATH) return process.env.PSQL_PATH;
  if (fs.existsSync("/usr/bin/psql")) return "psql";
  return "psql";
}

export async function runPgDump(filename: string): Promise<{ filePath: string; sizeBytes: number }> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const db = parseDatabaseUrl(connectionString);
  const filePath = path.join(getBackupDir(), filename);
  const pgDump = resolvePgDumpBinary();

  await new Promise<void>((resolve, reject) => {
    const args = [
      "-h", db.host,
      "-p", db.port,
      "-U", db.user,
      "-d", db.database,
      "-f", filePath,
      "--no-owner",
      "--no-acl",
      "--format=plain",
    ];
    const child = spawn(pgDump, args, {
      env: { ...process.env, PGPASSWORD: db.password },
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => {
      reject(new Error(`pg_dump unavailable (${err.message}). Install postgresql-client.`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `pg_dump exited with code ${code}`));
    });
  });

  if (!fs.existsSync(filePath)) {
    throw new Error("pg_dump did not create backup file");
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    fs.unlinkSync(filePath);
    throw new Error("pg_dump produced an empty file");
  }

  return { filePath, sizeBytes: stat.size };
}

/** Restore database from a plain SQL backup file (destructive). */
export async function restoreBackupFromFile(filePath: string): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  if (!fs.existsSync(filePath)) throw new Error("Backup file not found");
  if (!isPsqlAvailable()) {
    throw new Error("psql unavailable — install postgresql-client or set PSQL_PATH");
  }

  const db = parseDatabaseUrl(connectionString);
  const psql = resolvePsqlBinary();
  const sql = fs.readFileSync(filePath, "utf-8");

  await new Promise<void>((resolve, reject) => {
    const args = [
      "-h", db.host,
      "-p", db.port,
      "-U", db.user,
      "-d", db.database,
      "-v", "ON_ERROR_STOP=1",
      "-f", filePath,
    ];
    const child = spawn(psql, args, {
      env: { ...process.env, PGPASSWORD: db.password },
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => {
      reject(new Error(`psql unavailable (${err.message})`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `psql restore exited with code ${code}`));
    });
  });

  if (!sql.trim()) {
    throw new Error("Backup file is empty");
  }
}

export async function createRealBackup(type: "manual" | "auto", description: string): Promise<BackupItem> {
  const id = `bkp_${Date.now()}`;
  const filename = `logistics_db_backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.sql`;
  const { filePath, sizeBytes } = await runPgDump(filename);

  let cloudUploaded = false;
  let cloudProvider: string | undefined;
  const cloud = await getCloudSettings();
  if (cloud.enabled && cloud.auto_upload_on_backup) {
    try {
      await uploadToCloud(filePath, filename);
      cloudUploaded = true;
      cloudProvider = cloud.provider;
    } catch (error) {
      console.error("Cloud upload failed:", error);
    }
  }

  const backup: BackupItem = {
    id,
    created_at: new Date().toISOString(),
    size_bytes: sizeBytes,
    type,
    filename,
    description,
    storage_path: filePath,
    cloud_uploaded: cloudUploaded,
    cloud_provider: cloudProvider,
  };

  await pool.query(
    `INSERT INTO backups (id, created_at, size_bytes, type, filename, description, storage_path, cloud_uploaded, cloud_provider)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [backup.id, backup.created_at, backup.size_bytes, backup.type, backup.filename, backup.description, filePath, cloudUploaded, cloudProvider ?? null]
  );

  return backup;
}

export async function getBackupFilePath(backupId: string): Promise<string | null> {
  const { rows } = await pool.query<{ storage_path: string | null; filename: string }>(
    "SELECT storage_path, filename FROM backups WHERE id = $1",
    [backupId]
  );
  if (!rows[0]?.storage_path) return null;
  if (!fs.existsSync(rows[0].storage_path)) return null;
  return rows[0].storage_path;
}

export async function uploadBackupToCloud(backupId: string): Promise<{ provider: string }> {
  const filePath = await getBackupFilePath(backupId);
  if (!filePath) throw new Error("Backup file not found");

  const filename = path.basename(filePath);
  const cloud = await getCloudSettings();
  if (!cloud.enabled) throw new Error("Cloud storage is disabled");

  await uploadToCloud(filePath, filename);

  await pool.query(
    "UPDATE backups SET cloud_uploaded = TRUE, cloud_provider = $2 WHERE id = $1",
    [backupId, cloud.provider]
  );

  return { provider: cloud.provider };
}

export async function pruneOldBackups(keepCount = BACKUP_RETENTION_COUNT): Promise<number> {
  const { rows } = await pool.query<{ id: string; storage_path: string | null }>(
    `SELECT id, storage_path FROM backups
     ORDER BY created_at DESC
     OFFSET $1`,
    [keepCount]
  );

  let removed = 0;
  for (const row of rows) {
    if (row.storage_path && fs.existsSync(row.storage_path)) {
      try {
        fs.unlinkSync(row.storage_path);
      } catch (error) {
        console.error(`Failed to delete backup file ${row.storage_path}:`, error);
      }
    }
    await pool.query("DELETE FROM backups WHERE id = $1", [row.id]);
    removed++;
  }
  return removed;
}

async function shouldRunScheduledBackup(): Promise<boolean> {
  const { rows } = await pool.query<{ created_at: Date }>(
    `SELECT created_at FROM backups WHERE type = 'auto' ORDER BY created_at DESC LIMIT 1`
  );
  if (!rows[0]) return true;
  const last = new Date(rows[0].created_at).getTime();
  return Date.now() - last >= BACKUP_INTERVAL_MS;
}

async function runScheduledBackup(getAutoDescription: () => string): Promise<void> {
  if (!(await shouldRunScheduledBackup())) return;

  console.log("Running scheduled PostgreSQL backup (pg_dump)...");
  const backup = await createRealBackup("auto", getAutoDescription());
  const pruned = await pruneOldBackups();
  console.log(`Backup created: ${backup.filename} (${(backup.size_bytes / 1024).toFixed(1)} KB), pruned ${pruned} old`);
}

export function startBackupScheduler(getAutoDescription: () => string): void {
  if (process.env.BACKUP_SCHEDULER_ENABLED === "false") {
    console.log("Backup scheduler disabled (BACKUP_SCHEDULER_ENABLED=false)");
    return;
  }

  if (!isPgDumpAvailable()) {
    console.warn("pg_dump not found — install postgresql-client for real backups");
    return;
  }

  const hours = BACKUP_INTERVAL_MS / (60 * 60 * 1000);
  console.log(`Backup scheduler: pg_dump every ${hours}h, keep last ${BACKUP_RETENTION_COUNT}`);

  void runScheduledBackup(getAutoDescription).catch((error) => {
    console.error("Initial scheduled backup failed:", error);
  });

  setInterval(() => {
    void runScheduledBackup(getAutoDescription).catch((error) => {
      console.error("Scheduled backup failed:", error);
    });
  }, BACKUP_INTERVAL_MS);
}
