# オフライン同期プロトコル

## 目的
オフラインでの入力を安全にサーバーへ反映し、重複・順序問題を防ぐ。

## リクエスト
`POST /api/sync`
```json
{
  "clientId": "uuid-v4",
  "batchId": "uuid-v4",
  "events": [
    { "type": "intent", "idempotencyKey": "uuid-v4", "client_ts": "2025-10-20T12:00:00Z", "payload": { /* intent payload */ } }
  ]
}
```

## 冪等
- `idempotencyKey` はイベントごと必須。TTL=24h。
- サーバーはキーが既存なら前回レスポンスを返却。

## 制限
- 1 リクエスト最大 50 イベント
- レート制限により 429 の可能性（`Retry-After`）

