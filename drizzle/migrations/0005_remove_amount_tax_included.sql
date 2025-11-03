-- 0005_remove_amount_tax_included.sql
-- intents.amount_tax_included カラムを削除し、amount_incl_tax を単一源とする

PRAGMA foreign_keys=OFF;

CREATE TABLE intents_new (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount_pretax INTEGER NOT NULL,
  amount_incl_tax INTEGER NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 0.10,
  category TEXT,
  hunger_level INTEGER,
  tone TEXT,
  idempotency_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

INSERT INTO intents_new (
  id, user_id, amount_pretax, amount_incl_tax, tax_rate, category, hunger_level, tone,
  idempotency_key, status, created_at
)
SELECT
  id,
  user_id,
  amount_pretax,
  COALESCE(amount_incl_tax, amount_tax_included),
  tax_rate,
  category,
  hunger_level,
  tone,
  idempotency_key,
  COALESCE(status, 'draft'),
  created_at
FROM intents;

DROP TABLE intents;
ALTER TABLE intents_new RENAME TO intents;

CREATE INDEX IF NOT EXISTS idx_intents_created_at ON intents(created_at);
CREATE INDEX IF NOT EXISTS idx_intents_user_created ON intents(user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_intents_idem ON intents(idempotency_key);

PRAGMA foreign_keys=ON;
