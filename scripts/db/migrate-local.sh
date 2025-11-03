#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

for file in $(ls drizzle/migrations/*.sql 2>/dev/null | sort); do
  echo "[db:migrate] applying ${file}"
  if ! npx wrangler d1 execute DB --local --file="$file"; then
    echo "[db:migrate] warning: ${file} の適用に失敗しました（既に適用済みの可能性があります）" >&2
  fi
done
