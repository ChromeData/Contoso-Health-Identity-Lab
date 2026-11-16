# modules/leaver-extension: Leaver step for automatic access packages

This module makes a Logic App. When a person leaves, it removes the access package assignments that an automatic policy made.
The built-in Lifecycle Workflows task does not remove them. See [ADR 0029](../../../docs/adr/0029-leaver-removes-birthright-packages-through-a-logic-app.md).
The Logic App uses its system-assigned managed identity. There is no secret.

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "leaver_extension" {
  source = "../../modules/leaver-extension"
  count  = var.enable_premium && var.enable_governance && var.enable_lcw_leaver_extension ? 1 : 0

  resource_group_name = azurerm_resource_group.idlab.name
  location            = var.location
  catalog_ids         = { clinical = module.entitlement[0].catalog_id }
  tags                = var.tags
}
```

## Tests

1 test file in [`tests/`](tests/), with mocked providers. No sign-in is necessary.

```
terraform init -backend=false
terraform test
```

## More detail

The header of [`main.tf`](main.tf) gives the design, the limits and the license notes.
The lists below are made by `terraform-docs`. Do not edit them by hand. Run [`tools/module-docs.sh`](../../tools/module-docs.sh).

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.6.0 |
| azuread | ~> 3.10 |
| azurerm | ~> 4.0 |
| time | ~> 0.13 |

### Providers

| Name | Version |
| ---- | ------- |
| azuread | ~> 3.10 |
| azurerm | ~> 4.0 |
| time | ~> 0.13 |

### Resources

| Name | Type |
| ---- | ---- |
| [azuread_access_package_catalog_role_assignment.assignment_manager](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_catalog_role_assignment) | resource |
| [azuread_app_role_assignment.entitlement_management_readwrite](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azurerm_resource_group_template_deployment.logic_app](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group_template_deployment) | resource |
| [time_sleep.identity_replication](https://registry.terraform.io/providers/hashicorp/time/latest/docs/resources/sleep) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| catalog\_ids | Static name => entitlement catalog id. The Logic App's identity gets 'Access package assignment manager' on THESE catalogs only, never a tenant-wide permission. Today: { clinical = <modules/entitlement output catalog\_id> }, the catalog that holds every T3 package. Keys are static so the plan works before the catalog id is known. | `map(string)` | n/a | yes |
| location | Azure region. | `string` | n/a | yes |
| resource\_group\_name | Resource group for the Logic App (the lab's RG-IDENTITY-LAB). | `string` | n/a | yes |
| name | Logic App (consumption) name. The custom task extension in Lifecycle Workflows points at it by name. | `string` | `"la-lcw-leaver-remove-birthright"` | no |
| tags | Tags on the Logic App. | `map(string)` | `{}` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| catalog\_role\_assignment\_ids | Catalog name => role assignment id (Access package assignment manager). |
| graph\_app\_role\_assignment\_id | Id of the EntitlementManagement.ReadWrite.All app role assignment on the Logic App's identity (ADR 0029, E183). |
| logic\_app\_name | Logic App name, for New-LifecycleWorkflows.ps1 -LeaverExtensionLogicAppName. |
| principal\_id | Object id of the Logic App's system-assigned managed identity. |
<!-- END_TF_DOCS -->
