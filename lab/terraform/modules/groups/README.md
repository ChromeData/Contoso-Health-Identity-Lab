# modules/groups: Groups and break-glass accounts

This module makes the accounts and groups that Terraform owns: two break-glass accounts, the Break-Glass-Admins group, the dynamic groups by department, the PIM group and the app access groups.
It makes no workforce users. HR is the source for those.

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "groups" {
  source = "../../modules/groups"
  count  = var.enable_premium ? 1 : 0

  break_glass_domain = var.onmicrosoft_domain

  enable_nhi_governance  = var.enable_nhi_governance                                                # App-Consent-Reviewers
  enable_workforce_group = var.enable_phishing_resistant_all_users || var.enable_lcw_leaver_trigger # All-Workforce (passkey rollout; scheduled leaver trigger)
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
| random | ~> 3.6 |

### Providers

| Name | Version |
| ---- | ------- |
| azuread | ~> 3.10 |
| random | ~> 3.6 |

### Resources

| Name | Type |
| ---- | ---- |
| [azuread_directory_role_assignment.break_glass_global_admin](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/directory_role_assignment) | resource |
| [azuread_group.admin_accounts](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.all_workforce](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.app_access](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.app_consent_reviewers](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.break_glass](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.ca005_pilot](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.department](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.priv_iam_admins](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_user.break_glass](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/user) | resource |
| [random_password.break_glass](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| break\_glass\_domain | The tenant's initial *.onmicrosoft.com domain, used for the break-glass<br/>UPNs so emergency access never depends on custom-domain DNS or federation. | `string` | n/a | yes |
| all\_nurses\_department | Department value that drives the All-Nurses dynamic group rule. | `string` | `"Nursing"` | no |
| break\_glass\_count | Number of cloud-only break-glass admin accounts (contract = 2). | `number` | `2` | no |
| enable\_nhi\_governance | Create App-Consent-Reviewers (mail\_nickname app-consent-reviewers): the<br/>reviewers of the admin consent workflow that<br/>lab/scripts/powershell/post-apply/Set-ConsentPolicy.ps1 turns on. Users<br/>can no longer consent to unverified or high-impact apps, so someone must<br/>answer their "Need admin approval" requests. Plain security group - no<br/>licence needed for the group itself. Root flag: enable\_nhi\_governance. | `bool` | `false` | no |
| enable\_workforce\_group | Create the dynamic All-Workforce group (mail\_nickname all-workforce):<br/>every enabled, HR-synced MEMBER user. It is the staff target of the<br/>passkey profile set by post-apply/Set-AuthenticationMethodsPolicy.ps1<br/>-IncludeStaffRollout - a WORKFORCE group, never "all users", so the<br/>cloud-only break-glass accounts can never register a synced passkey.<br/>Dynamic membership needs Entra ID P1. Root flag:<br/>enable\_phishing\_resistant\_all\_users (the same rollout). | `bool` | `false` | no |
| icu\_department | Department value that drives the All-ICU dynamic group rule (mover target). | `string` | `"ICU"` | no |
| tags\_note | Entra ID groups/users do not carry Azure resource tags; this string is<br/>only surfaced in descriptions so the lab's intent is self-documenting. | `string` | `"contoso-health-identity-lab"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| admin\_accounts\_group\_object\_id | Object id of Admin-Accounts (standing, role-assignable, no role): the admin passkey profile and registration campaign target. Membership (adm- accounts, build account) is set post-apply by New-AdminAccounts.ps1. |
| all\_icu\_group\_object\_id | Object id of the All-ICU dynamic birthright group. |
| all\_nurses\_group\_object\_id | Object id of the All-Nurses dynamic birthright group. |
| all\_workforce\_group\_object\_id | Object id of the dynamic All-Workforce group (staff passkey profile target), or null while enable\_workforce\_group is off. |
| app\_access\_group\_object\_ids | Map of key => assigned access group object id (servicenow/aws/okta/icu\_critical\_care/pharmacy\_dispensing). |
| app\_consent\_reviewers\_group\_object\_id | Object id of App-Consent-Reviewers (admin consent workflow reviewers; Set-ConsentPolicy.ps1 finds it by mailNickname), or null while enable\_nhi\_governance is off. |
| break\_glass\_group\_object\_id | Object id of Break-Glass-Admins - excluded from every CA policy. |
| break\_glass\_user\_object\_ids | Object ids of the cloud-only break-glass accounts. |
| break\_glass\_user\_principal\_names | UPNs of the break-glass accounts (feed the sign-in alert / watchlist). |
| ca005\_pilot\_group\_object\_id | Object id of CA005-Pilot-CompliantDevice (CA005 include, Intune compliance assignment, VM Administrator Login on modules/intune-vm). |
| priv\_iam\_admins\_group\_object\_id | Object id of the PIM-governed Privileged-IAM-Admins group. |
<!-- END_TF_DOCS -->
