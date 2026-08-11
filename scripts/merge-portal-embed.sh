#!/usr/bin/env bash
# Merge dist-embed into dist for portal proxy (/bars/logistics/assets/* → /assets/*).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

[[ -d dist-embed/assets ]] || { echo "missing dist-embed/assets — run: npm run build:embed" >&2; exit 1; }
[[ -d dist/assets ]] || { echo "missing dist/assets — run: npm run build" >&2; exit 1; }

echo "==> Merging dist-embed/assets into dist/assets"
cp -a dist-embed/assets/. dist/assets/

echo "==> Writing dist/index-portal.html (embed entry for WordPress portal)"
cp dist-embed/index.html dist/index-portal.html

if ! grep -q '/bars/logistics/assets/' dist/index-portal.html; then
  echo "WARN: index-portal.html does not contain /bars/logistics/assets/ paths" >&2
fi

echo "==> Portal embed merge done"
