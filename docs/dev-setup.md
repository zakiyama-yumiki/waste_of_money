# 開発環境セットアップ（ローカル）

目的: Sprint 1 をTDDで進めるための最小限のローカル環境を整える。

## 前提バージョン
- Node.js 20 以上（`node -v`）
- pnpm 9 以上（`pnpm -v`）
- Wrangler 3 以上（`npx wrangler -v`）

## 初期化
1) 依存の導入（ワークスペース）
```
pnpm i
```

2) OpenAPI → 型生成ツール（未導入なら追加）
```
pnpm -w add -D openapi-typescript
pnpm generate:types
```

## ローカルシークレット
- ルートに `.dev.vars` を作成（Wrangler/Miniflareで自動読込）
```
OPENAI_API_KEY=
POSTHOG_KEY=
SENTRY_DSN=
JWT_SECRET=dev-secret
```

## Wrangler 設定（ローカル）
ルートに `wrangler.toml` を作成（存在しない場合）
```
name = "waste-of-money-api"
main = "packages/api/src/index.ts"
compatibility_date = "2025-10-21"

[[d1_databases]]
binding = "DB"
database_name = "wom_dev"
database_id = "local-wom" # ローカルではダミーでOK
```

## D1 初期化（ローカル）
```
npx wrangler d1 execute DB --local --file=drizzle/migrations/0001_init.sql
npx wrangler d1 execute DB --local --file=drizzle/migrations/0002_amount_incl_tax.sql
```

## 実行/テスト
- 開発サーバ起動（Workers）
```
npx wrangler dev --local
```

- D1 マイグレーション/シード（ローカル）
```
pnpm db:migrate
pnpm db:seed
```

`pnpm db:reset` を使うとマイグレーションとシードを連続実行してローカルDBを初期状態へ戻せます。

- スモーク（別ターミナル）
```
curl -s -X POST localhost:8787/api/alt \
  -H 'Content-Type: application/json' \
  -d '{"amount":300}' | jq .
```

- テスト（TDD: まずRedでOK）
```
pnpm test
```

## よくあるハマり
- Nodeのバージョン違い: `nvm use 20` などで合わせる
- `openapi-typescript` 未導入: 上記コマンドで -w（ワークスペース）追加
- ポート競合: `--port 8787` を指定
- `.dev.vars` 未作成: 環境変数が未定義でエラーになる

## フェーズ1（A3着手）前の下準備メモ
- DB接続ユーティリティ: `c.env.DB` を受け取り `drizzle-orm/d1` などに渡すラッパを `packages/api/src/lib/db.ts`（案）として用意し、全ルートで共通利用できるようにする。
- 環境型の更新: `AppEnv` に `Bindings: { DB: D1Database }` を追加し、ルーター側の `Hono<AppEnv>` で型補完を効かせる。
- マイグレーション/シード スクリプト: `package.json` に `db:migrate` `db:seed` などを追加し、TDDサイクルの前に `pnpm db:migrate && pnpm db:seed` でローカルDBを初期化できるようにする。シードは `tests/seed.sql` などにまとめて、draft保存やルール検証で使う初期データを投入する。
- テスト用DBリセット: 受け入れ・統合テストの前後でテーブルをクリアする仕組み（SQLで全テーブルTRUNCATE、またはトランザクションラッパ）を用意し、冪等テストが安定するようにする。
- ルール辞書の配置: `/api/alt` が参照する `alternatives.json` の読み込みヘルパーを `packages/api/src/rules/` 配下に作成しておく。将来的な draft 永続化でも同じ辞書を利用する想定。
- Draft管理の後続タスク:
  - `updateIntentStatus(intentId, status)` のようなメソッドをリポジトリへ追加し、`draft → submitted/expired` を切り替えられるようにしておく。
  - `markExpiredDrafts(cutoffIso)` などの一括更新APIを用意し、Scheduled Worker で24h超のdraftを `expired` へ遷移させる。
  - 冪等キーやdraftの寿命管理を行うクリーンアップ（例: `pruneIdempotencyKeys(beforeIso)`）の雛形を用意しておくと、後続イテレーションでScheduled Workerを足しやすい。
  - ルール辞書をDB化／拡張する場合に備え、カテゴリ・トーンで候補を取得する抽象メソッド（`fetchRuleAlternatives(category, tone)` 等）をリポジトリ層へ切り出す。
- サマリAPIの集計範囲明示:
  - `/api/summary` のレスポンスを `{ range:{ from,to,month? }, monthSavedTotalInclTax, streak, countAvoided }` といった形に拡張し、クライアントが集計期間をUIで表示しやすくする。
  - `summaryQuerySchema` のバリデーションで `from/to` をISO8601文字列（URLエンコード前提）として扱い、実装側では `new Date()`→`toISOString()` でUTC境界へ正規化する。
  - テストでは `encodeURIComponent` した `from/to` を使い、レスポンスの `range` フィールドと集計値（savedAmount合計・streak）が期待どおりか確認する。
- Scheduled Worker でのメンテ処理:
  - リポジトリに `deleteIdempotencyBefore(cutoffIso)` や必要なステータス更新メソッドを追加し、メモリ実装とD1実装で整合を取る。
  - `wrangler.toml` に `[[triggers]] cron = "0 0 * * *"` のような設定を追加し、`packages/api/src/scheduled/cleanup.ts` などで `scheduled` ハンドラを実装。24時間超のdraftを `expired` に、7日超の冪等キーを削除するなどの方針を明文化する。
  - ユニットテストではメモリリポジトリを使って `markDraftsExpired` や `deleteIdempotencyBefore` の件数を検証し、統合テストでは scheduled ハンドラ呼び出し前後でデータが期待どおりに変化するか確認する。
