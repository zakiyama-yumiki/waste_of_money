output "d1_database_id" {
  value       = cloudflare_d1_database.wom.id
  description = "D1 Database ID（wrangler.toml の production 設定等で利用）"
}

output "d1_database_name" {
  value       = cloudflare_d1_database.wom.name
  description = "D1 Database 名称"
}

output "worker_route_pattern" {
  value       = var.enable_route ? one(cloudflare_workers_route.all[*].pattern) : null
  description = "作成したルートのパターン（enable_route=false の場合 null）"
}

output "worker_script_name" {
  value       = var.worker_name
  description = "対象の Worker 名"
}
