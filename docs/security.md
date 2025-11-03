# セキュリティ & レート制限 & CSP

## 認証
- MVPは匿名（将来ログイン）。`device_id` をクライアントで生成・保持。

## レート制限
- `device_id` + IP で 10 req/min（バースト20）。超過で 429 と `Retry-After`。

## CORS/CSP
- CORSはオリジン固定。
- 推奨CSP: `default-src 'self'; connect-src 'self' https://api.openai.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self';`（必要に応じて調整）

## 入力検証
- Zod によるサーバー側バリデーション必須。

## 監視
- エラーは Sentry、パフォーマンスは Workers Analytics。
