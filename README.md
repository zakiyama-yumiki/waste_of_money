# 無駄遣い防止アプリ（Waste of Money）

買う前に金額を入力すると「そのお金で代わりにできること」を提示して、一呼吸おいて意思決定を助けるPWA。

## クイックリンク
- 要件定義: `requirements.md`
- API概要（人向け）: `docs/api.md`
- OpenAPI（真実のソース）: `openapi/openapi.yaml`
- データモデル: `docs/data-model.md`
- オフライン同期: `docs/offline-sync.md`
- 分析/KPI: `docs/analytics.md`
- セキュリティ/CSP/レート制限: `docs/security.md`
- トーン指針: `docs/tone-style.md`
- アーキテクチャ: `docs/architecture.md`
- PWAガイド: `docs/pwa.md`
- テスト戦略: `docs/testing.md`
- 貢献ガイド: `docs/CONTRIBUTING.md`
- 用語集: `docs/glossary.md`

## モノレポ構成
```
packages/
  api/        # Hono(Cloudflare Workers) ルータ骨子
  shared/     # Zodスキーマ/共有型
openapi/      # OpenAPI 3.1
docs/         # 仕様・運用ドキュメント
drizzle/      # D1マイグレーション
```

## 開発の前提
- Node.js 20系 / pnpm
- タイムゾーン: Asia/Tokyo
- 金額は税込で保存/返却（税率10%、1円未満四捨五入）

