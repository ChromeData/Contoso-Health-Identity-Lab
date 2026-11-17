# The example plans with mocked providers. No sign-in is necessary.
#   terraform init -backend=false && terraform test

mock_provider "azurerm" {
  mock_resource "azurerm_key_vault" {
    defaults = { id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-identity-lab/providers/Microsoft.KeyVault/vaults/kv-idlab" }
  }
  mock_resource "azurerm_virtual_network" {
    defaults = { id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-identity-lab/providers/Microsoft.Network/virtualNetworks/vnet-identity-lab" }
  }
  mock_resource "azurerm_subnet" {
    defaults = { id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-identity-lab/providers/Microsoft.Network/virtualNetworks/vnet-identity-lab/subnets/snet-private-endpoints" }
  }
  mock_resource "azurerm_private_dns_zone" {
    defaults = { id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-identity-lab/providers/Microsoft.Network/privateDnsZones/privatelink.vaultcore.azure.net" }
  }
  mock_data "azurerm_client_config" {
    defaults = { tenant_id = "11111111-1111-1111-1111-111111111111" }
  }
}

variables {
  resource_group_name        = "rg-example"
  log_analytics_workspace_id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-example/providers/Microsoft.OperationalInsights/workspaces/loga-example"
}

run "the_example_plans" {
  command = plan

  assert {
    condition     = output.key_vault_name == "kv-example-0001"
    error_message = "The example must plan one vault with the name from var.key_vault_name."
  }
}
