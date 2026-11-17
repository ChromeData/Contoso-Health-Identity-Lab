# Example: groups and break-glass accounts

This example calls [`modules/groups`](../../modules/groups/README.md) with its one necessary input.
The module makes two break-glass accounts, the Break-Glass-Admins group, the dynamic groups by department, the PIM group and the app access groups.

Use a test tenant. The break-glass group gets the Global Administrator role.

## Run it

1. Examine the plan with no sign-in. The test uses mocked providers:

   ```
   terraform init -backend=false
   terraform test
   ```

2. To make the resources, sign in to the tenant (`az login --allow-no-subscriptions`). Then:

   ```
   terraform init
   terraform plan -var break_glass_domain=<tenant>.onmicrosoft.com
   terraform apply -var break_glass_domain=<tenant>.onmicrosoft.com
   ```

3. To remove them: `terraform destroy -var break_glass_domain=<tenant>.onmicrosoft.com`
