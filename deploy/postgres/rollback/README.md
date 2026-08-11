# Rollback migrations

Each rollback script mirrors an **up** migration in `deploy/postgres/` with the same filename.

Example: to undo `schema_migrations.sql`, add `rollback/schema_migrations.sql`:

```sql
DROP TABLE IF EXISTS schema_migrations;
```

Run the latest rollback:

```bash
npm run db:rollback
```

Only migrations listed in `server/migrations.ts` are considered. Rollback removes the row from `schema_migrations` after executing the down script inside a transaction.

**Note:** Most schema migrations are not reversible in production without data loss. Add rollback scripts only for migrations you can safely undo in development.
