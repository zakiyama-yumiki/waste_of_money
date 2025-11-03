-- 0003_intent_status.sql
-- intents テーブルに status カラムを追加し、draft を既定値とする

ALTER TABLE intents ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
