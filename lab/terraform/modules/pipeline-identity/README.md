# modules/pipeline-identity: GitHub Actions identities (OIDC)

This module makes the app registrations that GitHub Actions signs in with. They have federated credentials only. There is no client secret.
PLAN can read, and pull requests can use it. APPLY can write, and only the protected `prod` environment can use it.
HR-SYNC and EVIDENCE are optional. See [ADR 0004](../../../docs/adr/0004-pipeline-workload-identity-federation.md).

## Usage

The lab calls this module in [`envs/bootstrap/main.tf`](../../envs/bootstrap/main.tf):

```hcl
module "pipeline_identity" {
  source = "../../modules/pipeline-identity"

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  github_owner_id       = var.github_owner_id
  github_repo_id        = var.github_repo_id
  prod_environment_name = var.prod_environment_name

  extra_apply_graph_roles = var.enable_app_management_roles ? local.app_management_apply_roles : []
  extra_plan_graph_roles  = var.enable_app_management_roles ? local.app_management_plan_roles : []

  hr_sync_enabled               = var.enable_hr_sync
  hr_provisioning_app_client_id = var.hr_provisioning_app_client_id
  hr_sync_upload_scope          = var.hr_sync_upload_scope
  hr_sync_log_read_graph_roles  = var.hr_sync_log_read_graph_roles

  evidence_enabled = var.enable_evidence_pack

  hr_provisioning_owner_object_ids = var.hr_provisioning_owner_object_ids
}
```

## Tests

3 test files in [`tests/`](tests/), with mocked providers. No sign-in is necessary.

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

### Providers

| Name | Version |
| ---- | ------- |
| azuread | ~> 3.10 |

### Resources

| Name | Type |
| ---- | ---- |
| [azuread_app_role_assignment.apply](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.evidence](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.hr_sync](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.plan](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_application.apply](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.evidence](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.hr_sync](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.plan](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application_federated_identity_credential.apply_prod](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_federated_identity_credential) | resource |
| [azuread_application_federated_identity_credential.evidence_main](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_federated_identity_credential) | resource |
| [azuread_application_federated_identity_credential.hr_sync_branch](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_federated_identity_credential) | resource |
| [azuread_application_federated_identity_credential.plan_main](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_federated_identity_credential) | resource |
| [azuread_application_federated_identity_credential.plan_pr](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_federated_identity_credential) | resource |
| [azuread_application_owner.hr_provisioning_humans](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_owner) | resource |
| [azuread_application_owner.hr_sync_owns_provisioning_app](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_owner) | resource |
| [azuread_service_principal.apply](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.evidence](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.hr_sync](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.plan](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| github\_owner | GitHub org/user that owns the IaC repo (the OWNER in repo:OWNER@OWNER-ID/REPO@REPO-ID). | `string` | n/a | yes |
| github\_owner\_id | Numeric id of github\_owner (OWNER-ID in repo:OWNER@OWNER-ID/REPO@REPO-ID). | `string` | n/a | yes |
| github\_repo | GitHub repository name holding this Terraform (the REPO in repo:OWNER@OWNER-ID/REPO@REPO-ID). | `string` | n/a | yes |
| github\_repo\_id | Numeric id of github\_repo (REPO-ID in repo:OWNER@OWNER-ID/REPO@REPO-ID). | `string` | n/a | yes |
| apply\_app\_display\_name | Display name of the write APPLY app registration. | `string` | `"gh-oidc-entra-apply (write)"` | no |
| apply\_graph\_roles | Microsoft Graph APPLICATION roles granted to the APPLY identity - exactly<br/>what envs/dev manages. HIGH PRIVILEGE: RoleManagement.ReadWrite.Directory<br/>is effectively Tier 0 (it could grant itself Global Admin). Mitigations:<br/>the identity is only reachable from the reviewer-gated `prod` environment,<br/>and envs/dev does not manage its OWN app roles, federation or RBAC (those<br/>live in envs/bootstrap, applied by a human), though as a Tier-0 identity<br/>it could still escalate out of band. (lab/kql/pim-activation.kql sees PIM<br/>activations only, not a direct "Add member to role" by an app;<br/>lab/kql/role-assigned-outside-pim.kql does.)<br/>No Application.* write role by default: the app-management roles that<br/>modules/apps needs are added only through extra\_apply\_graph\_roles<br/>(envs/bootstrap enable\_app\_management\_roles), when the SSO apps are due. | `list(string)` | <pre>[<br/>  "User.ReadWrite.All",<br/>  "Group.ReadWrite.All",<br/>  "Policy.Read.All",<br/>  "Policy.ReadWrite.ConditionalAccess",<br/>  "Application.Read.All",<br/>  "EntitlementManagement.ReadWrite.All",<br/>  "RoleManagement.ReadWrite.Directory",<br/>  "RoleManagementPolicy.ReadWrite.AzureADGroup",<br/>  "AdministrativeUnit.ReadWrite.All"<br/>]</pre> | no |
| evidence\_app\_display\_name | Display name of the EVIDENCE app registration. | `string` | `"EVIDENCE (gh-oidc evidence pack)"` | no |
| evidence\_enabled | Create the EVIDENCE app registration, service principal, federated credential (ref:refs/heads/main) and its read-only Graph roles. Off by default: a new identity is a deliberate, human bootstrap apply. Its storage grant is made in envs/bootstrap. | `bool` | `false` | no |
| evidence\_graph\_roles | Read-only Graph APPLICATION roles EVIDENCE exports the evidence pack with: the Export-EvidencePack.ps1 reads (main.tf lists what each covers). Read roles only (validated). | `list(string)` | <pre>[<br/>  "AuditLog.Read.All",<br/>  "AccessReview.Read.All",<br/>  "Policy.Read.All",<br/>  "RoleManagement.Read.Directory",<br/>  "PrivilegedAssignmentSchedule.Read.AzureADGroup",<br/>  "RoleAssignmentSchedule.Read.Directory",<br/>  "Directory.Read.All"<br/>]</pre> | no |
| extra\_apply\_graph\_roles | Additional Microsoft Graph APPLICATION roles for the APPLY identity. Every addition widens a Tier-0 identity: record it in the APPLY risk acceptance (lab/docs/risk-register.md). | `list(string)` | `[]` | no |
| extra\_plan\_graph\_roles | Additional read-only Microsoft Graph APPLICATION roles for the PLAN identity (e.g. Application.Read.All once envs/dev manages app registrations). | `list(string)` | `[]` | no |
| hr\_provisioning\_app\_client\_id | Client (app) id of the API-driven inbound provisioning app (lab/scripts/mock-hr/New-InboundProvisioningApp.ps1). Needed when hr\_sync\_upload\_scope = "owned": HR-SYNC becomes an owner of that app. Empty otherwise. | `string` | `""` | no |
| hr\_provisioning\_owner\_object\_ids | Entra USER object ids added as owners of the HR provisioning app's<br/>REGISTRATION (one azuread\_application\_owner each; its service principal and<br/>HR-SYNC's own ownership are untouched). ADR 0018: two people. Only used<br/>while HR-SYNC owns the app (hr\_sync\_upload\_scope = "owned"). Not marked<br/>sensitive, unlike envs/dev's app\_owner\_object\_ids: this module is applied<br/>only from envs/bootstrap on the operator's Mac (no plan is ever posted to a<br/>pull request), and for\_each refuses a sensitive set. | `list(string)` | `[]` | no |
| hr\_sync\_app\_display\_name | Display name of the HR-SYNC app registration. | `string` | `"HR-SYNC (gh-oidc hr-feed upload)"` | no |
| hr\_sync\_branch | The ONLY branch whose runs may sign in as HR-SYNC: subject repo:OWNER@OWNER-ID/REPO@REPO-ID:ref:refs/heads/<this>. Protect it with a ruleset (only the HR owner pushes). | `string` | `"hr-feed"` | no |
| hr\_sync\_enabled | Create the HR-SYNC app registration, service principal, federated credential (hr\_sync\_branch) and its Graph roles. Off by default: a new identity that can create and disable workforce accounts is a deliberate, human bootstrap apply. | `bool` | `false` | no |
| hr\_sync\_log\_read\_graph\_roles | Read-only Graph APPLICATION roles HR-SYNC uses to read the provisioning log for the run summary. Default AuditLog.Read.All (the GET /auditLogs/provisioning page also lists Directory.Read.All; add it only if the first run proves it is needed). ProvisioningLog.Read.All is the narrower candidate (verify). | `list(string)` | <pre>[<br/>  "AuditLog.Read.All"<br/>]</pre> | no |
| hr\_sync\_upload\_scope | Which bulkUpload application permission HR-SYNC gets:<br/>  "owned"  SynchronizationData-User.Upload.OwnedBy (least privileged):<br/>           only provisioning apps HR-SYNC owns; HR-SYNC is made an owner<br/>           of the app named by hr\_provisioning\_app\_client\_id.<br/>  "tenant" SynchronizationData-User.Upload: every API-driven<br/>           provisioning app in the tenant. Use only if "owned" is proven<br/>           not to work (verify note in main.tf). | `string` | `"owned"` | no |
| plan\_app\_display\_name | Display name of the read-only PLAN app registration. | `string` | `"gh-oidc-entra-plan (read-only)"` | no |
| plan\_graph\_roles | Microsoft Graph APPLICATION roles granted to the PLAN identity - read-only<br/>counterparts of the apply roles, enough to refresh every object envs/dev<br/>manages during `terraform plan`. | `list(string)` | <pre>[<br/>  "User.Read.All",<br/>  "Group.Read.All",<br/>  "Policy.Read.All",<br/>  "EntitlementManagement.Read.All",<br/>  "RoleManagement.Read.Directory",<br/>  "RoleManagementPolicy.Read.AzureADGroup",<br/>  "RoleManagementPolicy.Read.Directory",<br/>  "AdministrativeUnit.Read.All"<br/>]</pre> | no |
| prod\_environment\_name | GitHub Environment gating the APPLY identity. The federated subject becomes<br/>repo:OWNER@OWNER-ID/REPO@REPO-ID:environment:<this>. Protect this<br/>environment in GitHub with required reviewers so only approved runs can<br/>mint a write token. | `string` | `"prod"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| apply\_application\_client\_id | Client (app) id of the write APPLY identity - set as AZURE\_CLIENT\_ID for prod workflows. |
| apply\_federated\_subject | Subject claim the APPLY credential trusts. |
| apply\_graph\_roles | Effective Graph application roles of the APPLY identity (baseline + opt-in extras). Every entry beyond the baseline widens a Tier-0 identity. |
| apply\_service\_principal\_object\_id | Object id of the APPLY service principal. |
| evidence\_application\_client\_id | Client (app) id of the EVIDENCE identity - set as the EVIDENCE\_CLIENT\_ID repo variable for evidence-pack.yml. Null when disabled. |
| evidence\_federated\_subject | Subject claim the EVIDENCE credential trusts (the main-branch ref). Null when disabled. |
| evidence\_graph\_roles | Effective Graph application roles of the EVIDENCE identity (empty when disabled) - for the risk register and the NHI inventory. |
| evidence\_service\_principal\_object\_id | Object id of the EVIDENCE service principal (the principal of the evidence-container grant in envs/bootstrap). Null when disabled. |
| hr\_provisioning\_service\_principal\_object\_id | Object id of the HR provisioning app's service principal (the bulkUpload target). Null unless hr\_sync\_upload\_scope = "owned". |
| hr\_sync\_application\_client\_id | Client (app) id of the HR-SYNC identity - set as the HR\_SYNC\_CLIENT\_ID repo variable for hr-feed.yml. Null when disabled. |
| hr\_sync\_federated\_subject | Subject claim the HR-SYNC credential trusts (the hr-feed branch ref). Null when disabled. |
| hr\_sync\_graph\_roles | Effective Graph application roles of the HR-SYNC identity (empty when disabled) - for the risk register and the NHI inventory. |
| hr\_sync\_service\_principal\_object\_id | Object id of the HR-SYNC service principal. Null when disabled. |
| plan\_application\_client\_id | Client (app) id of the read-only PLAN identity - set as AZURE\_CLIENT\_ID for PR workflows. |
| plan\_federated\_subject | Subject claim the PLAN credential trusts. |
| plan\_graph\_roles | Effective Graph application roles of the PLAN identity (baseline + opt-in extras) - for the risk register and the NHI inventory. |
| plan\_main\_federated\_subject | Subject claim of the PLAN main-branch credential (config-drift on main: schedule / workflow\_dispatch). |
| plan\_service\_principal\_object\_id | Object id of the PLAN service principal. |
<!-- END_TF_DOCS -->
