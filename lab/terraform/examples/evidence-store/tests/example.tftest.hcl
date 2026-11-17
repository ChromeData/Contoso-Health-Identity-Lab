# The example plans with mocked providers. No sign-in is necessary.
#   terraform init -backend=false && terraform test

mock_provider "azurerm" {
  mock_resource "azurerm_storage_account" {
    defaults = {
      id                    = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-identity-lab/providers/Microsoft.Storage/storageAccounts/stidlabevidence"
      primary_blob_endpoint = "https://stidlabevidence.blob.core.windows.net/"
    }
  }
  mock_resource "azurerm_storage_container" {
    defaults = {
      id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-identity-lab/providers/Microsoft.Storage/storageAccounts/stidlabevidence/blobServices/default/containers/evidence"
    }
  }
}

variables {
  resource_group_name        = "rg-example"
  log_analytics_workspace_id = "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg-example/providers/Microsoft.OperationalInsights/workspaces/loga-example"
}

run "the_example_plans" {
  command = plan

  assert {
    condition     = output.storage_account_name == "stexampleevidence01"
    error_message = "The example must plan one storage account with the name from var.storage_account_name."
  }
}
