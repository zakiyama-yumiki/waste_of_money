terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
}

provider "cloudflare" {
  # 推奨: Terraform Cloud / CI の環境変数で渡す
  # 例) CLOUDFLARE_API_TOKEN
}

# --- D1 Database ---
resource "cloudflare_d1_database" "wom" {
  account_id = var.account_id
  name       = var.d1_name
}

# --- Workers Route (独自ドメイン→単一Worker) ---
resource "cloudflare_workers_route" "all" {
  count   = var.enable_route ? 1 : 0
  zone_id = var.zone_id
  pattern = "${var.domain}/*"
  script  = var.worker_name
}

