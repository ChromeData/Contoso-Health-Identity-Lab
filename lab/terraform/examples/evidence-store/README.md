# Example: a write-once evidence store

This example calls [`modules/evidence-store`](../../modules/evidence-store/README.md).
The module makes a storage account that accepts Entra sign-in only, with a time-based immutability policy.
During the retention, nobody can change or delete a blob version.

The policy starts unlocked, with 30 days in this example. Do not lock it for a test. A locked policy is permanent.

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
