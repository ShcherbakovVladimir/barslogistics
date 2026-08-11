import pg from "pg";
import "dotenv/config";
import { applyMigrationsWithPool } from "./applyMigrations.js";
import { STARTUP_MIGRATION_SCOPES } from "./migrations.js";

const { Pool, types } = pg;

// Keep DATE as YYYY-MM-DD string (default Date → String().slice(0,10) becomes "Wed Aug 05")
types.setTypeParser(types.builtins.DATE, (value: string) => value);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const pool = new Pool({ connectionString });

export async function initDatabase(): Promise<void> {
  await pool.query("SELECT 1");
  await applyMigrationsWithPool(pool, STARTUP_MIGRATION_SCOPES);
}

/** Connect without running migrations (CLI scripts). */
export async function connectDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
