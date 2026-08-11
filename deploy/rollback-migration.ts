/**
 * Roll back the most recently applied migration (requires deploy/postgres/rollback/<file>.sql).
 *
 *   npm run db:rollback
 *   npm run db:rollback -- --scope schema
 */
import { config as loadDotenv } from "dotenv";
import pg from "pg";
import { rollbackLastMigration } from "../server/applyMigrations.js";
import { DEPLOY_MIGRATION_SCOPES, STARTUP_MIGRATION_SCOPES, type MigrationScope } from "../server/migrations.js";

loadDotenv();

function parseScopes(raw: string | undefined): MigrationScope[] {
  if (!raw) return DEPLOY_MIGRATION_SCOPES;
  return raw.split(",").map((s) => s.trim()).filter(Boolean) as MigrationScope[];
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  let scopes = DEPLOY_MIGRATION_SCOPES;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--startup") scopes = STARTUP_MIGRATION_SCOPES;
    else if (process.argv[i] === "--scope" && process.argv[i + 1]) {
      scopes = parseScopes(process.argv[++i]);
    }
  }

  const pool = new pg.Pool({ connectionString });
  try {
    const result = await rollbackLastMigration(pool, scopes);
    console.log(result.message);
    if (!result.rolledBack) process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
