# modules/entra-diagnostics: Entra logs to Log Analytics

This module makes the diagnostic setting of the tenant. It sends the Entra audit, sign-in, provisioning and Graph activity logs to the Log Analytics workspace, where the KQL rules run.
A person applies it from `envs/bootstrap`. The pipeline does not manage it, so a pull request cannot remove it.

## Usage

The lab calls this module in [`envs/bootstrap/main.tf`](../../envs/bootstrap/main.tf):

```hcl
module "entra_diagnostics" {
  source = "../../modules/entra-diagnostics"
  count  = var.log_analytics_workspace_id != "" ? 1 : 0

  log_analytics_workspace_id = var.log_analytics_workspace_id

  enable_identity_protection_logs = var.enable_identity_protection_logs
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
| [azurerm_monitor_aad_diagnostic_setting.entra](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_aad_diagnostic_setting) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| log\_analytics\_workspace\_id | Resource id of loga-idlab (envs/dev output log\_analytics\_workspace\_id). | `string` | n/a | yes |
| categories | Baseline Entra log categories to export (exact diagnostic-setting ids,<br/>not table names). The defaults feed lab/kql, the provisioning evidence,<br/>and the workload-identity (NHI) and ITDR views: service principal and<br/>managed identity sign-ins plus Microsoft Graph activity logs.<br/>Licensing: audit and sign-in logs are Free; ProvisioningLogs and<br/>MicrosoftGraphActivityLogs need Entra ID P1 or P2.<br/>COST: each category is billed per GB ingested into the workspace (free<br/>inside the Sentinel trial's 10 GB/day). MicrosoftGraphActivityLogs is by<br/>far the largest (Learn estimate: ~15 GiB/month per 1,000 users); drop it<br/>here if the workspace budget ever bites. AuditLogs and SignInLogs cannot<br/>be dropped (plan-time precondition in main.tf). | `list(string)` | <pre>[<br/>  "AuditLogs",<br/>  "SignInLogs",<br/>  "NonInteractiveUserSignInLogs",<br/>  "ServicePrincipalSignInLogs",<br/>  "ManagedIdentitySignInLogs",<br/>  "ProvisioningLogs",<br/>  "MicrosoftGraphActivityLogs"<br/>]</pre> | no |
| enable\_identity\_protection\_logs | Add the ID Protection risk categories: RiskyUsers + UserRiskEvents (feed<br/>lab/kql/identity-risk.kql and the risk-based CA006/CA007 tuning) and<br/>RiskyServicePrincipals + ServicePrincipalRiskEvents (workload-identity<br/>risk for the NHI story). Needs Entra ID P2; full workload-identity risk<br/>detail needs Workload Identities Premium. Off by default: without P2 the<br/>tables stay empty and Sentinel rejects rules that query them. | `bool` | `false` | no |
| extra\_categories | Additional documented categories appended to the baseline (distinct).<br/>For the four risk categories use enable\_identity\_protection\_logs (what<br/>envs/bootstrap passes); this list is for anything else. Anything not in<br/>main.tf's documented\_categories list fails at plan. | `list(string)` | `[]` | no |
| name | Diagnostic setting name. | `string` | `"entra-to-loga-idlab"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| categories | Entra log categories the diagnostic setting exports (baseline + opt-in risk categories + extra\_categories), sorted. |
| diagnostic\_setting\_id | Id of the tenant-level Entra diagnostic setting. |
| identity\_protection\_logs\_enabled | True when all four ID Protection risk categories are exported (via enable\_identity\_protection\_logs or extra\_categories). |
<!-- END_TF_DOCS -->
