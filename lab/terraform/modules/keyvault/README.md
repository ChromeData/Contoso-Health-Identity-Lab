# modules/keyvault: Hardened Key Vault

This module makes a Key Vault with RBAC authorization for the data plane.
Public network access is off, unless you give an IP range. A private endpoint with private DNS gives access from the lab network.
A user-assigned managed identity gets the Key Vault Secrets User role. The audit logs go to Log Analytics.

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "keyvault" {
  source = "../../modules/keyvault"

  key_vault_name                = var.key_vault_name
  resource_group_name           = azurerm_resource_group.idlab.name
  location                      = var.location
  tenant_id                     = var.tenant_id
  log_analytics_workspace_id    = azurerm_log_analytics_workspace.idlab.id
  allowed_ip_ranges             = var.operator_ip_ranges
  secrets_officer_principal_ids = var.key_vault_secrets_officer_ids
  tags                          = var.tags
}
```

## Tests

2 test files in [`tests/`](tests/), with mocked providers. No sign-in is necessary.

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
| azurerm | ~> 4.0 |

### Providers

| Name | Version |
| ---- | ------- |
| azurerm | ~> 4.0 |

### Resources

| Name | Type |
| ---- | ---- |
| [azurerm_key_vault.idlab](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault) | resource |
| [azurerm_monitor_diagnostic_setting.kv](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_diagnostic_setting) | resource |
| [azurerm_network_security_group.private_endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_security_group) | resource |
| [azurerm_private_dns_zone.vault](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_dns_zone) | resource |
| [azurerm_private_dns_zone_virtual_network_link.vault](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_dns_zone_virtual_network_link) | resource |
| [azurerm_private_endpoint.kv](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_endpoint) | resource |
| [azurerm_role_assignment.kv_secrets_officer](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.kv_secrets_user](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_subnet.private_endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet) | resource |
| [azurerm_subnet_network_security_group_association.private_endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_network_security_group_association) | resource |
| [azurerm_user_assigned_identity.kv_reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/user_assigned_identity) | resource |
| [azurerm_virtual_network.lab](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_network) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| log\_analytics\_workspace\_id | Resource id of loga-idlab (required). Key Vault audit logs + AllMetrics always stream here. | `string` | n/a | yes |
| resource\_group\_name | Resource group that holds the vault + networking (contract: rg-identity-lab). | `string` | n/a | yes |
| allowed\_ip\_ranges | Public IPv4 addresses/CIDRs allowed to reach the vault data plane (e.g. the<br/>operator's home IP as "203.0.113.7/32"). EMPTY = public network access is<br/>disabled entirely and the vault is reachable only through the private<br/>endpoint (production posture). A non-empty list is the lab compromise: the<br/>operator has no VNet-connected workstation, so the firewall admits only<br/>their IP; everything else is still denied. | `list(string)` | `[]` | no |
| key\_vault\_name | Globally-unique Key Vault name (3-24 chars, alphanumeric + hyphens).<br/>Contract default is "kv-idlab" but the global namespace means you will<br/>likely need a suffix, e.g. "kv-idlab-7f3a". | `string` | `"kv-idlab"` | no |
| location | Azure region (contract: eastus2). | `string` | `"eastus2"` | no |
| private\_endpoint\_subnet\_prefix | Subnet CIDR dedicated to private endpoints. | `list(string)` | <pre>[<br/>  "10.42.1.0/24"<br/>]</pre> | no |
| purge\_protection\_enabled | Purge protection blocks permanent deletion during the retention window.<br/>TRUE is correct for anything near production; kept as a toggle because a<br/>throwaway lab vault with purge protection cannot be fully removed for up<br/>to 90 days. | `bool` | `true` | no |
| secrets\_officer\_principal\_ids | Object ids of HUMANS who may write secrets (Key Vault Secrets Officer).<br/>Keep this to the operator's admin account; workloads get Secrets User<br/>(read) only. The break-glass password is not stored in this vault<br/>(README human step 6). | `list(string)` | `[]` | no |
| soft\_delete\_retention\_days | Key Vault soft-delete retention (7-90). 90 is the hardened default. | `number` | `90` | no |
| tags | Tags applied to every resource in this module. | `map(string)` | <pre>{<br/>  "project": "contoso-health-identity-lab",<br/>  "tier": "security"<br/>}</pre> | no |
| tenant\_id | Entra ID tenant id used for Key Vault data-plane auth. Leave empty to<br/>auto-detect from the current azurerm credentials (data.azurerm\_client\_config). | `string` | `""` | no |
| uami\_name | Name of the user-assigned managed identity granted Key Vault Secrets User. | `string` | `"id-kv-idlab-reader"` | no |
| uami\_readable\_secret\_names | The ONLY secret names the workload identity (UAMI) may read. Enforced by an<br/>ABAC condition on its Key Vault Secrets User assignment, so Tier-0 secrets<br/>in the same vault (svc-vault-rotator, dc01-dsrm-password) and the playbook<br/>secrets stay unreadable to it. Create the secret(s) yourself; the identity<br/>can read nothing else. | `list(string)` | <pre>[<br/>  "demo-app-config"<br/>]</pre> | no |
| vnet\_address\_space | Address space for the lab VNet. | `list(string)` | <pre>[<br/>  "10.42.0.0/16"<br/>]</pre> | no |
| vnet\_name | Virtual network that hosts the Key Vault private endpoint subnet. | `string` | `"vnet-identity-lab"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| key\_vault\_id | Resource id of the Key Vault. |
| key\_vault\_name | Name of the Key Vault (scripts address secrets by vault name). |
| key\_vault\_uri | Data-plane URI (resolves privately via the private endpoint). |
| private\_endpoint\_ip | Private IP assigned to the Key Vault private endpoint NIC. |
| uami\_client\_id | Client id of the UAMI (for workload federation / app config). |
| uami\_id | Resource id of the user-assigned managed identity. |
| uami\_principal\_id | Principal (object) id of the UAMI - Key Vault Secrets User, ABAC-limited to uami\_readable\_secret\_names. |
| vnet\_id | Lab VNet id (linked to the vault's private DNS zone). |
| vnet\_name | Lab VNet name - other modules add their subnets here (e.g. the DC). |
<!-- END_TF_DOCS -->
