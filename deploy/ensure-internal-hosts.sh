#!/usr/bin/env bash
# Pin internal auth proxy DNS on the BarsLogistics host.
# Usage: sudo bash deploy/ensure-internal-hosts.sh
set -euo pipefail

[[ "${EUID:-$(id -u)}" -eq 0 ]] || {
  echo "Run as root: sudo bash $0" >&2
  exit 1
}

LINE='192.168.25.42 requestchainrestproxy.almaz-t.ru'
HOST='requestchainrestproxy.almaz-t.ru'

if grep -qE "[[:space:]]${HOST}([[:space:]]|$)" /etc/hosts; then
  if grep -qE "^[[:space:]]*192\\.168\\.25\\.42[[:space:]]+.*\\b${HOST}\\b" /etc/hosts; then
    echo "OK: already present — ${LINE}"
  else
    sed -i -E "s|^[[:space:]]*[0-9.]+[[:space:]]+(.*\\b)?${HOST}\\b.*|${LINE}|" /etc/hosts
    echo "Updated: ${LINE}"
  fi
else
  printf '\n# BarsLogistics — auth proxy (internal)\n%s\n' "$LINE" >> /etc/hosts
  echo "Added: ${LINE}"
fi

getent hosts "$HOST"
python3 -c "import socket; print('Node/Python resolve:', socket.gethostbyname('${HOST}'))"
