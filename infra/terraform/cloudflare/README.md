# Cloudflare Terraform 雛形（フルスタック Workers）

このディレクトリは、Cloudflare 上で下記をコード化するための雛形です。
- D1 データベース
- Worker ルーティング（独自ドメイン → 単一Worker）
- Cron トリガ（`scheduled` ハンドラ）

アプリ本体（Worker バンドル + assets）は `wrangler deploy` で配布します。

## 使い方

1) 変数ファイルを作成
- `cp terraform.tfvars.example terraform.tfvars`
- 値を自分のアカウント/ドメインに置き換え

2) 適用
- `terraform init`
- `terraform plan`
- `terraform apply`

3) アプリのデプロイ
- ルートで `pnpm --filter @wom/web build`
- `wrangler deploy --env production`

> ルーティングを有効にしている場合、`https://<domain>/` でフロント、`/api/*` で API が動作します。

## 注意
- Cron を Terraform で管理する場合、本番用 `wrangler.toml` の `[triggers]` は削除/コメントアウトして二重定義を避けてください。
- D1 バインディング名（`DB`）は `wrangler.toml` とアプリ実装の両方で一致させてください。
- Workers.dev のみで確認する場合は `enable_route = false` にできます（独自ドメインのルート作成をスキップ）。

