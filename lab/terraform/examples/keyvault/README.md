# Example: a hardened Key Vault

This example calls [`modules/keyvault`](../../modules/keyvault/README.md) with its two necessary inputs.
The module makes the vault, its virtual network and private endpoint, a managed identity that can read one secret, and the audit log setting.

It needs a resource group and a Log Analytics workspace that exist.

## Run it

1. Examine the plan with no sign-in. The test uses mocked providers:

   ```
   terraform init -backend=false
   terraform test
   ```

2. To make the resources, sign in to Azure (`az login`). Then:

   ```
   terraform init
   terraform plan -var resource_group_name=<name> -var log_analytics_workspace_id=<id>
   terraform apply -var resource_group_name=<name> -var log_analytics_workspace_id=<id>
   ```

3. To remove them: `terraform destroy -var resource_group_name=<name> -var log_analytics_workspace_id=<id>`
