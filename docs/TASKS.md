# タスクボード（運用方針と全体観）

本レポジトリのタスク進行を可視化するためのトップボードです。詳細は `docs/tasks/*.md` を参照します。

## 運用ルール
- 真実のソース: `requirements.md`（製品仕様） / `openapi/openapi.yaml`（API契約）
- ステータス: `TODO` / `DOING` / `BLOCKED` / `REVIEW` / `DONE`
- 記述粒度: 1タスク=1成果（DoDで判定可能）
- 受け入れ基準(DoD): サブタスク/テスト/ドキュメント更新まで含めて明記
- リンク: 可能ならPR/Issue/関連ファイルを記載（相対パスでOK）

## Now（着手中）
- [ ] API共通エラーハンドラ実装（nested形式）
- [ ] `/api/alt` draft永続化 + 24h expiry 実装
- [ ] `GET /api/summary` `month`/`from-to` 実装（Asia/Tokyo固定）

## Next（次にやる）
- [ ] DB移行: `hunger_level INTEGER→TEXT列挙`（none|low|medium|high）
- [ ] Drizzleモデル: `amount_incl_tax` へ置換（dual-write→一本化）
- [ ] CI: `pnpm typecheck`/`lint`/`generate:types` の導入

## Later（後でやる）
- [ ] レート制限/Turnstile本番閾値の調整
- [ ] PostHog/SentryのPIIスクラビング検証
- [ ] 生成AI統合（フォールバック含む）

## スプリントドキュメント
- Sprint 1（MVP実装）: `docs/tasks/sprint-1-implementation.md`
- Sprint 2（拡張）: `docs/tasks/sprint-2.md`
