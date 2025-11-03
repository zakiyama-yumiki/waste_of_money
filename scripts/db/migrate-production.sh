#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

# 本番環境のD1データベースにマイグレーションを実行
for file in $(ls drizzle/migrations/*.sql 2>/dev/null | sort); do
  echo "[db:migrate:prod] applying ${file}"
  if ! npx wrangler d1 execute DB --env production --remote --file="$file"; then
    echo "[db:migrate:prod] warning: ${file} の適用に失敗しました（既に適用済みの可能性があります）" >&2
  fi
done

echo "[db:migrate:prod] completed"
