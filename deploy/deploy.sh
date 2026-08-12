#!/usr/bin/env bash
# Full deployment script for BarsLogistics
# Usage: sudo bash deploy/deploy.sh
#
# After a successful deploy, commits local changes in SOURCE_DIR and pushes to Git
# (disable: GIT_PUSH=0). Requires SSH access to the remote for APP_USER.
set -euo pipefail

DOMAIN="${DOMAIN:-barslogistics.almaz-t.ru}"
APP_NAME="${APP_NAME:-barslogistics}"
APP_USER="${APP_USER:-user}"
APP_DIR="${APP_DIR:-/opt/barslogistics}"
SOURCE_DIR="${SOURCE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
CERTS_DIR="${CERTS_DIR:-/home/user/Сертификаты}"
DB_NAME="${DB_NAME:-barslogistics}"
DB_USER="${DB_USER:-barslogistics}"
DB_PASS="${DB_PASS:-}"
PORT="${PORT:-3000}"
NODE_MAJOR="${NODE_MAJOR:-22}"
GIT_PUSH="${GIT_PUSH:-1}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_COMMIT_USER_NAME="${GIT_COMMIT_USER_NAME:-BarsLogistics Deploy}"
GIT_COMMIT_USER_EMAIL="${GIT_COMMIT_USER_EMAIL:-deploy@${DOMAIN}}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}==>${NC} $*"; }
warn() { echo -e "${YELLOW}WARN:${NC} $*"; }
die() { echo -e "${RED}ERROR:${NC} $*" >&2; exit 1; }

require_root() {
  [[ "${EUID:-$(id -u)}" -eq 0 ]] || die "Run as root: sudo bash $0"
}

generate_db_password() {
  if [[ -z "$DB_PASS" ]]; then
    if [[ -f "$APP_DIR/.env" ]]; then
      DB_PASS="$(grep '^DATABASE_URL=' "$APP_DIR/.env" | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')"
    fi
  fi
  if [[ -z "$DB_PASS" ]]; then
    DB_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"
  fi
}

install_packages() {
  log "Installing system packages"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl ca-certificates gnupg unzip nginx postgresql postgresql-contrib postgresql-client openssl rsync p7zip-full

  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt "$NODE_MAJOR" ]]; then
    log "Installing Node.js ${NODE_MAJOR}.x"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
  fi

  log "Node $(node -v), npm $(npm -v)"
}

ensure_internal_hosts() {
  # Auth proxy is on the internal network; pin DNS so Node/fetch do not depend on public DNS.
  local line='192.168.25.42 requestchainrestproxy.almaz-t.ru'
  local host='requestchainrestproxy.almaz-t.ru'
  if grep -qE "[[:space:]]${host}([[:space:]]|$)" /etc/hosts; then
    if grep -qE "^[[:space:]]*192\\.168\\.25\\.42[[:space:]]+.*\\b${host}\\b" /etc/hosts; then
      log "Hosts entry already present: ${line}"
    else
      log "Updating /etc/hosts for ${host}"
      sed -i -E "s|^[[:space:]]*[0-9.]+[[:space:]]+(.*\\b)?${host}\\b.*|${line}|" /etc/hosts
    fi
  else
    log "Adding /etc/hosts entry: ${line}"
    printf '\n# BarsLogistics — auth proxy (internal)\n%s\n' "$line" >> /etc/hosts
  fi
}

sync_application() {
  log "Deploying application to $APP_DIR"
  install -d -m 0755 "$APP_DIR"
  # Runtime uploads/backups live only under APP_DIR — never wipe them with --delete
  rsync -a --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .env \
    --exclude data/avatars/ \
    --exclude data/backups/ \
    --exclude data/chat-files/ \
    --exclude data/task-files/ \
    --exclude data/shipment-files/ \
    --exclude data/transport/ \
    "$SOURCE_DIR/" "$APP_DIR/"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
  install -d -m 0750 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/data/backups"
  install -d -m 0750 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/data/chat-files"
  install -d -m 0750 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/data/task-files"
  install -d -m 0750 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/data/shipment-files"
  install -d -m 0750 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/data/avatars"
  install -d -m 0750 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/data/transport"
}

build_application() {
  log "Installing npm dependencies and building (standalone + portal embed)"
  sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm ci && npm run build:all"
  if [[ ! -f "$APP_DIR/dist/index-portal.html" ]]; then
    die "dist/index-portal.html missing — portal embed merge failed"
  fi
  log "Portal entry: https://${DOMAIN}/index-portal.html"
}

import_site_directories() {
  warn "Site CSV import is disabled — catalog lives in PostgreSQL (seed_sites_catalog.sql, ON CONFLICT DO NOTHING)"
  warn "«Наши площадки» sync is manual only: npm run import:our-sites (when CSV changes)"
}

write_env_file() {
  generate_db_password
  if [[ -f "$APP_DIR/.env" ]]; then
    log "Keeping existing $APP_DIR/.env"
    if ! grep -q '^JWT_SECRET=' "$APP_DIR/.env"; then
      log "Adding JWT_SECRET to $APP_DIR/.env"
      echo "JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 48)" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^BACKUP_DIR=' "$APP_DIR/.env"; then
      log "Adding BACKUP_DIR to $APP_DIR/.env"
      echo "BACKUP_DIR=${APP_DIR}/data/backups" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^TASK_FILES_DIR=' "$APP_DIR/.env"; then
      log "Adding TASK_FILES_DIR to $APP_DIR/.env"
      echo "TASK_FILES_DIR=${APP_DIR}/data/task-files" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^SHIPMENT_FILES_DIR=' "$APP_DIR/.env"; then
      log "Adding SHIPMENT_FILES_DIR to $APP_DIR/.env"
      echo "SHIPMENT_FILES_DIR=${APP_DIR}/data/shipment-files" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^CHAT_FILES_DIR=' "$APP_DIR/.env"; then
      log "Adding CHAT_FILES_DIR to $APP_DIR/.env"
      echo "CHAT_FILES_DIR=${APP_DIR}/data/chat-files" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^AVATAR_FILES_DIR=' "$APP_DIR/.env"; then
      log "Adding AVATAR_FILES_DIR to $APP_DIR/.env"
      echo "AVATAR_FILES_DIR=${APP_DIR}/data/avatars" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^TRANSPORT_FILES_DIR=' "$APP_DIR/.env"; then
      log "Adding TRANSPORT_FILES_DIR to $APP_DIR/.env"
      echo "TRANSPORT_FILES_DIR=${APP_DIR}/data/transport" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^AUTH_VALIDATE_URL=' "$APP_DIR/.env"; then
      log "Adding AUTH_VALIDATE_URL for Bars portal JWT"
      echo "AUTH_VALIDATE_URL=https://requestchainrestproxy.almaz-t.ru/v1/auth/validate" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^CORS_ORIGINS=' "$APP_DIR/.env"; then
      log "Adding CORS_ORIGINS for portal embed"
      echo "CORS_ORIGINS=https://portal.almaz-t.ru,https://${DOMAIN}" >> "$APP_DIR/.env"
    fi
    if ! grep -q '^AUTH_VALIDATE_TIMEOUT_MS=' "$APP_DIR/.env"; then
      echo "AUTH_VALIDATE_TIMEOUT_MS=8000" >> "$APP_DIR/.env"
    fi
    return
  fi
  JWT_SECRET="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 48)"
  DEFAULT_USER_PASSWORD="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 24)"
  log "Writing $APP_DIR/.env"
  cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=${PORT}
APP_URL=https://${DOMAIN}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
DEFAULT_USER_PASSWORD=${DEFAULT_USER_PASSWORD}
SEED_DEMO_DATA=false
BACKUP_DIR=${APP_DIR}/data/backups
CHAT_FILES_DIR=${APP_DIR}/data/chat-files
TASK_FILES_DIR=${APP_DIR}/data/task-files
SHIPMENT_FILES_DIR=${APP_DIR}/data/shipment-files
AVATAR_FILES_DIR=${APP_DIR}/data/avatars
TRANSPORT_FILES_DIR=${APP_DIR}/data/transport
AUTH_VALIDATE_URL=https://requestchainrestproxy.almaz-t.ru/v1/auth/validate
CORS_ORIGINS=https://portal.almaz-t.ru,https://${DOMAIN}
EOF
  chmod 600 "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
}

# After npm ci — generate VAPID keys if missing (Web Push)
ensure_vapid_keys() {
  local env_file="$APP_DIR/.env"
  [[ -f "$env_file" ]] || return 0
  if grep -qE '^VAPID_PUBLIC_KEY=.+' "$env_file" && grep -qE '^VAPID_PRIVATE_KEY=.+' "$env_file"; then
    log "VAPID keys already present in .env"
    return 0
  fi
  if [[ ! -d "$APP_DIR/node_modules/web-push" ]]; then
    warn "web-push not installed; skip VAPID key generation"
    return 0
  fi
  log "Generating VAPID keys for Web Push"
  local keys
  keys="$(sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && node -e \"const w=require('web-push'); const k=w.generateVAPIDKeys(); process.stdout.write(k.publicKey+' '+k.privateKey)\"")" || {
    warn "Could not generate VAPID keys"
    return 0
  }
  local pub="${keys%% *}"
  local priv="${keys#* }"
  [[ -n "$pub" && -n "$priv" && "$pub" != "$priv" ]] || {
    warn "Invalid VAPID key output; skip"
    return 0
  }
  sed -i '/^VAPID_PUBLIC_KEY=/d;/^VAPID_PRIVATE_KEY=/d;/^VAPID_SUBJECT=/d' "$env_file"
  {
    echo "VAPID_PUBLIC_KEY=${pub}"
    echo "VAPID_PRIVATE_KEY=${priv}"
    echo "VAPID_SUBJECT=mailto:admin@${DOMAIN}"
  } >> "$env_file"
  chown "$APP_USER:$APP_USER" "$env_file"
  chmod 600 "$env_file"
  log "VAPID keys written to .env"
}

setup_postgresql() {
  log "Configuring PostgreSQL database '$DB_NAME'"
  generate_db_password

  if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
    sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  else
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  fi

  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

  log "Applying PostgreSQL migrations"
  (cd "$APP_DIR" && npx tsx deploy/apply-postgres-migrations.ts --database "$DB_NAME" --scope bootstrap,schema,data)

  sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USER};"
  sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};"
  sudo -u postgres psql -d "$DB_NAME" -c "
    ALTER TABLE IF EXISTS factories OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS supply_links OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS event_logs OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS users OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS backups OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS carriers OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS integration_settings OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS shipment_change_logs OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS site_categories OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS products OWNER TO ${DB_USER};
    ALTER TABLE IF EXISTS carriers OWNER TO ${DB_USER};
    GRANT ALL ON SCHEMA public TO ${DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
  "

  systemctl enable postgresql
  systemctl restart postgresql
}

setup_ssl() {
  log "Installing SSL certificates for ${DOMAIN}"
  [[ -f "$CERTS_DIR/almaz-t.ru.crt" ]] || die "Certificate not found: $CERTS_DIR/almaz-t.ru.crt"
  [[ -f "$CERTS_DIR/almaz-t.ru.key" ]] || die "Private key not found: $CERTS_DIR/almaz-t.ru.key"

  install -d -m 0750 /etc/ssl/barslogistics
  cat "$CERTS_DIR/almaz-t.ru.crt" \
    "$CERTS_DIR/intermediate_pem_globalsign_ssl_dv_wildcard.crt" \
    > /etc/ssl/barslogistics/fullchain.pem
  install -m 0640 "$CERTS_DIR/almaz-t.ru.key" /etc/ssl/barslogistics/privkey.pem
  chown root:www-data /etc/ssl/barslogistics/privkey.pem
  chmod 0640 /etc/ssl/barslogistics/privkey.pem
  chmod 0644 /etc/ssl/barslogistics/fullchain.pem

  openssl x509 -in /etc/ssl/barslogistics/fullchain.pem -noout -subject -dates
}

setup_nginx() {
  log "Configuring nginx for https://${DOMAIN}"
  install -m 0644 "$APP_DIR/deploy/nginx/00-websocket-map.conf" /etc/nginx/conf.d/00-websocket-map.conf
  install -m 0644 "$APP_DIR/deploy/nginx/barslogistics.conf" /etc/nginx/sites-available/barslogistics.conf
  ln -sf /etc/nginx/sites-available/barslogistics.conf /etc/nginx/sites-enabled/barslogistics.conf
  rm -f /etc/nginx/sites-enabled/default

  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

setup_systemd() {
  log "Creating systemd service barslogistics.service"
  sed \
    -e "s#__APP_USER__#${APP_USER}#g" \
    -e "s#__APP_DIR__#${APP_DIR}#g" \
    "$APP_DIR/deploy/systemd/barslogistics.service" \
    > /etc/systemd/system/barslogistics.service

  systemctl daemon-reload
  systemctl enable barslogistics
  systemctl restart barslogistics
}

configure_firewall() {
  if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    log "Opening HTTP/HTTPS in ufw"
    ufw allow 'Nginx Full'
  fi
}

# systemctl sometimes returns "Transport endpoint is not connected" right after restarts.
service_is_active() {
  local unit="$1"
  if systemctl is-active --quiet "$unit" 2>/dev/null; then
    return 0
  fi
  local state
  state="$(systemctl show -p ActiveState --value "$unit" 2>/dev/null || true)"
  [[ "$state" == "active" ]]
}

postgres_is_ready() {
  if service_is_active postgresql; then
    return 0
  fi
  # Ubuntu may expose a versioned unit (e.g. postgresql@18-main).
  local unit
  for unit in $(systemctl list-units --type=service --all --no-legend 'postgresql@*.service' 2>/dev/null | awk '{print $1}'); do
    if service_is_active "$unit"; then
      return 0
    fi
  done
  if command -v pg_isready >/dev/null 2>&1 && pg_isready -q 2>/dev/null; then
    return 0
  fi
  sudo -u postgres psql -tc 'SELECT 1' >/dev/null 2>&1
}

verify_deployment() {
  log "Checking services"
  systemctl daemon-reload 2>/dev/null || true

  if postgres_is_ready; then
    echo "  postgresql: OK"
  else
    warn "postgresql systemd check failed — trying pg_isready/psql"
    if command -v pg_isready >/dev/null 2>&1 && pg_isready -q 2>/dev/null; then
      echo "  postgresql: OK (pg_isready)"
    elif sudo -u postgres psql -tc 'SELECT 1' >/dev/null 2>&1; then
      echo "  postgresql: OK (psql)"
    else
      die "postgresql not reachable (systemctl/pg_isready/psql failed)"
    fi
  fi

  if service_is_active nginx; then
    echo "  nginx: OK"
  else
    die "nginx not running"
  fi

  if service_is_active barslogistics; then
    echo "  barslogistics: OK"
  else
    warn "barslogistics unit not active — attempting restart"
    systemctl restart barslogistics 2>/dev/null || true
    sleep 2
    service_is_active barslogistics && echo "  barslogistics: OK (after restart)" || die "barslogistics not running"
  fi

  sleep 2
  curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null && echo "  app API: OK" || warn "App API check failed on port ${PORT}"
  curl -kfsS "https://127.0.0.1/api/health" -H "Host: ${DOMAIN}" >/dev/null && echo "  nginx HTTPS proxy: OK" || warn "HTTPS proxy check failed (DNS may not point here yet)"
}

# Commit SOURCE_DIR and push to GitHub (runs as APP_USER, not root).
push_git_changes() {
  if [[ "${GIT_PUSH}" == "0" ]]; then
    log "Git push skipped (GIT_PUSH=0)"
    return 0
  fi

  if [[ ! -d "$SOURCE_DIR/.git" ]]; then
    warn "No git repo at $SOURCE_DIR — skip git push"
    return 0
  fi

  log "Publishing source to git ($GIT_REMOTE) from $SOURCE_DIR"

  local push_ok=0
  if sudo -u "$APP_USER" bash -lc "
    set -euo pipefail
    cd '$SOURCE_DIR'

    if ! git remote get-url '$GIT_REMOTE' >/dev/null 2>&1; then
      echo 'Remote $GIT_REMOTE is not configured'
      exit 2
    fi

    branch=\"\$(git rev-parse --abbrev-ref HEAD)\"
    echo \"Branch: \$branch\"

    git add -A

    if git diff --cached --quiet; then
      echo 'Nothing to commit (working tree clean after git add)'
    else
      msg=\"\${DEPLOY_COMMIT_MSG:-deploy: production sync \$(date -Iseconds)}\"
      git -c user.name='$GIT_COMMIT_USER_NAME' -c user.email='$GIT_COMMIT_USER_EMAIL' \
        commit -m \"\$msg\"
    fi

    git push -u '$GIT_REMOTE' \"\$branch\"
  "; then
    push_ok=1
    log "Git push complete ($GIT_REMOTE)"
  else
    local rc=$?
    if [[ "$rc" -eq 2 ]]; then
      warn "Git remote '$GIT_REMOTE' not configured — skip push"
      return 0
    fi
    if [[ "${GIT_PUSH_STRICT:-0}" == "1" ]]; then
      die "git push failed (exit $rc)"
    fi
    warn "git push failed (exit $rc). Deploy succeeded; push manually or set GIT_PUSH_STRICT=1 to fail on push errors"
    return 0
  fi

  [[ "$push_ok" -eq 1 ]]
}

print_summary() {
  cat <<EOF

${GREEN}Deployment complete.${NC}

  Site:      https://${DOMAIN}
  App dir:   ${APP_DIR}
  App port:  ${PORT}
  Database:  ${DB_NAME}
  DB user:   ${DB_USER}
  DB pass:   ${DB_PASS}

Useful commands:
  sudo systemctl status barslogistics
  sudo journalctl -u barslogistics -f
  sudo nginx -t && sudo systemctl reload nginx

Initial accounts (password in ${APP_DIR}/.env → DEFAULT_USER_PASSWORD):
  admin        — администратор (полный доступ)
  keyperson    — ключевое лицо (вся карта + финансы)
  manager      — менеджер (вся карта, свои сделки)
  sitemanager  — руководитель площадки (НЛМК)
  employee     — локальный сотрудник (только площадка)

Re-deploy after code changes:
  sudo bash ${APP_DIR}/deploy/deploy.sh
  # includes npm run build:all + index-portal.html for WordPress portal
  # commits SOURCE_DIR and pushes to origin (skip: GIT_PUSH=0)

Custom commit message:
  DEPLOY_COMMIT_MSG='fix: mobile layout' sudo bash ${APP_DIR}/deploy/deploy.sh

Portal entry URL (for bars-portal plugin):
  https://${DOMAIN}/index-portal.html

Manual data imports (not run on deploy):
  cd ${APP_DIR} && npm run import:our-sites   # only when «Наши площадки» CSV changes

EOF
}

main() {
  require_root
  install_packages
  ensure_internal_hosts
  sync_application
  write_env_file
  build_application
  ensure_vapid_keys
  setup_postgresql
  setup_ssl
  setup_nginx
  setup_systemd
  configure_firewall
  verify_deployment
  push_git_changes
  print_summary
}

main "$@"
