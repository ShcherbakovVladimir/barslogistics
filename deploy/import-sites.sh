#!/usr/bin/env bash
# Import site directories from data/sites/*.csv into PostgreSQL.
set -euo pipefail

APP_DIR="${BARSLOGISTICS_APP_DIR:-/opt/barslogistics}"
SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$APP_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$APP_DIR/.env"
  set +a
  echo "Loaded env from $APP_DIR/.env"
elif [[ -f "$SOURCE_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$SOURCE_DIR/.env"
  set +a
  echo "Loaded env from $SOURCE_DIR/.env"
fi

cd "$SOURCE_DIR"
exec npm run import:sites
