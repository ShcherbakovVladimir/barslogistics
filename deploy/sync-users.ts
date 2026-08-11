#!/usr/bin/env npx tsx
/**
 * Sync demo users to match deploy summary (run on server after deploy).
 * Usage: DATABASE_URL=... npx tsx deploy/sync-users.ts
 */
import pg from "pg";
import { hashPassword, getDefaultPassword } from "../server/auth.js";

const TARGET_USERS = [
  { id: "u_admin", username: "admin", name: "Александр Волков", role: "admin", email: "admin@logistics.ru", site_id: null as string | null },
  { id: "u_key", username: "keyperson", name: "Елена Смирнова", role: "key_person", email: "key@logistics.ru", site_id: null },
  { id: "u_mgr", username: "manager", name: "Дмитрий Соколов", role: "manager", email: "manager@logistics.ru", site_id: null },
  { id: "u_site", username: "sitemanager", name: "Игорь Кузнецов", role: "site_manager", email: "site@logistics.ru", site_id: "aQOWlcH4hpZYSUfRL1M0marke" },
  { id: "u_local", username: "employee", name: "Иван Петров", role: "local_employee", email: "employee@logistics.ru", site_id: "aQOWlcH4hpZYSUfRL1M0marke" },
];

const LEGACY_USERNAMES = ["analyst", "dispatcher", "viewer"];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const passwordHash = await hashPassword(getDefaultPassword());

  try {
    for (const user of TARGET_USERS) {
      await pool.query(
        `INSERT INTO users (id, username, name, role, email, notifications_enabled, password_hash, site_id, assigned_site_ids)
         VALUES ($1, $2, $3, $4, $5, true, $6, $7, '{}')
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           email = EXCLUDED.email,
           site_id = EXCLUDED.site_id,
           password_hash = EXCLUDED.password_hash`,
        [user.id, user.username, user.name, user.role, user.email, passwordHash, user.site_id],
      );
      console.log(`OK: ${user.username} (${user.role})`);
    }

    const del = await pool.query(
      `DELETE FROM users WHERE username = ANY($1::text[])`,
      [LEGACY_USERNAMES],
    );
    console.log(`Removed legacy usernames: ${del.rowCount ?? 0}`);

    const { rows } = await pool.query(
      `SELECT username, role, site_id FROM users ORDER BY username`,
    );
    console.log("\nCurrent users:");
    for (const r of rows) {
      console.log(`  ${r.username.padEnd(12)} ${r.role.padEnd(16)} site=${r.site_id ?? "—"}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
