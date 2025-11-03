# TDD ガイド（Sprint 1 適用）

## 原則（Red → Green → Refactor）
- Red: 受け入れ基準に対応する失敗テストを先に書く（最小）
- Green: 最短距離で通す（仮実装OK）
- Refactor: 重複・命名・構造を整理し、テストは緑のまま維持

## レベルと順序（外から内へ）
1) 受け入れ（API境界/ユースケース）
2) 統合（ルータ×検証×DB/冪等）
3) 単体（丸め/変換/ルール選定/ユーティリティ）
4) 性能（/api/alt P95/300ms、ルール径路）

## Sprint 1 受け入れテスト（先に書く項目）
- alt_generates_three_alternatives_for_amount_incl_tax
  - 前提: `inputIsPretax=false` 既定
  - 期待: 200、`alternatives.length===3`、各`text`に金額（¥1,234形式）
- error_shape_is_consistent
  - 期待: 400で `{ error:{code,message,details?}, requestId }`
- idempotency_returns_same_result
  - 同一 `Idempotency-Key` の再送で200・同一`intentId`
- decision_defaults_savedAmount_when_avoided
  - `savedAmount`未指定のavoidedで`intents.amount_incl_tax`が保存
- summary_validates_query_and_aggregates
  - `month` XOR `from/to`、`from>to`は400、正常で `{ monthSavedTotalInclTax, streak, countAvoided }`

## 単体テスト（境界値）
- toInclTaxHalfUp(amountPretax,taxRate)
  - 1, 9, 10, 11, 99, 100, 101, 999 → 期待税込（half-up）
- computeStreak(decisions[], tz=Asia/Tokyo)
  - 日跨ぎ/同日複数/空データ
- buildAlternatives(ruleDict, amountIncl, tone, category)
  - 常に3件/フォールバック時も3件

## 推奨テスト配置
- packages/api/tests/
  - alt.route.acceptance.test.ts
  - decision.route.integration.test.ts
  - summary.route.integration.test.ts
  - idempotency.integration.test.ts
- packages/shared/tests/
  - money.unit.test.ts（toInclTaxHalfUp）
  - streak.unit.test.ts
  - alternatives.unit.test.ts

## 名前規約
- `should_...` よりも「振る舞い」を日本語/英語で簡潔に（例: `returns_three_alternatives`）
- 1テスト=1期待（複数期待は分割）

## 性能測定（P95）
- ルール生成径路で `/api/alt` を対象
- 同一ワーカー内で 1,000 リクエスト → P50/P95 を計測しCIに出力（k6/Workerd想定）

## CI ゲート
- `typecheck`/`lint`/`test`/`perf` 全て緑でマージ可
- 受け入れテストは常にブロッカー扱い（失敗時はマージ不可）

