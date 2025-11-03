# 貢献ガイド

## 開発環境
- Node.js 20 / pnpm
- `pnpm i` で依存を導入

## コーディング規約
- TypeScript: 厳格（`strict: true`）
- 共有型は `packages/shared` に集約
- API入力/出力は必ずZodスキーマで検証
 - tsconfig 主要フラグ: `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`
 - 列挙: `hungerLevel = 'none'|'low'|'medium'|'high'`, `category = 'snack'|'drink'|'meal'|'hobby'|'other'`
 - 金額の型: 円は整数で扱い、アプリ層ではブランド型 `type Yen = number & { readonly __yen: unique symbol }` を推奨
 - Promiseハンドリング: `no-floating-promises` を遵守（ESLint/TSルール）

## PRチェックリスト
- [ ] 仕様変更は `docs/*` と OpenAPI を更新
- [ ] 型は `packages/shared` を更新
- [ ] バリデーションとエラー契約（400/429/500）を確認
- [ ] テスト/ビルドが通る
 - [ ] OpenAPIから型再生成済み（例: `pnpm generate:types`）
 - [ ] `pnpm typecheck` / `pnpm lint` を通過
