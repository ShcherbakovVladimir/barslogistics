#!/usr/bin/env bash
# Fix PostgreSQL auth/ownership for BarsLogistics.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/barslogistics}"
DB_USER="${DB_USER:-barslogistics}"
DB_NAME="${DB_NAME:-barslogistics}"

[[ "${EUID:-$(id -u)}" -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }
[[ -f "$APP_DIR/.env" ]] || { echo "Missing $APP_DIR/.env"; exit 1; }

DB_PASS="$(grep '^DATABASE_URL=' "$APP_DIR/.env" | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')"
[[ -n "$DB_PASS" ]] || { echo "Could not parse DATABASE_URL from .env"; exit 1; }

echo "==> Syncing PostgreSQL password for user '$DB_USER'"
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

echo "==> Fixing table ownership and grants"
sudo -u postgres psql -d "$DB_NAME" -c "
  ALTER TABLE IF EXISTS factories OWNER TO ${DB_USER};
  ALTER TABLE IF EXISTS supply_links OWNER TO ${DB_USER};
  ALTER TABLE IF EXISTS event_logs OWNER TO ${DB_USER};
  ALTER TABLE IF EXISTS users OWNER TO ${DB_USER};
  ALTER TABLE IF EXISTS backups OWNER TO ${DB_USER};
  ALTER TABLE IF EXISTS carriers OWNER TO ${DB_USER};
  GRANT ALL ON SCHEMA public TO ${DB_USER};
  GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USER};
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
"

echo "==> Restarting barslogistics"
systemctl restart barslogistics
sleep 3

if systemctl is-active --quiet barslogistics; then
  echo "==> Service is running"
  curl -fsS "http://127.0.0.1:3000/api/analytics" >/dev/null && echo "==> API OK"
else
  echo "ERROR: barslogistics failed to start"
  journalctl -u barslogistics -n 20 --no-pager
  exit 1
fi
