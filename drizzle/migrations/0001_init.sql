-- D1(SQLite@Edge) 初期マイグレーション
-- 金額は原則 税込 を保存。MVP税率10%（必要に応じて列で保持）。

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'ja-JP',
  goal_type TEXT,
  goal_value TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS intents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount_pretax INTEGER NOT NULL,
  amount_tax_included INTEGER NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 0.10,
  category TEXT,
  hunger_level INTEGER,
  tone TEXT,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_intents_created_at ON intents(created_at);
CREATE INDEX IF NOT EXISTS idx_intents_user_created ON intents(user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_intents_idem ON intents(idempotency_key);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL UNIQUE,
  outcome TEXT NOT NULL, -- avoided|purchased
  saved_amount_incl_tax INTEGER,
  tone TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  FOREIGN KEY(intent_id) REFERENCES intents(id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);

CREATE TABLE IF NOT EXISTS alternatives (
  id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL,
  text TEXT NOT NULL,
  tag TEXT,
  score REAL,
  source TEXT NOT NULL, -- rule|ai
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  FOREIGN KEY(intent_id) REFERENCES intents(id)
);

CREATE INDEX IF NOT EXISTS idx_alternatives_intent ON alternatives(intent_id);

-- 冪等キー記録（POST系の再送対策、TTLはアプリ側運用）
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  response_body TEXT NOT NULL,
  status INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- 月次ロールアップ（任意、将来の集計最適化）
CREATE TABLE IF NOT EXISTS rollups_monthly (
  owner_id TEXT NOT NULL, -- user_id or device_id 将来
  year_month TEXT NOT NULL, -- YYYY-MM
  saved_total_incl_tax INTEGER NOT NULL DEFAULT 0,
  avoided_count INTEGER NOT NULL DEFAULT 0,
  purchased_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY(owner_id, year_month)
);

