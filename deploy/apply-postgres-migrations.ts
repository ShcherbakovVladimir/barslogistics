/**
 * Apply PostgreSQL migrations from the shared manifest (server/migrations.ts).
 *
 * Uses DATABASE_URL when set (recommended):
 *   npm run db:migrate
 *
 * Without DATABASE_URL, falls back to sudo psql as postgres superuser.
 */
import { config as loadDotenv } from 'dotenv';
import pg from 'pg';
import { applyMigrationsWithPool, applyMigrationsWithPsql } from '../server/applyMigrations.js';
import { DEPLOY_MIGRATION_SCOPES, STARTUP_MIGRATION_SCOPES, migrationsForScopes, type MigrationScope } from '../server/migrations.js';

loadDotenv();

function parseScopes(raw: string | undefined): MigrationScope[] {
  if (!raw) return DEPLOY_MIGRATION_SCOPES;
  return raw.split(',').map(s => s.trim()).filter(Boolean) as MigrationScope[];
}

function parseArgs(argv: string[]): { database: string; scopes: MigrationScope[] } {
  let database = process.env.DB_NAME ?? 'barslogistics';
  let scopes = DEPLOY_MIGRATION_SCOPES;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--database' && argv[i + 1]) {
      database = argv[++i];
    } else if (arg === '--scope' && argv[i + 1]) {
      scopes = parseScopes(argv[++i]);
    } else if (arg === '--startup') {
      scopes = STARTUP_MIGRATION_SCOPES;
    }
  }

  return { database, scopes };
}

async function main() {
  const { database, scopes } = parseArgs(process.argv);
  const log = (message: string) => process.stdout.write(`==> ${message}\n`);

  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      for (const m of migrationsForScopes(scopes)) {
        if (m.label) log(m.label);
      }
      await applyMigrationsWithPool(pool, scopes);
      log('Migrations finished (DATABASE_URL)');
    } finally {
      await pool.end();
    }
    return;
  }

  applyMigrationsWithPsql({ database, scopes, log });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
