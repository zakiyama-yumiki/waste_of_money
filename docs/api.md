# API 概要（人間向け）

本書は Web/PWA クライアントから呼び出す API の人間可読な概要です。機械可読仕様は `openapi/openapi.yaml` を真実のソースとします。

## 原則
- コンテンツタイプ: `application/json; charset=utf-8`
- タイムゾーン: `Asia/Tokyo`
- 金額は原則「税込」で保存・返却（MVP税率10%、四捨五入）。
- 冪等化: 書き込み系は `Idempotency-Key`（UUID）対応。TTL=24h、再送時は前回結果を 200 で返却。
- レート制限: `device_id` + IP で 10 req/min（バースト20）。超過で 429 + `Retry-After`。
- 相関: リクエストヘッダ `X-Request-Id`/`X-Correlation-Id` を受理・反映。
 - 型定義: 本書は説明用。実際の型は `openapi/openapi.yaml` から自動生成し `packages/shared` で共有。

## 共通エラー形式
```json
{
  "error": { "code": "string", "message": "string", "details": { "field?": "reason" } },
  "requestId": "string"
}
```
- 400: `error.code=BAD_REQUEST`（Zodのエラー詳細を含む）
- 401: `UNAUTHORIZED`（将来）
- 403: `FORBIDDEN`
- 409: `CONFLICT`
- 429: `RATE_LIMITED`（`Retry-After`ヘッダあり）
- 500: `INTERNAL`

### ステータス/コード対応表
| HTTP | code | 説明 |
|------|------|------|
| 200 | なし | 正常応答 |
| 400 | BAD_REQUEST | 入力不正（Zodのエラー詳細を含む） |
| 429 | RATE_LIMITED | レート制限。`Retry-After`ヘッダあり |
| 500 | INTERNAL | 予期せぬエラー |

## エンドポイント

### POST /api/alt
- 入力: `{ amount:int[1..50000], inputIsPretax=false, taxRate=0.10, tone:'gentle'|'humor'|'spartan', locale='ja-JP', category?, goal?, hobbies?:string[<=5] }`
- 出力: `{ intentId:string, alternatives:[{ id,text, tag?, source:'rule'|'ai', score? }] }`
- 説明: 金額から代替案を3件生成。`inputIsPretax=true`のときは税込へ変換（四捨五入）。

例（リクエスト）
```http
POST /api/alt HTTP/1.1
Content-Type: application/json
Idempotency-Key: 9f3998c1-9a8a-4a7b-9e60-8d4a28a0c111

{ "amount": 300, "inputIsPretax": false, "tone": "gentle" }
```
例（レスポンス）
```json
{ "intentId": "intent_123", "alternatives": [
  { "id": "a1", "text": "¥330で水筒を使って節約", "source": "rule" },
  { "id": "a2", "text": "¥330で家コーヒーに切替", "source": "rule" },
  { "id": "a3", "text": "¥330を貯金してご褒美", "source": "rule" }
]}
```

### POST /api/intent
- 入力: `{ amount:int, inputIsPretax?:false, taxRate?:0.10, category?, hungerLevel?:'none'|'low'|'medium'|'high' }`
- 出力: `{ intentId }`

### POST /api/decision
- 入力: `{ intentId, outcome:'avoided'|'purchased', savedAmount?:number, reasonTag?, tone? }`
- 出力: `{ ok:true }`
- 備考: `savedAmount`未指定かつ`avoided`時はサーバー側で intent の税込額を適用。

例（リクエスト）
```http
POST /api/decision HTTP/1.1
Content-Type: application/json
Idempotency-Key: 4f9d5b18-6b4d-4b90-81f2-6f11a6fabcde

{ "intentId": "intent_123", "outcome": "avoided" }
```
例（レスポンス）
```json
{ "ok": true }
```

- ### GET /api/summary
- 入力: `?month=YYYY-MM` または `?from=ISO8601&to=ISO8601`（TZ=Asia/Tokyo固定、`tz`クエリ無し）
- 出力: `{ monthSavedTotalInclTax:number, streak:int, countAvoided:int }`

例（クエリ）
```
GET /api/summary?month=2025-10
GET /api/summary?from=2025-10-01T00:00:00+09:00&to=2025-10-31T23:59:59+09:00
```

例（レスポンス）
```json
{ "monthSavedTotalInclTax": 4820, "streak": 5, "countAvoided": 12 }
```
備考
- `month` と `from/to` の同時指定は 400（`error.code=INVALID_RANGE`）。
- `from`/`to` は両方必須。`from > to` は 400。
- 日付境界は Asia/Tokyo の 00:00。

### POST /api/sync
- 入力: `{ events: Event[], clientId:string, batchId:string }`（最大50件）
- 出力: `{ stored:int, duplicates:int }`
- 備考: 各イベントは `idempotencyKey` と `client_ts` を含むこと。

## 入力制約（抜粋）
- `amount`: 整数、1〜50,000 円
- `tone`: `'gentle'|'humor'|'spartan'`
- `hungerLevel`: `'none'|'low'|'medium'|'high'`
- `category`: `snack|drink|meal|hobby|other`（MVP）
