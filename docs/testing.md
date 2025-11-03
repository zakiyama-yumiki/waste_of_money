# テスト戦略

## レベル
- ユニット: ルール生成、streak計算、税込変換/丸め
- 統合: Honoルータ（Zodバリデーション、冪等キー、429）
- E2E: オフライン→同期、PWAインストール、初回起動2s
- パフォーマンス: k6/Workerd で /api/alt のP95測定

## TDD 運用
- 進め方とテストケース一覧は `docs/testing-tdd.md` を参照
- スプリントでの「先に書くテスト」は受け入れ→統合→単体の順に追加

## 失敗時ポリシー
- AI失敗→ルールのみ返却（200、`source='rule'`）
- DBタイムアウト→`/api/alt` は代替案のみ（intent遅延書込は将来）

## 型チェック/静的解析
- `pnpm typecheck` をCI必須（`tsc --noEmit`）。
- 列挙（`hungerLevel`, `category`）の分岐は `ts-pattern` 等で網羅（exhaustive）検査。
- ESLint: `@typescript-eslint` を導入し、`no-floating-promises`/`no-misused-promises` を有効にする。
