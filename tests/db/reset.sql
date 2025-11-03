-- テスト/開発用途の簡易リセット
PRAGMA foreign_keys = OFF;
DELETE FROM alternatives;
DELETE FROM decisions;
DELETE FROM intents;
DELETE FROM users;
DELETE FROM idempotency_keys;
DELETE FROM rollups_monthly;
PRAGMA foreign_keys = ON;
