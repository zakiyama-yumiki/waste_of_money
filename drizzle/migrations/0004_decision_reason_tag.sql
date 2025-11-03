-- 0004_decision_reason_tag.sql
-- decisions テーブルに reason_tag カラムを追加

ALTER TABLE decisions ADD COLUMN reason_tag TEXT;
