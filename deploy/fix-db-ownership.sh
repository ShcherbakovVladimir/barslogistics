#!/usr/bin/env bash
# Transfer table ownership to barslogistics app user (run once after postgres-created tables).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="${DB_NAME:-barslogistics}"
APP_USER="${DB_USER:-barslogistics}"

echo "==> Granting ownership on database '$DB' to user '$APP_USER'"
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 <<EOF
GRANT ALL ON SCHEMA public TO ${APP_USER};
GRANT ALL ON ALL TABLES IN SCHEMA public TO ${APP_USER};
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};

DO \$\$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO ${APP_USER}', r.tablename);
  END LOOP;
  FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO ${APP_USER}', r.sequence_name);
  END LOOP;
END \$\$;
EOF
echo "==> Done"
