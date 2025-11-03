#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

RESET_SQL="tests/db/reset.sql"
SEED_SQL="drizzle/seeds/dev_seed.sql"

if [ ! -f "$RESET_SQL" ]; then
  echo "リセット用SQLが見つかりません: $RESET_SQL" >&2
  exit 1
fi

if [ ! -f "$SEED_SQL" ]; then
  echo "シード用SQLが見つかりません: $SEED_SQL" >&2
  exit 1
fi

echo "[db:seed] clearing tables via $RESET_SQL"
npx wrangler d1 execute DB --local --file="$RESET_SQL"

echo "[db:seed] seeding data via $SEED_SQL"
npx wrangler d1 execute DB --local --file="$SEED_SQL"
