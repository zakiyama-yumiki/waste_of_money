-- 0002_amount_incl_tax.sql
-- 金額カラムを _incl_tax 命名に統一するための移行（段階移行）
-- 注意: SQLite(D1)の制約上、NOT NULL化は別途テーブル再作成が必要。まずはカラム追加とバックフィルのみ。

-- 1) intents に amount_incl_tax を追加（NULL許容）
ALTER TABLE intents ADD COLUMN amount_incl_tax INTEGER;

-- 2) 既存データをバックフィル（amount_incl_tax が未設定の場合のみ）
UPDATE intents
SET amount_incl_tax = COALESCE(amount_incl_tax, amount_tax_included);

-- 3) アプリ側の読み取りは COALESCE(amount_incl_tax, amount_tax_included) を推奨
-- 4) 安定後に amount_tax_included を削除する別マイグレーションを作成予定

