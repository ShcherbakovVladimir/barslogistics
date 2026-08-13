/** Ordered PostgreSQL migrations — single source of truth for db.ts and deploy.sh. */
export type MigrationScope = "bootstrap" | "schema" | "data";

export type PostgresMigration = {
  file: string;
  scope: MigrationScope;
  /** Human-readable message for deploy logs */
  label?: string;
};

export const POSTGRES_MIGRATIONS: PostgresMigration[] = [
  { file: "init.sql", scope: "bootstrap", label: "Base schema" },
  { file: "schema_migrations.sql", scope: "schema", label: "Applying schema_migrations tracking table" },
  { file: "integrations.sql", scope: "schema", label: "Applying integrations migration" },
  { file: "tz_features.sql", scope: "schema", label: "Applying TZ features migration (roles, products, shipment fields)" },
  { file: "site_registry.sql", scope: "schema", label: "Applying site registry migration (site directories)" },
  { file: "site_canonical.sql", scope: "schema", label: "Applying site canonical key + aliases migration" },
  { file: "factory_edit_count.sql", scope: "schema", label: "Applying factory edit_count migration" },
  { file: "shipment_events.sql", scope: "schema", label: "Applying shipment events migration" },
  { file: "shipment_events_ops.sql", scope: "schema", label: "Applying shipment events operational fields migration" },
  { file: "shipment_events_transport_mode.sql", scope: "schema", label: "Applying shipment events transport_mode migration" },
  { file: "products.sql", scope: "schema", label: "Applying products catalog migration" },
  { file: "carriers_registry.sql", scope: "schema", label: "Applying carriers registry migration" },
  { file: "sales_managers.sql", scope: "schema", label: "Applying sales managers directory migration" },
  { file: "supply_links_eta_at.sql", scope: "schema", label: "Applying supply_links eta_at migration" },
  { file: "rzd_analytics.sql", scope: "schema", label: "Applying RZD analytics migration" },
  { file: "rzd_station_directory.sql", scope: "schema", label: "Applying RZD station directory migration" },
  { file: "shipment_imports.sql", scope: "schema", label: "Applying shipment imports migration" },
  { file: "kladr_local.sql", scope: "schema", label: "Applying KLADR local database schema" },
  { file: "auth_email.sql", scope: "schema", label: "Applying auth email / registration migration" },
  { file: "chat.sql", scope: "schema", label: "Applying internal chat migration" },
  { file: "push_subscriptions.sql", scope: "schema", label: "Applying Web Push subscriptions migration" },
  { file: "user_notifications.sql", scope: "schema", label: "Applying in-app notifications migration" },
  { file: "tasks.sql", scope: "schema", label: "Applying Kanban tasks migration" },
  { file: "tasks_workspace.sql", scope: "schema", label: "Applying task workspace (messages, files, milestones)" },
  { file: "support_tickets.sql", scope: "schema", label: "Applying support tickets migration" },
  { file: "shipment_logistics.sql", scope: "schema", label: "Applying shipment logistics (documents, transport fields)" },
  { file: "transport_assets.sql", scope: "schema", label: "Applying transport assets directory" },
  { file: "user_avatars.sql", scope: "schema", label: "Applying user avatars migration" },
  { file: "error_logs.sql", scope: "schema", label: "Applying error logs migration" },
  { file: "sync_users.sql", scope: "data", label: "Syncing demo user accounts" },
  { file: "seed_sites_catalog.sql", scope: "data", label: "Seeding site catalog into PostgreSQL (if not present)" },
];

export function migrationsForScopes(scopes: MigrationScope[]): PostgresMigration[] {
  const allowed = new Set(scopes);
  return POSTGRES_MIGRATIONS.filter((m) => allowed.has(m.scope));
}

/** Schema migrations applied on every app startup (initDatabase). */
export const STARTUP_MIGRATION_SCOPES: MigrationScope[] = ["schema"];

/** Full deploy sequence: bootstrap + schema + data scripts. */
export const DEPLOY_MIGRATION_SCOPES: MigrationScope[] = ["bootstrap", "schema", "data"];

/**
 * Operator-run SQL scripts — never applied automatically (destructive or one-off).
 * Listed here so deploy tooling and docs share a single catalog.
 */
export const MANUAL_POSTGRES_SCRIPTS = [
  {
    file: "sync_our_sites.sql",
    command: "npm run import:our-sites",
    label: "Reset is_ours flags from CSV (overwrites «наши площадки»)",
  },
  {
    file: "grant_app_user.sql",
    command: "npm run db:fix-ownership",
    label: "Grant table ownership to app user (run as postgres superuser)",
  },
] as const;
