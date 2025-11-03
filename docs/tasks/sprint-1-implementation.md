# Sprint 1（MVP）実装タスク

目的: 「買う前に金額を入力 → 代替案3件提示 → 我慢/購入を記録」の最小プロダクトをWeb/PWAで成立させる。

期間: 2025-10-20 〜 2025-11-03（目安）

## 環境構築（段階導入/TDD先行）

TDDで小さく回すため、環境は段階的に導入します。詳細手順は `docs/dev-setup.md` を参照。

- フェーズ0（TDD開始・DB不要）
  - [✖] E1 前提の確認: Node.js 20+ / pnpm 9+（Wranglerは不要）
  - [✖] E2 依存導入: ルートで `pnpm i`
  - [✖] E8 テスト実行確認: `pnpm test`（RedでOK）

- フェーズ1（API永続化に着手する直前）
  - [✖] E3 型生成ツール導入: `pnpm -w add -D openapi-typescript` → `pnpm generate:types`
  - [✖] E4 シークレット: ルートに `.dev.vars` 作成（`OPENAI_API_KEY`/`POSTHOG_KEY`/`SENTRY_DSN`/`JWT_SECRET`）
  - [✖] E5 Wrangler 設定: ルートに `wrangler.toml`（`main=packages/api/src/index.ts`、`DB` バインディング）
  - [✖] E6 D1 初期化: `wrangler d1 execute DB --local --file drizzle/migrations/*.sql`
  - [✖] E7 開発起動: `wrangler dev --local` で `/api/*` が応答

- フェーズ2（性能/E2Eに着手する直前）
  - [ ] P95測定スクリプトの用意と測定条件の固定（D6の前提）
  - [ ] Miniflare設定/データシード自動化（必要に応じて）

## 実施順序（フェーズ→タスク対応表）
- フェーズ0 完了で着手可: A1, A2, D1, D2, D3
- フェーズ1 完了で着手可: A3, A4, A5, C1–C4, D4, D5
- フェーズ2 完了で着手可: D6（性能計測）

推奨進行例（TDD）
1) フェーズ0 → A1（エラー形式）→ A2（税込変換）
2) フェーズ1 → A3（alt: ルール+draft+冪等）→ A4（decision）→ A5（summary）
3) フェーズ2 → D6（P95計測）→ 受け入れ確認チェックリスト

スコープ（入）
- 金額入力UI（テンキー/プリセット）と代替案提示（ルール）
- `/api/alt` ルール生成＋`intents(draft)` 永続化＋冪等
- `/api/decision` 記録（`decisions.intent_id` 一意）
- `/api/summary` 月次サマリ（Asia/Tokyo）
- PWA(install/オフライン入力キュー)・基本計測(PostHog)・監視(Sentry)

スコープ（外）
- ログイン、AI生成（Sprint 2 以降）
- 軽減税率8%のカテゴリ連動（後続）

完了の定義（DoD）
- 端末からの金額入力確定→代替案初回描画 P95 300ms（ルール）
- `inputIsPretax=false` を既定、税込・円整数・half-up。変換の境界テストを網羅
- 代替案3件を常に返却（フォールバック時も3件）
- エラーフォーマット `{ error:{code,message,details?}, requestId }` に統一
- 冪等キーで二重作成なし（再送200=同一応答）
- `/api/summary` の `month` または `from/to` バリデーションと集計が正
- CIで `typecheck`/`lint`/主要テストとP95測定が通過

性能計測条件（/api/alt ルール経路）
- Warm開始（起動直後の100リクエストは破棄）
- 測定N=1000、並列=10、同一リージョン（APAC）
- ルール辞書は初期版（サイズ≦50KB）
- 計測は同一コードバージョン・同一データで再現可能にする

---

## TDD 進め方（このスプリントで先に書くテスト）
- 受け入れ（API境界）
  - [ ] alt_generates_three_alternatives_for_amount_incl_tax（/api/alt）
  - [ ] error_shape_is_consistent（400系共通エラー）
  - [ ] idempotency_returns_same_result（Idempotency-Key再送）
  - [ ] decision_defaults_savedAmount_when_avoided（/api/decision）
  - [ ] summary_validates_query_and_aggregates（/api/summary）
- 単体
  - [ ] toInclTaxHalfUp 境界（1,9,10,11,99,100,101,999）
  - [ ] computeStreak（Asia/Tokyo 0:00 境界）
  - [ ] buildAlternatives 常に3件（フォールバック含む）
- 性能
  - [ ] /api/alt（ルール経路）P95≤300ms の測定スクリプト雛形

テストの詳細は `docs/testing-tdd.md` を参照。

---

## A. API/バックエンド

- [✖] A1 共通エラーハンドラを仕様準拠に統一
  - 前提: フェーズ0完了
  - 変更: `packages/api/src/lib/errors.ts` を `{ error:{ code,message,details? }, requestId }` 返却へ
  - `X-Request-Id` の受理・反映は `packages/api/src/index.ts` ですでにヘッダ返却。本文へ埋め込む
  - TDD: 先に `error_shape_is_consistent` を追加 → 実装でGreen

- [✖] A2 `inputIsPretax=false` の既定化と税込変換ロジックの一本化
  - 前提: フェーズ0完了
  - 変更: Zod既定値（`packages/shared/src/schemas/{alt.ts,intent.ts}`）を `false` に修正
  - 変更: `/api/alt` の計算を half-up で税込へ（`Math.round` は0.5の扱いを要確認）
  - TDD: 先に `toInclTaxHalfUp` の単体境界テストと `/api/alt` 受け入れテストを追加

- [✖] A3 `/api/alt` ルール生成＋draft永続化＋冪等
  - 前提: フェーズ1完了
  - ルール辞書: `packages/api/src/rules/alternatives.json`（カテゴリ×金額帯×トーン）
  - 永続化: `intents(status='draft')` を D1 に保存、`alternatives` を3件保存
  - 冪等: `Idempotency-Key` を `idempotency_keys` に記録（既存テーブル活用）
  - 冪等（期待仕様）: 同一キーの再送は 200 で、レスポンスボディまで完全同一（`intentId`/`alternatives` 含む）を返却
  - TDD: 先に `alt_generates_three_alternatives_for_amount_incl_tax` と `idempotency_returns_same_result`
  - 期限処理: Scheduled Workers で1日1回、`status='draft' AND created_at < now()-24h` を `expired` へ遷移
  - ルール辞書仕様: 金額帯 [~499, 500–999, 1000–]。優先順=カテゴリ一致 > トーン補正 > ジェネリック。3件未満は上位帯→ジェネリックで補完し必ず3件返す

- [✖] A4 `/api/decision` upsert（`intent_id` 一意）と `savedAmount` 既定
  - 前提: フェーズ1完了
  - `savedAmount` 未指定かつ avoided→ `intents.amount_incl_tax` を採用
  - OpenAPI の `DecisionRequest.savedAmount` を `integer` へ
  - TDD: 先に `decision_defaults_savedAmount_when_avoided`

- [✖] A5 `/api/summary` 実装
  - 前提: フェーズ1完了
  - クエリ検証: `month` XOR `from/to`（`packages/shared/src/schemas/summary.ts` 準拠）
  - 集計: `saved_amount_incl_tax` の合計、`streak` 算出（Asia/Tokyo 0:00 境界）
  - TDD: 先に受け入れ `summary_validates_query_and_aggregates` と単体 `computeStreak`

- [✖] A6 マイグレーション整備
  - 読み取りで `COALESCE(amount_incl_tax, amount_tax_included)` を徹底
  - 安定後に `amount_tax_included` 削除マイグレーション追加

## B. フロントエンド/PWA

- [✖] B1 Vite+React+TS 初期化とPWA化（`vite-plugin-pwa`）
- [✖] B2 金額入力UI（テンキー/プリセット¥300/¥500/¥1000）
- [✖] B3 トーン設定UI（優しい/ユーモア/スパルタ）をローカル保持→APIへ反映
- [✖] B4 代替案表示（3件、300ms目標）と「我慢/買う」ボタン→`/api/decision`
- [✖] B5 オフライン入力キュー（IndexedDB/LocalStorage）と再送（`Idempotency-Key` 付与）
- [✖] B6 エラー/再試行UI、`/offline` フォールバック

## C. 計測/監視/セキュリティ

- [ ] C1 PostHog/Sentry 導入（PIIスクラビング、サンプリング方針）
- [ ] C2 KPIイベント送信（`alt_generated`/`decision_made`/`summary_viewed`）
- [ ] C3 CSP更新（`connect-src` に PostHog/Sentry/OpenAI を追加）
- [ ] C4 レート制限（最小実装 or モック）と 429 応答確認

## D. テスト/CI

- [✖] D1 `pnpm generate:types` をCIに追加（OpenAPI→型再生成）
- [✖] D2 `pnpm typecheck`/`pnpm lint` のCI化
- [✖] D3 単体テスト: 税込変換・代替案3件保証・streak 算出
- [✖] D4 統合テスト: `/api/alt`/`/api/decision`/`/api/summary`（バリデーション/冪等）
- [✖] D5 E2E: オフライン→再送で二重作成なし
- [ ] D6 性能: `/api/alt` P95 300ms 測定をレポート出力

<!-- 環境構築の詳細な手順は冒頭セクションと docs/dev-setup.md を参照。ここでの重複定義は削除し一本化。 -->

### テスト環境（実行前提）
- ランタイム: Miniflare（Workers）で D1 バインディングを提供
- データ: テスト毎に一時DBまたはトランザクション相当で隔離（シードは `tests/seed.sql` 想定）
- 相関ID: `X-Request-Id` を常に送信し、本文`requestId`とヘッダの一致を検証
- レート制限: テストでは無効化 or 寸止め設定（429検証用ケースのみ有効）

---

### 修正を伴うファイル（予定）
- `packages/shared/src/schemas/alt.ts`（`inputIsPretax` 既定）
- `packages/shared/src/schemas/intent.ts`（同上）
- `packages/api/src/routes/alt.ts`（税込変換/レスポンス）
- `packages/api/src/lib/errors.ts`（エラー形式統一）
- `openapi/openapi.yaml`（`alternatives` 個数固定、`savedAmount: integer`）
- `docs/security.md`（CSP）

### 受け入れ確認（チェックリスト）
- [ ] 実機3G相当で起動〜入力2s以内、代替案初回描画P95≤300ms
- [ ] 代替案は常に3件
- [ ] `inputIsPretax=false` 既定、境界変換OK（テスト緑）
- [ ] 冪等キーの再送が200で同応答
- [ ] `/api/summary` 正常/異常クエリの網羅
- [ ] CI緑（typecheck/lint/test/perfレポート）
