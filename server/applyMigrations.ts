import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import type pg from "pg";
import {
  migrationsForScopes,
  POSTGRES_MIGRATIONS,
  type MigrationScope,
  type PostgresMigration,
} from "./migrations.js";

export const POSTGRES_MIGRATIONS_DIR = join(process.cwd(), "deploy/postgres");
export const POSTGRES_ROLLBACK_DIR = join(process.cwd(), "deploy/postgres/rollback");

export function resolveMigrationPath(file: string, baseDir = POSTGRES_MIGRATIONS_DIR): string {
  return join(baseDir, file);
}

export function resolveRollbackPath(file: string, baseDir = POSTGRES_ROLLBACK_DIR): string {
  return join(baseDir, file);
}

export function listMigrations(scopes: MigrationScope[]): PostgresMigration[] {
  return migrationsForScopes(scopes);
}

function checksumSql(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

async function ensureMigrationsTable(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrationFilenames(pool: pg.Pool): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations ORDER BY id",
  );
  return new Set(rows.map((row) => row.filename));
}

async function databaseHasCoreTables(pool: pg.Pool): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'factories'
     ) AS exists`,
  );
  return Boolean(rows[0]?.exists);
}

/** Mark all known migrations as applied without running SQL (upgrade from pre-tracking DB). */
async function baselineExistingDatabase(pool: pg.Pool, migrations: PostgresMigration[]): Promise<void> {
  const applied = await getAppliedMigrationFilenames(pool);
  if (applied.size > 0) return;
  if (!(await databaseHasCoreTables(pool))) return;

  for (const migration of migrations) {
    await pool.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
      [migration.file],
    );
  }
  console.log(
    `Baselined ${migrations.length} migration(s) for existing database (schema_migrations was empty).`,
  );
}

function isIgnorableMigrationError(error: unknown): boolean {
  const code = (error as { code?: string }).code;
  // Permission denied — operator must run db:fix-ownership once as postgres superuser.
  return code === "42501";
}

async function recordMigration(
  client: pg.PoolClient,
  filename: string,
  checksum: string,
): Promise<void> {
  await client.query(
    "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING",
    [filename, checksum],
  );
}

async function applySingleMigration(
  pool: pg.Pool,
  migration: PostgresMigration,
  baseDir: string,
): Promise<"applied" | "skipped" | "missing"> {
  const filePath = resolveMigrationPath(migration.file, baseDir);
  if (!existsSync(filePath)) {
    console.warn(`${migration.file} migration skipped: file not found`);
    return "missing";
  }

  const sql = readFileSync(filePath, "utf-8");
  const checksum = checksumSql(sql);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await recordMigration(client, migration.file, checksum);
    await client.query("COMMIT");
    return "applied";
  } catch (error) {
    await client.query("ROLLBACK");
    if (isIgnorableMigrationError(error)) {
      console.warn(
        `${migration.file}: skipped (run once as postgres: npm run db:fix-ownership)`,
      );
      return "skipped";
    }
    throw error;
  } finally {
    client.release();
  }
}

/** Apply migrations through an existing pg Pool (app startup). */
export async function applyMigrationsWithPool(
  pool: pg.Pool,
  scopes: MigrationScope[],
  baseDir = POSTGRES_MIGRATIONS_DIR,
): Promise<void> {
  await ensureMigrationsTable(pool);

  const migrations = listMigrations(scopes);
  await baselineExistingDatabase(pool, migrations);

  const applied = await getAppliedMigrationFilenames(pool);

  for (const migration of migrations) {
    if (applied.has(migration.file)) continue;

    const result = await applySingleMigration(pool, migration, baseDir);
    if (result === "applied") {
      console.log(`Migration applied: ${migration.file}`);
    }
  }
}

export type RollbackResult = {
  rolledBack: string | null;
  message: string;
};

/** Roll back the most recently applied migration that has a rollback script. */
export async function rollbackLastMigration(
  pool: pg.Pool,
  scopes: MigrationScope[],
  baseDir = POSTGRES_MIGRATIONS_DIR,
  rollbackDir = POSTGRES_ROLLBACK_DIR,
): Promise<RollbackResult> {
  await ensureMigrationsTable(pool);

  const allowed = new Set(listMigrations(scopes).map((m) => m.file));
  const { rows } = await pool.query<{ filename: string }>(
    `SELECT filename FROM schema_migrations
     WHERE filename = ANY($1::text[])
     ORDER BY id DESC
     LIMIT 1`,
    [Array.from(allowed)],
  );

  const target = rows[0]?.filename;
  if (!target) {
    return { rolledBack: null, message: "No applied migrations to roll back." };
  }

  const rollbackPath = resolveRollbackPath(target, rollbackDir);
  if (!existsSync(rollbackPath)) {
    return {
      rolledBack: null,
      message: `No rollback script for ${target} (expected deploy/postgres/rollback/${target}).`,
    };
  }

  const sql = readFileSync(rollbackPath, "utf-8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("DELETE FROM schema_migrations WHERE filename = $1", [target]);
    await client.query("COMMIT");
    return { rolledBack: target, message: `Rolled back ${target}` };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type PsqlMigrationOptions = {
  database: string;
  scopes: MigrationScope[];
  baseDir?: string;
  psqlUser?: string;
  log?: (message: string) => void;
};

/** Apply migrations via psql (deploy.sh). Reads SQL in Node and pipes to psql (avoids Permission denied on -f). */
export function applyMigrationsWithPsql(options: PsqlMigrationOptions): void {
  const {
    database,
    scopes,
    baseDir = POSTGRES_MIGRATIONS_DIR,
    psqlUser = "postgres",
    log = (message) => console.log(message),
  } = options;

  for (const migration of listMigrations(scopes)) {
    const path = resolveMigrationPath(migration.file, baseDir);
    if (!existsSync(path)) continue;

    if (migration.label) log(migration.label);

    const sql = readFileSync(path, "utf-8");
    const result = spawnSync(
      "sudo",
      ["-u", psqlUser, "psql", "-d", database, "-v", "ON_ERROR_STOP=1"],
      {
        input: sql,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "").trim();
      throw new Error(`Migration ${migration.file} failed${detail ? `: ${detail}` : ""}`);
    }
  }
}

/** List all migrations with applied status (CLI / diagnostics). */
export async function listMigrationStatus(pool: pg.Pool): Promise<
  Array<{ file: string; scope: MigrationScope; applied: boolean; applied_at: string | null }>
> {
  await ensureMigrationsTable(pool);
  const appliedMap = new Map<string, string>();
  const { rows } = await pool.query<{ filename: string; applied_at: Date }>(
    "SELECT filename, applied_at FROM schema_migrations",
  );
  for (const row of rows) {
    appliedMap.set(row.filename, row.applied_at.toISOString());
  }

  return POSTGRES_MIGRATIONS.map((m) => ({
    file: m.file,
    scope: m.scope,
    applied: appliedMap.has(m.file),
    applied_at: appliedMap.get(m.file) ?? null,
  }));
}

export type MigrationDashboardItem = {
  file: string;
  scope: MigrationScope;
  applied: boolean;
  applied_at: string | null;
  has_rollback: boolean;
};

export type MigrationDashboard = {
  migrations: MigrationDashboardItem[];
  pending_count: number;
  applied_count: number;
  total_count: number;
};

export async function getMigrationDashboard(pool: pg.Pool): Promise<MigrationDashboard> {
  const migrations = await listMigrationStatus(pool);
  const enriched: MigrationDashboardItem[] = migrations.map((m) => ({
    ...m,
    has_rollback: existsSync(resolveRollbackPath(m.file)),
  }));
  return {
    migrations: enriched,
    pending_count: enriched.filter((m) => !m.applied).length,
    applied_count: enriched.filter((m) => m.applied).length,
    total_count: enriched.length,
  };
}

/** Apply all pending migrations in the given scopes; returns filenames applied this run. */
export async function applyPendingMigrations(
  pool: pg.Pool,
  scopes: MigrationScope[],
  baseDir = POSTGRES_MIGRATIONS_DIR,
): Promise<{ applied: string[]; skipped: string[] }> {
  await ensureMigrationsTable(pool);
  const migrations = listMigrations(scopes);
  await baselineExistingDatabase(pool, migrations);
  const appliedSet = await getAppliedMigrationFilenames(pool);
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    if (appliedSet.has(migration.file)) continue;
    const result = await applySingleMigration(pool, migration, baseDir);
    if (result === "applied") applied.push(migration.file);
    else skipped.push(migration.file);
  }

  return { applied, skipped };
}
