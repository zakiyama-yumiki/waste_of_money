# 無駄遣い防止アプリ 要件定義書

## 🧭 プロジェクト概要
「買う前に金額を入力 → そのお金で代わりにできることを提示」して衝動買いを抑制するアプリ。  
目的は「買う前に一呼吸置く習慣」を形成し、食費や日常支出を賢くコントロールすること。

---

## ✅ 決定事項（2025-10-20 / 最終更新: 2025-10-21）
- 対象プラットフォーム: Webアプリ（PWA 前提）
- 表示言語: 日本語のみ（`ja-JP`）
- 通貨: 日本円（JPY、記号は`¥`）
- 代替案の文体トーン: 優しい / ユーモア / スパルタ（ユーザー設定で切替）

- 実装言語: TypeScript を採用（`strict: true`）。
- 型のソース: `openapi/openapi.yaml` を真実とし、型は自動生成して `packages/shared` で共有。

- 税と丸め: 入力は税込（既定）。UIで税込/税抜の切替可。保存・集計は税込（税率10%既定）、1円未満は四捨五入（half-up）。将来的に軽減税率8%（飲食料品等）はカテゴリ連動で自動適用可能。

注: MVPでは税込入力を既定、税率10%固定・1円未満四捨五入（half-up）。軽減税率8%は将来拡張で対応。

## 🎯 コアユースケース
1. スーパーやコンビニで買い物前にアプリを開く  
2. 金額を入力（例：¥300 / ¥500 / ¥1000）  
3. アプリが「そのお金でできること」を3つ提示  
4. ユーザーは「我慢する」or「買う」を選択  
5. 我慢を選んだ場合、節約メーターを加算

---

## 💡 機能要件

### 主要機能
- 金額入力（テンキー・プリセットボタン）  
- 代替案提示（3件、300ms以内）  
  - ルールベース or 生成AI(OpenAI/Cloudflare AI Gateway)
- 意思決定記録（我慢/買う）  
- 節約サマリー（月間貯金額・成功回数）  
- PWA対応（ホーム追加・オフライン入力キュー）
- トーン選択（優しい/ユーモア/スパルタ）をユーザー設定で切替・保持

### 非機能要件
- 起動〜入力：2秒以内  
- レスポンス（代替案提示）：AIなし 300ms以内、AIあり 1.2秒以内  
- 匿名利用対応（将来的にログイン追加）
- モバイル最適化（縦長UI、親指操作）
- 表示言語: 日本語のみ（`ja-JP`）
- 通貨表示: 日本円（JPY、`¥1,234` フォーマット）
- 既定タイムゾーン: Asia/Tokyo（集計/KPI/スケジューリング）
- 税率: 10%（MVP既定、将来カテゴリ別8%対応）
- 丸め: 1円未満は四捨五入（half-up）

- 応答時間の計測点: 「端末での金額入力確定」から「代替案の初回描画」まで（ネットワーク往復・サーバ処理込み）。
- 金額の内部表現: すべて円の整数で保持（小数不使用）。
- アクセシビリティ: WCAG 2.2 AA 相当（フォーカス可視性、コントラスト、キーボード操作）。

- 型安全: TypeScript `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true` を基本とする。

---

## 💴 金額・税・丸めの仕様（規範）

- 入力既定: 税込。UIで税込/税抜の切替を提供し、最後の選択をローカルに記憶。
- 内部表現: 金額は円の整数。`amount_pretax` と `amount_incl_tax` はともに整数（単位: 円）。
- 税抜→税込: `税込 = round_half_up( 税抜 * (100 + 税率%) / 100 )`。
- 丸め（half-up）の例: `123.5 → 124`、`123.4 → 123`。0.5 ちょうどは切り上げ。
- クライアント入力が税抜 (`inputIsPretax=true`) の場合のみ上記変換を適用。デフォルトは `inputIsPretax=false`。

---

## 🧱 技術スタック

### フロントエンド
- **Vite + React + TypeScript**
- Tailwind CSS + Headless UI
- Zustand または Jotai（状態管理）
- vite-plugin-pwa（PWA化）
- PostHog（行動計測） / Sentry（エラー監視）

### バックエンド（Cloudflare Workers）
- **Hono（軽量Webフレームワーク）**
- D1（SQLite@Edge） + Drizzle ORM（マイグレーション）
- Lucia Auth または Supabase Auth（将来対応）
- OpenAI API or Cloudflare AI Gateway（生成AI）
- Cloudflare Turnstile（Bot対策）
- Workers Analytics Engine / Sentry（監視）

### 開発環境
- pnpm / Turborepo（モノレポ）
- Wrangler + Miniflare（ローカル環境）
- GitHub Actions（CI/CD）
- wrangler secret put（シークレット管理）
 - 型生成（推奨）: `openapi-typescript` で `openapi/openapi.yaml` から `packages/shared/types` に出力。
 - スキーマ検証: API I/O は Zod スキーマでサーバ側検証。

---

## 🧩 API仕様

### `POST /api/alt`
- **入力**：
  - `{ amount: number, inputIsPretax?: boolean = false, taxRate?: number = 0.10, goal?: string, hobbies?: string[], tone?: 'gentle'|'humor'|'spartan', locale?: 'ja-JP', category?: string }`
- **出力**：
  - `{ intentId: string, alternatives: { id: string, text: string, tag?: string, source: 'rule'|'ai', score?: number }[] }`
 - **説明**：金額から代替案を3件生成（ルール or 生成AI）。サーバは同時に`intents`へ`status='draft'`で永続化し、`intentId`を返す。`inputIsPretax=true`の場合は税込へ変換（「金額・税・丸めの仕様」参照）。MVPでは`locale='ja-JP'`固定、`tone`はユーザー設定を反映。未決断の`draft`は24時間で`expired`としてクリーンアップ。

### `POST /api/intent`
- **入力**：`{ amount, inputIsPretax?: false, taxRate?: 0.10, category?, hungerLevel? }`
- **出力**：`{ intentId }`
 - **備考**：MVPでは `/api/alt` が draft 作成も担うため、本エンドポイントは将来の外部クライアント向け/代替フローとして同等の挙動を提供する。

### `POST /api/decision`
- **入力**：`{ intentId, outcome: 'avoided'|'purchased', savedAmount?: number, reasonTag?, tone?: 'gentle'|'humor'|'spartan' }`
- **出力**：`{ ok: true }`

備考:
- `savedAmount`は税込金額で記録する。
- `savedAmount`未指定かつ`outcome='avoided'`の場合、サーバーは`intent.amount_incl_tax`を自動採用する（冪等）。

### `GET /api/summary`
- **入力（クエリ）**：`?month=YYYY-MM` または `?from=ISO8601&to=ISO8601`（既定: 当月、タイムゾーンは Asia/Tokyo）。
- **出力**：`{ monthSavedTotalInclTax, streak, countAvoided }`

備考: 
- 金額系はすべて税込で集計・返却する。
- オフライン同期や重複排除のため、`Idempotency-Key`ヘッダ（UUID）対応を想定。

### 共通仕様（API）
- エラーフォーマット（統一）：`{ error: { code: string, message: string, details?: any }, requestId: string }`
- 主なHTTPステータス: `400 INVALID_INPUT` / `401 UNAUTHORIZED` / `403 FORBIDDEN` / `409 CONFLICT` / `429 RATE_LIMITED` / `5xx INTERNAL`。
- Idempotency: `Idempotency-Key` ヘッダに対応。`POST /api/alt` と `POST /api/decision` はキーにより冪等。重複時は既存結果を返す。

---

## 🗄️ データモデル（D1）

| テーブル | カラム |
|-----------|---------|
| users | id, locale, goal_type, goal_value, created_at |
| intents | id, user_id, status, amount_pretax, amount_incl_tax, tax_rate, category, hunger_level, tone, idempotency_key, created_at, expired_at, deleted_at |
| decisions | id, intent_id, outcome, saved_amount_incl_tax, tone, created_at |
| alternatives | id, intent_id, text, tag, score, source |

制約/インデックス:
- `intents.amount_*` は整数（円）。
- `decisions.intent_id` は一意（1意図1決断）。
- `intents.idempotency_key` は一意。
- 代表インデックス: `(user_id, created_at desc)`, `(status, created_at)`。

列挙/辞書:
- `intents.status`: `draft | decided | expired`。
- `category`: 例 `snack | drink | meal | hobby | other`（将来拡張可）。
- `hungerLevel`: `none | low | medium | high`。

---

## 📊 KPI
- 我慢率 = 我慢回数 / 全決断数  
- 節約累計（月単位）  
- 翌週継続率（Week N→N+1）
- トーン別我慢率（優しい/ユーモア/スパルタ）

定義:
- `streak`: 連続「我慢」日数（境界は Asia/Tokyo の 00:00）。
- 集計期間: 既定は当月。`GET /api/summary` のクエリで変更可。

---

## 🚀 開発ステップ

### Sprint 1（MVP）
- Vite SPA実装（即入力・プリセットボタン）  
- Hono `/api/alt`（ルールベース生成）  
- PWA化 / D1スキーマ実装  
- PostHog + Sentry導入
- トーン選択UI（設定）と`tone`のAPI反映
- 税抜→税込変換ロジック（税率10%/四捨五入）の実装とE2E確認

受け入れ条件（抜粋）:
- 金額変換のプロパティテスト（境界: 1, 9, 10, 11, 99, 100, 101, 999）。
- オフライン再送時にIdempotencyで二重作成が起きない（409/200の期待動作）。
- レスポンスP95の計測手順がCIレポートに出力される。

### Sprint 2（拡張）
- 生成AI連携（OpenAI or Cloudflare AI Gateway）  
- サマリー画面追加  
- 匿名→ログイン（Lucia / Supabase）  
- 文面A/Bテスト（トーン以外の表現差異を対象）

---

## ⚙️ 環境変数
```
OPENAI_API_KEY=sk-xxxxx
JWT_SECRET=xxxxx
POSTHOG_KEY=xxxxx
SENTRY_DSN=xxxxx
```
D1バインディング: `DB`

---

## 🔒 セキュリティ・パフォーマンス
- CORS制限（オリジン固定）  
- Turnstile導入（Bot防止）  
- フェイルバック：AI失敗時はルールベース結果を返す  
- API応答P95: <800ms（AIなし）、<1.5s（AIあり）

追加方針:
- レート制限: `POST /api/*` にIP/ユーザー/Turnstileトークン単位で滑らか制限（例: 10 req/min、バースト20）。
- セキュリティヘッダ: CSP, COOP/COEP, Referrer-Policy, Permissions-Policy を適用。
- ログ/分析: SentryとPostHogにPIIが送信されないようスクラビング/匿名化を徹底。

---

## 📚 ドキュメント運用ルール（同期手順と役割）

- 真実のソース
  - 製品仕様の真実: `requirements.md`
  - API仕様の真実: `openapi/openapi.yaml`

- 変更手順（推奨順）
  1) `requirements.md` を更新（方針・既定値・列挙・KPI）。
  2) `openapi/openapi.yaml` を更新（スキーマ/既定値/パラメータ）。
  3) `docs/api.md` を更新（人間可読の入出力・例・エラー）。
  4) `docs/data-model.md` を更新（テーブル/制約/列挙/命名規約）。
  5) `docs/architecture.md` を更新（フロー・既定値・ドラフト/期限）。
  6) `docs/analytics.md` を更新（イベントとKPI式）。
  7) `docs/security.md` を更新（レート制限/CSP/監視）。
  8) `docs/glossary.md` を更新（用語・列挙の定義）。

- 命名/規約の原則
  - 金額は「整数の円」で保持し、税込サフィックスは `_incl_tax` を使用。
  - `hungerLevel` は列挙 `none|low|medium|high` を採用（DBはTEXT）。
  - `category` は `snack|drink|meal|hobby|other`（MVP）。

- レート制限と相関
  - 書き込み系は `Idempotency-Key` を必須運用。再送時は前回結果を返す。
  - 既定のレート制限は 10 req/min（バースト20）。超過は 429 + `Retry-After`。

- 受け入れの確認
  - OpenAPI と `docs/api.md` の差分がないこと。
  - データモデルの列挙/命名が仕様と一致すること。
  - KPI計算の定義（TZ=Asia/Tokyo）が一貫していること。

---
作成日: 2025-10-20 / 更新日: 2025-10-21

---

## 変更履歴
- 2025-10-21: 入力既定を税込へ変更、金額を整数円で保持、`/api/alt`で`intent`を`draft`作成、共通エラーフォーマット/Idempotencyを追記、`GET /api/summary`に期間指定を追加、データモデルに`status`/`idempotency_key`等を追加、非機能要件の計測点とA11y方針を明記。
- 2025-10-21: ドキュメント同期とパラメータ確定（追記）
  - レート制限を 10 req/min（バースト20）に確定（docs/api.md, docs/security.md）。
  - `category` 列挙を `snack|drink|meal|hobby|other` に統一（requirements.md, docs/data-model.md, openapi）。
  - `hungerLevel` を列挙 `none|low|medium|high` に確定（docs/api.md, docs/glossary.md, openapi）。
  - `inputIsPretax` の既定を `false` に統一（openapi、docs/api.mdの整合対応は別途継続）。
  - `docs/architecture.md` のフローを税込既定・draft生成・24h expired 仕様に更新。
  - 「📚 ドキュメント運用ルール（同期手順と役割）」セクションを追加。
