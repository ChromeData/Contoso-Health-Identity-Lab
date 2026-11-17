# Example: a hardened Key Vault. Public access is off, a private endpoint gives
# access from the virtual network, and the audit logs go to Log Analytics.

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id != "" ? var.subscription_id : null
}

module "keyvault" {
  source = "../../modules/keyvault"

  key_vault_name             = var.key_vault_name
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
}
