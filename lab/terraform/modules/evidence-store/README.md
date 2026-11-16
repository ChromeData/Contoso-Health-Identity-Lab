# modules/evidence-store: Write-once evidence store

This module makes the storage account for the audit evidence.
A time-based immutability policy prevents the change or deletion of a blob version during its retention.
The policy starts unlocked. A second apply with an acknowledgement locks it, and that is permanent.
Sign-in is with Entra only. There are no account keys.

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "evidence_store" {
  source = "../../modules/evidence-store"
  count  = var.enable_evidence_store ? 1 : 0

  storage_account_name           = var.evidence_storage_account_name
  resource_group_name            = azurerm_resource_group.idlab.name
  location                       = var.location
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.idlab.id
  allowed_ip_ranges              = var.operator_ip_ranges
  immutability_period_days       = var.evidence_immutability_days
  immutability_state             = var.evidence_immutability_state
  immutability_lock_acknowledged = var.evidence_immutability_lock_acknowledged
  tags                           = var.tags
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
| azurerm | ~> 4.0 |

### Providers

| Name | Version |
| ---- | ------- |
| azurerm | ~> 4.0 |

### Resources

| Name | Type |
| ---- | ---- |
| [azurerm_monitor_diagnostic_setting.blob](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_diagnostic_setting) | resource |
| [azurerm_private_endpoint.blob](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_endpoint) | resource |
| [azurerm_role_assignment.reader](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.writer](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_storage_account.evidence](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_account) | resource |
| [azurerm_storage_container.evidence](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_container) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| log\_analytics\_workspace\_id | Resource id of loga-idlab (required). Blob read/write/delete logs and transaction metrics always stream here. | `string` | n/a | yes |
| resource\_group\_name | Resource group for the evidence store (contract: rg-identity-lab). | `string` | n/a | yes |
| allow\_protected\_append\_writes | Allow new blocks to be appended to append blobs under retention. False:<br/>evidence files are written once as block blobs, so nothing - not even an<br/>append - may change a retained object. | `bool` | `false` | no |
| allowed\_ip\_ranges | Public IPv4 CIDRs admitted through the storage firewall (the operator's<br/>workstation, e.g. "203.0.113.7/32"). EMPTY = public network access is<br/>disabled and the account is reachable only through a private endpoint<br/>(production posture). A non-empty list is the same lab compromise as the<br/>Key Vault: no VNet-connected workstation, so only the operator's IP gets<br/>in. A /32 is converted to the bare address the storage firewall expects;<br/>/31 is rejected because Azure Storage does not accept it. | `list(string)` | `[]` | no |
| container\_name | Private container that holds the evidence packs and assessment runs. | `string` | `"evidence"` | no |
| enable\_private\_endpoint | Create a private endpoint for the blob sub-resource. Off by default: the<br/>lab operator has no VNet-connected workstation. A bool, not "subnet id is<br/>non-empty", so the count is known at plan even when the subnet is created<br/>in the same apply. | `bool` | `false` | no |
| immutability\_lock\_acknowledged | Must be true for immutability\_state = "Locked". A deliberate second key<br/>for an action that cannot be undone: once locked, the retention period<br/>can never be reduced and the account cannot be deleted while it holds<br/>retained blobs. | `bool` | `false` | no |
| immutability\_period\_days | Retention interval of the account-level time-based immutability policy:<br/>every blob version is write- and delete-protected for this many days from<br/>its creation. Default 2190 days (6 years), the HIPAA documentation<br/>retention period (45 CFR 164.316(b)(2)(i)). While the policy is Unlocked<br/>this can be shortened, e.g. before locking a throwaway lab account; once<br/>Locked it can only be extended. | `number` | `2190` | no |
| immutability\_state | State of the account-level immutability policy.<br/>  Unlocked (default) - blobs are already write/delete protected, but an<br/>                       account administrator can shorten or delete the<br/>                       policy. Microsoft calls this the TESTING state.<br/>  Locked             - IRREVERSIBLE. Only extensions are allowed, and the<br/>                       account (and its resource group) cannot be deleted<br/>                       until every blob's retention has expired. This is<br/>                       the state that holds against a compromised<br/>                       subscription Contributor (see main.tf header).<br/>                       Needs immutability\_lock\_acknowledged = true, and<br/>                       must be a SECOND apply: Azure creates the policy<br/>                       only as Unlocked or Disabled.<br/>  Disabled           - policy off (versioning-level WORM support stays on). | `string` | `"Unlocked"` | no |
| location | Azure region (contract: eastus2). | `string` | `"eastus2"` | no |
| private\_dns\_zone\_ids | Ids of privatelink.blob.core.windows.net zone(s) to register the endpoint<br/>in. Empty = no DNS zone group (you resolve the private IP yourself). | `list(string)` | `[]` | no |
| private\_endpoint\_subnet\_id | Subnet for the private endpoint. Required when enable\_private\_endpoint = true. | `string` | `""` | no |
| reader\_principal\_ids | Object ids granted "Storage Blob Data Reader" on the evidence container<br/>(auditors). Same pipeline caveat as writer\_principal\_ids. | `list(string)` | `[]` | no |
| replication\_type | Account redundancy. GRS by default: the evidence is small (megabytes), so<br/>a second region costs cents, and losing the only copy of audit evidence to<br/>a regional outage is the failure an auditor asks about. Changing between<br/>the LRS/GRS family and the ZRS/GZRS family recreates the account, which a<br/>WORM account refuses while it holds retained blobs - choose once. | `string` | `"GRS"` | no |
| soft\_delete\_retention\_days | Blob and container soft delete (1-365 days). Microsoft recommends soft<br/>delete alongside immutability: it covers blobs whose retention has<br/>expired and the container itself. | `number` | `30` | no |
| storage\_account\_name | Globally unique storage account name (3-24 chars, lowercase letters and<br/>digits only). The contract default "stidlabevidence" will probably be<br/>taken, so add a suffix, e.g. "stidlabevidence7f3a". | `string` | `"stidlabevidence"` | no |
| tags | Tags applied to every resource in this module. | `map(string)` | <pre>{<br/>  "project": "contoso-health-identity-lab",<br/>  "tier": "evidence"<br/>}</pre> | no |
| writer\_principal\_ids | Object ids granted "Storage Blob Data Contributor" on the evidence<br/>container, with an ABAC condition that DENIES blob delete: writers can add<br/>evidence, never remove it, even after retention expires.<br/>Keep this EMPTY when the module is applied by the envs/dev pipeline: the<br/>APPLY identity may only delegate the roles allow-listed in envs/bootstrap,<br/>and storage data roles are deliberately not on that list (granting itself<br/>Storage Blob Data Contributor would reach the Terraform state account).<br/>A human grants the operator with the az command in the main.tf header,<br/>using the writer\_abac\_condition output. | `list(string)` | `[]` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| evidence\_container\_id | Resource Manager id of the evidence container: the --scope for the human writer role assignment. |
| evidence\_container\_name | Container that holds evidence packs and assessment runs (-ContainerName). |
| immutability | The account-level WORM policy as configured (state, retention days, append writes). |
| primary\_blob\_endpoint | Blob endpoint (Entra auth only; shared key is disabled). |
| storage\_account\_id | Resource id of the evidence storage account. |
| storage\_account\_name | Evidence storage account name (Invoke-BaselineAssessment.ps1 -StorageAccountName). |
| writer\_abac\_condition | ABAC condition for evidence writers (no delete in the evidence container). Pass it verbatim to az role assignment create --condition. |
<!-- END_TF_DOCS -->
