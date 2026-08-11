/**
 * Restore PostgreSQL database from a backup file.
 *
 * Usage:
 *   npm run db:restore -- --file data/backups/my_backup.sql
 *   npm run db:restore -- --id bkp_1234567890
 *
 * Requires DATABASE_URL and psql (postgresql-client).
 */
import { config as loadDotenv } from "dotenv";
import { closeDatabase, connectDatabase } from "../server/db.js";
import { restoreBackupFromFile, getBackupFilePath } from "../server/integrations/backup.js";

loadDotenv();

async function main() {
  let filePath: string | null = null;

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--file" && process.argv[i + 1]) {
      filePath = process.argv[++i];
    } else if (arg === "--id" && process.argv[i + 1]) {
      await connectDatabase();
      filePath = await getBackupFilePath(process.argv[++i]);
      await closeDatabase();
    }
  }

  if (!filePath) {
    console.error("Usage: npm run db:restore -- --file <path.sql> | --id <backup_id>");
    process.exit(1);
  }

  const confirm = process.env.RESTORE_CONFIRM === "RESTORE";
  if (!confirm) {
    console.error("Set RESTORE_CONFIRM=RESTORE to confirm destructive restore.");
    process.exit(1);
  }

  await connectDatabase();
  try {
    console.log(`Restoring from ${filePath}...`);
    await restoreBackupFromFile(filePath);
    console.log("Restore completed.");
  } finally {
    await closeDatabase();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
