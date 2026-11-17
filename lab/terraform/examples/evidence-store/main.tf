# Example: a write-once store for audit evidence. The immutability policy
# starts unlocked, so you can remove the example. Do not lock it for a test:
# a locked policy cannot be removed.

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id != "" ? var.subscription_id : null
}

module "evidence_store" {
  source = "../../modules/evidence-store"

  storage_account_name       = var.storage_account_name
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  immutability_period_days   = var.immutability_period_days
}
