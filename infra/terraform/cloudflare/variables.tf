variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "zone_id" {
  description = "Zone ID (例: example.com の Zone)"
  type        = string
  default = null 
}

variable "domain" {
  description = "配信ドメイン（例: app.example.com）"
  type        = string
  default = null 
}

variable "worker_name" {
  description = "wrangler でデプロイする Worker 名（wrangler.toml の name と一致）"
  type        = string
  default     = "waste-of-money-api"
}

variable "d1_name" {
  description = "D1 データベース名"
  type        = string
  default     = "wom_prod"
}

variable "enable_route" {
  description = "独自ドメインへのルートを作成する（workers.dev のみで検証する場合は false）"
  type        = bool
  default     = true
}

