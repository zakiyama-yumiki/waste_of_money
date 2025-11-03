# データモデル（D1/SQLite@Edge）

金額は税込中心で集計します。MVP税率は10%、1円未満は四捨五入。

## テーブル

- `users(id, locale, goal_type, goal_value, created_at)`
- `intents(id, user_id, amount_pretax, amount_incl_tax, tax_rate, category, hunger_level, tone, idempotency_key, created_at)`
- `decisions(id, intent_id, outcome, saved_amount_incl_tax, tone, created_at)`
- `alternatives(id, intent_id, text, tag, score, source, created_at)`
- `idempotency_keys(key, method, path, response_body, status, created_at)`
- `rollups_monthly(owner_id, year_month, saved_total_incl_tax, avoided_count, purchased_count, updated_at)`

## インデックス/一意制約
- `decisions.intent_id` UNIQUE（1 intent につき 1 decision）
- `intents.idempotency_key` UNIQUE（再送対策）
- 時系列アクセスのため `created_at` にインデックス

## 命名規約
- 税込集計はサフィックス `_incl_tax` を必ず付与
- タイムスタンプは ISO8601（UTC）文字列

## 列挙/制約（アプリ規約）
- `category`: `snack | drink | meal | hobby | other`
- `hunger_level`: `none | low | medium | high`（DB型はTEXT想定）

## 型（アプリ層の扱い）
- 金額はアプリでは整数円のブランド型として扱うことを推奨：
  - `type Yen = number & { readonly __yen: unique symbol }`
- 列挙はTypeScriptのユニオン型で共有し、OpenAPIから生成された型を基準にする。
