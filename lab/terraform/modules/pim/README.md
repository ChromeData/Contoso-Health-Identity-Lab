# modules/pim

Just-in-time admin access for Contoso Health: no human holds an admin role at
rest. It is **activated**, time-boxed, approved where the tier says so, and
recorded. Decisions: [ADR 0002](../../../docs/adr/0002-pim-for-groups-vs-direct-role-eligibility.md)
(PIM for Groups as the elevation path) and
[ADR 0020](../../../docs/adr/0020-pim-activation-design.md) (approver groups,
eligibility expiry, activation caps, step-up, direct Global Administrator
eligibility, AU-scoped help desk).

**Status: BUILT.** `validate` and 46 mocked `terraform test` runs pass
(HashiCorp Terraform 1.16.5, 2026-11-05). **Nothing has been applied: no
tenant exists yet.** **TENANT-TIME** steps need the M365 E5 trial (Entra ID
P2); *verify:* items are checked in that window.

| File | Flag in `envs/dev` (default) | What it builds |
|------|------------------------------|----------------|
| `main.tf` | `enable_premium` (false) | `Privileged-IAM-Admins` actively holds **User Administrator**. Its membership is eligible-only: PIM for Groups, MFA + justification + approval by `PIM-Approvers-Tier1` (`pim_require_approval`, default **true**), 4h, eligibility expires after 365 days |
| `approvers.tf` | `enable_premium` (false) | `PIM-Approvers-Tier0` and `PIM-Approvers-Tier1`, role-assignable groups routed as `groupMembers` approvers; members come from `tier0_approver_object_ids` / `approver_object_ids`. A `check` warns on fewer than two approvers |
| `tiers.tf` | `enable_pim_tiers` (false) | 16 role-assignable tier groups using the same pattern (table below) |
| `helpdesk.tf` | `enable_helpdesk_au_scoping` (false) | `AU-Workforce-Standard` and the help-desk roles of `PIM-Tier1-Helpdesk` scoped to it instead of the tenant. The AU's dynamic rule is a Graph PATCH (output `workforce_au_membership_body`) |
| `directory-roles.tf` | `enable_global_admin_pim_policy` (false) | Global Administrator's own PIM policy, **rendered** (output `directory_role_pim_policies`) for `post-apply/Set-DirectoryRolePimPolicies.ps1`: approval by `PIM-Approvers-Tier0`, MFA or the `c1` context, justification + ticket, 2h, named eligibility for 180 days. Break-glass keeps its standing assignment |
| `reviews.tf` | `enable_access_reviews_privileged` (false) | Rendered bodies (output `pim_eligible_review_bodies`) for quarterly, default-deny reviews of every PIM-governed group (eligible + active members), created by `post-apply/New-AccessReviewDefinitions.ps1` |
| `azure.tf` | `enable_pim_azure_resources` (false) | `PIM-Azure-RG-Contributors` is **eligible** for Contributor on the lab RG, with an Azure PIM activation policy (MFA + justification + approval by `PIM-Approvers-Tier0`, approver type Group, 4h) |
| `aws.tf` | `enable_pim_aws_admin` (false) | `PIM-AWS-Lab-Admins`, role-assignable, **eligible-only** membership = administrator of the lab AWS account ([ADR 0025](../../../docs/adr/0025-aws-admin-just-in-time-through-entra.md)). envs/dev assigns it to the AWS IAM Identity Center app (modules/apps); `lab/terraform/aws` gives its SCIM copy the `LabAdministrator` permission set. Activation: MFA + justification, 2h, no approval while the lab has one human admin (`aws_admin_require_approval`), every activation mailed to `pim_alert_mailbox`; eligibility expires after 180 days; reviewed quarterly, but **not** in `privileged_review_targets` (the CA002 / CA020 scope) |
| `demo-readers.tf` | `enable_pim_demo_readers` (false) | `PIM-Demo-Readers`, role-assignable, **eligible-only** membership; the group actively holds **Global Reader** + **Security Reader** tenant-wide (read-only presenter access). Activation: MFA + justification, 8h, **no approval**, every activation mailed to `pim_alert_mailbox`; eligibility expires after 365 days (Tier-1 duration). Reviewed quarterly, but **not** in `privileged_review_targets` (the CA002 / CA020 scope) and its roles are not in `privileged_role_template_ids` (CA020's role list). Its Azure **Reader**, **Microsoft Sentinel Reader** and **Log Analytics Reader** on the subscription are granted by `envs/bootstrap` (`enable_pim_demo_readers_azure_rbac`, human-applied), because the APPLY identity may not create them |

## Tier model

Tier 0 is the control plane: a role that can change how sign-in is protected,
grant roles, or take over a workload identity. Tier 1 changes devices,
ordinary users or one workload.

| Group | Role | Tier | Activation | Eligibility expires |
|-------|------|------|------------|---------------------|
| PIM-Tier0-Security-Admins | Security Administrator (`194ae4cb-…`) | 0 | MFA (or `c1`) + justification + ticket + **approval**, 4h | 180 days |
| PIM-Tier0-CA-Admins | Conditional Access Administrator (`b1be1c3e-…`) | 0 | same, 4h | 180 days |
| PIM-Tier0-Privileged-Role-Admins | Privileged Role Administrator (`e8611ab8-…`) | 0 | same, 4h | 180 days |
| PIM-Tier0-Privileged-Auth-Admins | Privileged Authentication Administrator (`7be44c8a-…`) | 0 | same, **2h** | 180 days |
| PIM-Tier0-Hybrid-Identity-Admins | Hybrid Identity Administrator (`8ac3fc64-…`) | 0 | same, 4h | 180 days |
| PIM-Tier0-Application-Admins | Application Administrator (`9b895d92-…`) | 0 | same, 4h | 180 days |
| PIM-Tier0-Cloud-Application-Admins | Cloud Application Administrator | 0 | same, 4h | 180 days |
| PIM-Tier0-Auth-Policy-Admins | Authentication Policy Administrator | 0 | same, 4h | 180 days |
| PIM-Tier1-Intune-Admins | Intune Administrator | 1 | MFA + justification + **approval**, 8h | 365 days |
| PIM-Tier1-Helpdesk | Helpdesk Administrator + Authentication Administrator (AU-scoped with `enable_helpdesk_au_scoping`) | 1 | MFA + justification, 8h | 365 days |
| PIM-Tier1-Groups-Admins | Groups Administrator | 1 | MFA + justification, 8h | 365 days |
| PIM-Tier1-Exchange-Admins | Exchange Administrator | 1 | same, 8h | 365 days |
| PIM-Tier1-SharePoint-Admins | SharePoint Administrator | 1 | same, 8h | 365 days |
| PIM-Tier1-Teams-Admins | Teams Administrator | 1 | same, 8h | 365 days |
| PIM-Tier1-License-Admins | License Administrator | 1 | same, 8h | 365 days |
| PIM-Tier1-IGA-Admins | Identity Governance Administrator + Lifecycle Workflows Administrator | 1 | MFA + justification + **approval**, 8h | 365 days |
| Privileged-IAM-Admins (`main.tf`) | User Administrator (`fe930be7-…`) | 1 | MFA + justification + **approval**, 4h | 365 days |
| Global Administrator (`directory-roles.tf`, named people, no group) | Global Administrator | 0 | MFA (or `c1`) + justification + ticket + **approval**, 2h | 180 days |
| PIM-Azure-RG-Contributors (`azure.tf`) | Azure **Contributor** on rg-identity-lab | 0 | MFA + justification + **approval**, 4h | permanent eligibility, reviewed quarterly |
| PIM-Demo-Readers (`demo-readers.tf`, not a tier group) | Global Reader (`f2ef992c-…`) + Security Reader (`5d6b6bb7-…`); Azure Reader, Microsoft Sentinel Reader, Log Analytics Reader on the subscription (`envs/bootstrap`) | read-only | MFA + justification, 8h, **no approval**, every activation mailed | 365 days |

**PIM-Demo-Readers and approval.** Microsoft recommends approval for groups
that elevate into Entra roles. This group has none on purpose: the presenter
activates alone, on camera, and the group is role-assignable, so nobody below
Privileged Authentication Administrator can reset the presenter's credentials
and activate on their behalf. Nothing it holds can change the tenant, but both
roles are labelled privileged by Microsoft and both can read BitLocker
recovery keys (`microsoft.directory/bitlockerKeys/key/read`), which is part of
why `PIM-Tier1-Intune-Admins` needs approval. Compensating controls: MFA and a
reason on every activation, 8 hours at most, every activation mailed, the
quarterly review, and the ITDR rule for members added outside PIM.

Template ids are in `variables.tf` (`pim_tier_groups`) and were checked
against Microsoft's built-in roles reference on 2026-10-20.

**Why these tiers.** A Conditional Access Administrator can exclude
themselves from every policy; a Security Administrator can turn off what
would notice; a Privileged Role Administrator can grant any role; an
Application Administrator can add a credential to any service principal,
the pipeline's APPLY identity included
([ADR 0005](../../../docs/adr/0005-risk-acceptance-apply-identity-tier0.md)).
So they are Tier 0. Authentication Policy Administrator is not labelled
privileged by Microsoft, but it sets the methods policy CA008 and CA009 rely
on, so it is Tier 0 here. Tier 1 gets a shift-length window and no approval
queue, because an approver who sees every help-desk shift learns to
rubber-stamp. Two Tier-1 groups are the exception: Intune (it reads LAPS
passwords and BitLocker keys) and IGA (both of its roles are labelled
privileged by Microsoft: whoever holds them can change who gets clinical
access by HR attribute and issue TAPs through a joiner workflow). ADR 0020
records both exceptions, with User Administrator. Contributor on the RG is Tier 0 because the RG holds DC01:
`az vm run-command` runs code as SYSTEM on the domain controller.

**Guardrails in code** (`variables.tf`, preconditions, checks):

- Global Administrator can never be a tier group's role, primary or
  additional (break-glass only; named eligibility through
  `directory-roles.tf`).
- The original `Privileged-IAM-Admins` binding (`role_template_id`) can
  hold neither Global Administrator nor a Tier-0 role: it gets Tier-1
  activation rules, so those roles go through a `tier = 0` group.
- A Tier-0 role cannot sit in a Tier-1 group, and a Tier-0 group cannot
  waive approval.
- Tier 0 without approvers fails at plan.
- Tier-0 eligibility cannot be longer than 180 days, and no per-group
  override can lengthen a tier's activation cap.
- Direct *active* assignment always expires.
- The authentication context (`tier0_activation_auth_context_id = "c1"`)
  replaces MFA on Tier 0 only, and the plan refuses it until CA021 is
  declared enforced (`activation_auth_context_ca_enforced`). Existing Tier-0
  policies switch in two applies (`tier0_auth_context_switchover_step1`,
  then `c1`), because the provider declares the two arguments as
  conflicting (ConflictsWith) and keeps the prior state for an unset value
  (verify: whether Graph itself accepts both).
- Azure eligibility can never be for a role that grants access (Owner, User
  Access Administrator, RBAC Administrator).
- `pim_alert_mailbox` must be empty or one address; Tier-1 activations notify
  it only when `tier1_activation_notifications` is on.

## Provider notes

- `azurerm_role_management_policy` auto-imports the existing policy, and its
  **destroy is a no-op** (checked in the azurerm 4.81 source). Turning the flag
  off leaves the last settings in Azure.
- `azurerm_pim_eligible_role_assignment` without `schedule` requests **no
  expiration**. That works only after the policy allows permanent eligibility,
  hence the `depends_on`. It is the one permanent eligibility in the module,
  reviewed quarterly (output `privileged_review_targets`).
- azuread 3.10 has no directory-role policy resource, and
  `azuread_directory_role_eligibility_schedule_request` always sends
  `noExpiration`, which the Global Administrator policy refuses. Hence the
  rendered bodies and the post-apply script.
- azuread 3.10's administrative unit has no dynamic membership and no
  restricted-management attribute: the dynamic rule is a Graph PATCH, and
  the VIP restricted AU is created by `post-apply/New-RestrictedAdminUnit.ps1`.
  `workforce_au_excluded_employee_ids` keeps that AU's VIPs out of the
  help desk's AU by HR employee id (the base rule is parenthesised, then
  `-and (user.employeeId -notIn [...])` is appended). The VIP AU's own responder roles
  (Helpdesk + Authentication Administrator held by
  `PIM-Tier0-Privileged-Auth-Admins` at `RMAU-VIP` scope) are granted by
  that script through PIM, not by this module: Terraform never sees the
  RMAU. Both ran in the lab tenant on 2026-11-05 (capture E16c).
- AU-scoped role assignments are not evaluated by Conditional Access's
  directory-role condition, so CA002 / CA020 include `PIM-Tier1-Helpdesk` by
  group.

## Who may apply what (TENANT-TIME)

| Change | Graph / ARM permission | CI APPLY identity has it? |
|--------|------------------------|---------------------------|
| Tier and approver groups, role binding, PIM-for-Groups policies | `Group.ReadWrite.All`, `RoleManagement.ReadWrite.Directory`, `RoleManagementPolicy.ReadWrite.AzureADGroup` | Yes (envs/bootstrap `apply_graph_roles`) |
| `AU-Workforce-Standard` and its scoped assignments | `AdministrativeUnit.ReadWrite.All` in addition to the above (APPLY); `AdministrativeUnit.Read.All` for PLAN (confirmed 2026-10-27: the plan lists AUs) | verify against `apply_graph_roles` before flipping `enable_helpdesk_au_scoping` |
| Global Administrator policy + eligibility | `RoleManagementPolicy.ReadWrite.Directory`, `RoleEligibilitySchedule.ReadWrite.Directory` | Not used: `Set-DirectoryRolePimPolicies.ps1` runs as a human |
| `PIM-AWS-Lab-Admins` and its PIM-for-Groups policy | same as the tier groups | Yes |
| `PIM-Demo-Readers`, its two directory role assignments and its PIM-for-Groups policy | same as the tier groups | Yes |
| `PIM-Demo-Readers`' Azure Reader / Microsoft Sentinel Reader / Log Analytics Reader on the subscription | `Microsoft.Authorization/roleAssignments/write` for those role ids (Owner / User Access Administrator) | **No.** Its RBAC Administrator grant is ABAC-limited to three delegable roles (`envs/bootstrap` `delegable_role_ids`), so the grants are in `envs/bootstrap` (`enable_pim_demo_readers_azure_rbac`), human-applied. Do not widen the delegable list |
| Azure eligible assignment + Azure PIM policy | `Microsoft.Authorization/roleEligibilityScheduleRequests/write`, `roleManagementPolicies/write` on the RG (Owner / User Access Administrator) | **No.** It holds Contributor plus an ABAC-limited RBAC Administrator (*verify:* RBAC Administrator lacks these actions). The first apply of `enable_pim_azure_resources` is a **human apply**. Do not hand CI Owner. |

## Post-apply

Eligibility (*who* may activate) is operational data that references
HR-provisioned people, so it is never set in Terraform.
`lab/scripts/powershell/post-apply/Set-PimGroupEligibility.ps1` grants it
per group, with expiry (180 days Tier 0, 365 days Tier 1), and warns when a
person it makes eligible is in the same tier's approver group. Group
nicknames come from output `tier_group_mail_nicknames`:

```powershell
./Set-PimGroupEligibility.ps1 -GroupMailNickname pim-tier0-ca-admins `
    -UserPrincipalNames 'adm-first.last@<tenant>.onmicrosoft.com' -WhatIf
./Set-PimGroupEligibility.ps1 -GroupMailNickname pim-tier1-helpdesk `
    -UserPrincipalNames 'adm-first.last@<tenant>.onmicrosoft.com'
```

`post-apply/Invoke-PostApply.ps1` runs it (`-PimEligibility`) after the
Global Administrator policy and before the access reviews, together with
`Set-AuthContextPolicies.ps1` (CA021 + `c1`), `Set-DirectoryRolePimPolicies.ps1`,
`New-RestrictedAdminUnit.ps1` and, last and opt-in,
`Convert-BuildAccountToEligible.ps1`
([`lab/scripts/powershell/README.md`](../../../scripts/powershell/README.md)).

For **AWS** (`aws.tf`), eligibility is granted like a tier group's, with the
Tier-0 duration the policy allows (the nickname is not `pim-tier0-*`, so pass
it explicitly):

```powershell
./Set-PimGroupEligibility.ps1 -GroupMailNickname pim-aws-lab-admins `
    -UserPrincipalNames 'adm-labops@<tenant>.onmicrosoft.com' -EligibilityDuration P180D
```

For the **read-only presenter** (`demo-readers.tf`), the admin account is the
sponsored `adm-presenter` row in `lab/iga/admin-accounts.json` (no HR owner).
The nickname is not `pim-tier0-*`, so the script requests the Tier-1 365 days
the policy allows; `Invoke-PostApply.ps1 -PimEligibility` accepts the group
once output `pim_demo_readers_group_mail_nickname` names it:

```powershell
./Set-PimGroupEligibility.ps1 -GroupMailNickname pim-demo-readers `
    -UserPrincipalNames 'adm-presenter@<tenant>.onmicrosoft.com'
```

For **Azure**, membership of `PIM-Azure-RG-Contributors` is ordinary (active)
membership. The *role* is what gets activated. The group is role-assignable,
so adding a member needs Privileged Role Administrator:
`POST https://graph.microsoft.com/v1.0/groups/<azure_pim_group_object_id>/members/$ref`
with `{"@odata.id":"https://graph.microsoft.com/v1.0/users/<id>"}`.

## TENANT-TIME steps (capture the evidence listed)

1. `enable_pim_tiers = true`, apply, then make one Tier-0 and one Tier-1
   person eligible. *Evidence:* activate both side by side. Tier 1 is granted
   immediately for 8h; Tier 0 waits for an approver-group member and is
   capped at 4h. Capture the audit log entries for each activation (the
   request, the approval, the member added by PIM) and output
   `tier_activation_policies`. Request to approval:
   `<measured: minutes>`.
2. **ITDR negative test:** as break-glass, add a member to a tier group
   *directly* (not through PIM), then remove them. The detection
   `pim-group-member-added-outside-pim` should fire on that audit event.
   For `PIM-Azure-RG-Contributors` a direct add is the intended path, so it
   takes the Medium `AzurePimEligibleMember` path instead of High.
3. `enable_global_admin_pim_policy = true`, then
   `Set-DirectoryRolePimPolicies.ps1 -WhatIf` and for real. *Evidence:* the
   role's policy rules read back from Graph, and one named eligibility with
   its end date.
4. `enable_pim_azure_resources = true` as a human Owner, then add one member.
   Activate through *PIM → My roles → Azure resources*. *Evidence:* the Azure
   Activity Log `roleAssignmentScheduleRequests` write, the approval, and the
   expiry 4h later.
5. **Remove the last standing human access.** Once steps 3 and 4 work,
   convert the build account's standing Global Administrator to eligible
   (`Convert-BuildAccountToEligible.ps1`) and the human's standing Owner on
   the subscription or RG to an eligible assignment. Standing privileged
   principals before / after: `<measured: count before>` /
   `<measured: count after>`.
6. **Turning features off:** the tier groups and role bindings are destroyed
   cleanly, but the Azure PIM policy settings stay (destroy is a no-op).

## verify: (open until the trial)

- PIM does not let a requester approve their own activation (PIM approval
  docs).
- A role-assignable group works as a `groupMembers` approver.
- The RBAC Administrator role has no `roleEligibilityScheduleRequests/write`
  or `roleManagementPolicies/write`.
- The subscription-scoped role definition id resolves the RG-scope policy on
  the first apply.
- An API-created review of a PIM-governed group expands **eligible** members
  the way a portal-created one does (`reviews.tf` header).
- A later provider update of the AU leaves its dynamic membership untouched.

## Offline tests

```bash
cd lab/terraform/modules/pim
terraform init -backend=false && terraform test   # HashiCorp Terraform 1.16.5
```

`tests/pim.tftest.hcl` (mock azuread + azurerm, **46 runs, all passing on
2026-11-05**) covers:

- every feature off: only the original binding exists;
- the tier map, per-tier activation strength, ticket, expiry and
  notifications; one approver warns; the mailbox must be an address;
- the `c1` context: refused before CA021 is enforced, replaces MFA on Tier 0
  only, the two-apply switchover, the Graph id range;
- guardrails: Tier 0 without approvers, Global Administrator as primary or
  additional role, a Tier-0 role in a Tier-1 group, Tier 0 waiving approval,
  AU scope on a role that cannot take it, overrides longer than the tier cap,
  Tier-0 eligibility over 180 days, Privileged-IAM-Admins holding Global
  Administrator or a Tier-0 role;
- help-desk AU scoping, and AU scoping without tiers warns and plans nothing;
- the Global Administrator rule bodies (with and without `c1`, approvers
  required);
- the PIM-eligible review bodies; none without a fallback reviewer; the
  reviewer group can never be a reviewed group;
- the read-only presenter group: off by default; exactly Global Reader +
  Security Reader, tenant-wide; PT8H, MFA + justification, no approval and no
  approval stage; 365-day eligibility; every activation mailed (a check warns
  without a mailbox); in the quarterly review but not in
  `privileged_review_targets` or `privileged_role_template_ids`; the tier map
  stays 16 groups; longer than PT8H or than the Tier-1 cap is refused;
- Azure PIM: Contributor role id form, RG scope, the *group* as principal,
  Tier-0 policy and approvers; a missing scope fails and Owner eligibility is
  rejected.

## Inputs, outputs and resources

The lists below are made by `terraform-docs`. Do not edit them by hand. Run [`tools/module-docs.sh`](../../tools/module-docs.sh).

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.6.0 |
| azuread | ~> 3.10 |
| azurerm | ~> 4.0 |

### Providers

| Name | Version |
| ---- | ------- |
| azuread | ~> 3.10 |
| azurerm | ~> 4.0 |

### Resources

| Name | Type |
| ---- | ---- |
| [azuread_administrative_unit.workforce_standard](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/administrative_unit) | resource |
| [azuread_directory_role_assignment.demo_readers](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/directory_role_assignment) | resource |
| [azuread_directory_role_assignment.pim_tier](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/directory_role_assignment) | resource |
| [azuread_directory_role_assignment.pim_tier_additional](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/directory_role_assignment) | resource |
| [azuread_directory_role_assignment.priv_admins](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/directory_role_assignment) | resource |
| [azuread_group.aws_admin](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.azure_pim](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.demo_readers](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.keyvault_pim](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.pim_approvers](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.pim_tier](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group_role_management_policy.aws_admin_member](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group_role_management_policy) | resource |
| [azuread_group_role_management_policy.demo_readers_member](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group_role_management_policy) | resource |
| [azuread_group_role_management_policy.member](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group_role_management_policy) | resource |
| [azuread_group_role_management_policy.pim_tier_member](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group_role_management_policy) | resource |
| [azurerm_pim_eligible_role_assignment.azure_pim](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/pim_eligible_role_assignment) | resource |
| [azurerm_pim_eligible_role_assignment.keyvault_pim](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/pim_eligible_role_assignment) | resource |
| [azurerm_role_management_policy.azure_pim](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_management_policy) | resource |
| [azurerm_role_management_policy.keyvault_pim](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_management_policy) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| priv\_iam\_admins\_group\_object\_id | Object id of the role-assignable Privileged-IAM-Admins group. The group is<br/>ACTIVELY assigned the target role, and its MEMBERSHIP is the just-in-time<br/>control governed by a PIM-for-Groups activation policy. | `string` | n/a | yes |
| activation\_auth\_context\_ca\_enforced | true only when the CA policy that targets the context (CA021) is<br/>ENFORCED in the tenant. Wire it from modules/conditional-access output<br/>pim\_activation\_auth\_context\_ready (declared "enabled" AND attested by<br/>ca021\_enforced\_in\_tenant); never hand-set it to true. Gates<br/>tier0\_activation\_auth\_context\_id and tier0\_auth\_context\_switchover\_step1. | `bool` | `false` | no |
| activation\_max\_duration | Maximum activation duration as an ISO-8601 duration. Contract asks for a<br/>4-hour cap => "PT4H". | `string` | `"PT4H"` | no |
| active\_assignment\_max\_duration | Longest an admin may DIRECTLY assign active membership (bypassing<br/>activation). Never permanent: every policy in this module sets<br/>expiration\_required = true on active assignments, plus justification and<br/>MFA for the admin making one. The provider accepts only the portal's<br/>fixed choices; P15D is the shortest. | `string` | `"P15D"` | no |
| approver\_object\_ids | User object ids placed in the in-module, role-assignable PIM-Approvers-Tier1<br/>group (approvers.tf). Every approval-gated Tier-1 policy (Privileged-IAM-<br/>Admins, and Tier-1 groups with require\_approval) routes to that GROUP<br/>(type "groupMembers"), never to single users. Also the Tier-0 approvers<br/>when tier0\_approver\_object\_ids is empty. Non-empty when require\_approval<br/>= true (precondition); at least two recommended (check) - Microsoft Learn:<br/>approvers cannot approve their own activation, so one approver who is<br/>also eligible blocks themselves. | `list(string)` | `[]` | no |
| aws\_admin\_activation\_max\_duration | How long one activation of PIM-AWS-Lab-Admins lasts. Default PT2H: long<br/>enough for one change and its check, short enough that nobody keeps AWS<br/>admin "for the day". Capped at PT4H. The AWS permission set's session<br/>(lab/terraform/aws, PT1H) must stay shorter than this. | `string` | `"PT2H"` | no |
| aws\_admin\_eligible\_assignment\_duration | How long an ELIGIBLE membership of PIM-AWS-Lab-Admins lives before renewal. Admin of the AWS management account is Tier 0 for AWS: 180 days at most. | `string` | `"P180D"` | no |
| aws\_admin\_group\_mail\_nickname | mail\_nickname (stable lookup key for scripts, e.g. Set-PimGroupEligibility.ps1 -GroupMailNickname) of the AWS admin PIM group. | `string` | `"pim-aws-lab-admins"` | no |
| aws\_admin\_group\_name | Display name of the AWS admin PIM group. lab/terraform/aws looks the SCIM-created copy up by this exact name (var.lab\_admin\_group\_display\_name there). | `string` | `"PIM-AWS-Lab-Admins"` | no |
| aws\_admin\_require\_approval | Require approval (PIM-Approvers-Tier0) to activate PIM-AWS-Lab-Admins.<br/>Default false while the lab has ONE human admin: PIM never lets a<br/>requester approve their own request, so approval would need a second<br/>person. Every activation is mailed to pim\_alert\_mailbox instead<br/>(ADR 0025). Turn on when a second admin exists. | `bool` | `false` | no |
| azure\_pim\_activation\_max\_duration | Azure activation cap. Tier-0 strength by default (the RG holds the DC): PT4H. | `string` | `"PT4H"` | no |
| azure\_pim\_group\_mail\_nickname | mail\_nickname (stable lookup key for scripts) of the Azure PIM group. | `string` | `"pim-azure-rg-contributors"` | no |
| azure\_pim\_group\_name | Display name of the group made eligible for the Azure role. | `string` | `"PIM-Azure-RG-Contributors"` | no |
| azure\_pim\_require\_approval | Require approval (PIM-Approvers-Tier0) to activate the Azure role (default true: Contributor over the DC's RG is Tier 0). | `bool` | `true` | no |
| azure\_pim\_role\_definition\_guid | Azure built-in role definition GUID made eligible. Default Contributor (b24988ac-..., Azure built-in roles reference). | `string` | `"b24988ac-6180-42a0-ab88-20f7382dd24c"` | no |
| azure\_pim\_scope\_id | Resource id of the lab resource group the eligible assignment and policy apply to (/subscriptions/<sub>/resourceGroups/<name>). | `string` | `""` | no |
| demo\_readers\_activation\_max\_duration | How long one activation of PIM-Demo-Readers lasts. Default PT8H: one<br/>working day of demo and rehearsal, the Tier-1 shift. Never longer than<br/>PT8H (validation) or tier1\_activation\_max\_duration (precondition). | `string` | `"PT8H"` | no |
| demo\_readers\_group\_mail\_nickname | mail\_nickname (stable lookup key: Set-PimGroupEligibility.ps1 -GroupMailNickname, admin-accounts.json eligibleFor) of the read-only presenter PIM group. | `string` | `"pim-demo-readers"` | no |
| demo\_readers\_group\_name | Display name of the read-only presenter PIM group. | `string` | `"PIM-Demo-Readers"` | no |
| directory\_scope\_id | Scope of the role assignment. "/" = tenant-wide (directory scope). | `string` | `"/"` | no |
| enable\_global\_admin\_pim\_policy | Render output directory\_role\_pim\_policies: the Graph rule bodies for the<br/>Global Administrator role's own PIM policy (activation: approval by<br/>PIM-Approvers-Tier0, MFA or the Tier-0 auth context, justification,<br/>ticket, global\_admin\_activation\_max\_duration; eligibility expires after<br/>global\_admin\_eligible\_duration; admin notifications). azuread 3.10 has no<br/>directory-role policy resource, so post-apply/Set-DirectoryRolePimPolicies.ps1<br/>PATCHes them and grants NAMED, expiring eligibility. Break-glass keeps<br/>its standing assignment (modules/groups). | `bool` | `false` | no |
| enable\_helpdesk\_au\_scoping | Create AU-Workforce-Standard and assign the roles of every au\_scoped tier<br/>group (default: PIM-Tier1-Helpdesk = Helpdesk + Authentication<br/>Administrator) at THAT scope instead of tenant-wide. Needs<br/>enable\_pim\_tiers. Licence: Entra ID P1 per AU administrator; a DYNAMIC<br/>AU rule needs P1 per member. | `bool` | `false` | no |
| enable\_pim\_aws\_admin | Create PIM-AWS-Lab-Admins: a role-assignable group whose ELIGIBLE-only<br/>membership is administrator of the lab AWS account (envs/dev assigns it<br/>to the AWS IAM Identity Center app; lab/terraform/aws gives the<br/>SCIM-created copy the LabAdministrator permission set). Activation: MFA +<br/>justification, aws\_admin\_activation\_max\_duration, mailed to<br/>pim\_alert\_mailbox. ADR 0025. | `bool` | `false` | no |
| enable\_pim\_azure\_resources | Make a role-assignable group ELIGIBLE for an Azure role (default<br/>Contributor) on the lab resource group, with an MFA + justification +<br/>approval activation policy (approvers: PIM-Approvers-Tier0). Needs<br/>azure\_pim\_scope\_id, Entra ID P2 for the eligible people, and Owner /<br/>User Access Administrator for whoever applies it (the CI APPLY identity<br/>lacks roleEligibilityScheduleRequests write - see README.md). | `bool` | `false` | no |
| enable\_pim\_demo\_readers | Create PIM-Demo-Readers: a role-assignable group that ACTIVELY holds<br/>Global Reader + Security Reader tenant-wide, whose membership is<br/>ELIGIBLE-only (MFA + justification, demo\_readers\_activation\_max\_duration,<br/>no approval, every activation mailed to pim\_alert\_mailbox; eligibility<br/>expires after tier1\_eligible\_assignment\_duration). Reviewed quarterly,<br/>NOT in privileged\_review\_targets (the CA002 / CA020 group scope). The<br/>group's Azure RBAC (Reader, Microsoft Sentinel Reader, Log Analytics<br/>Reader on the subscription) is granted by envs/bootstrap, human-applied. | `bool` | `false` | no |
| enable\_pim\_keyvault\_officers | Make a role-assignable group (PIM-KeyVault-Secrets-Officers) ELIGIBLE for<br/>Key Vault Secrets Officer on the lab vault, with an MFA + justification +<br/>approval activation policy (approvers: PIM-Approvers-Tier0). Needs<br/>keyvault\_pim\_scope\_id, Entra ID P2 for the eligible people, and Owner /<br/>User Access Administrator for whoever applies it. | `bool` | `false` | no |
| enable\_pim\_tiers | Create the PIM tier groups (role-assignable, each actively holding its<br/>directory role(s), membership eligible-only via PIM for Groups). Needs<br/>Entra ID P2 (M365 E5 trial). Tier 0 requires approvers<br/>(tier0\_approver\_object\_ids or approver\_object\_ids) or plan fails. | `bool` | `false` | no |
| global\_admin\_activation\_max\_duration | Global Administrator activation cap: 2h (privileged-access standard; the standard's Tier-0 cap is 4h, with 2h for Global Administrator and Privileged Authentication Administrator). Never longer than tier0\_activation\_max\_duration (precondition). | `string` | `"PT2H"` | no |
| global\_admin\_eligible\_duration | How long a named person's Global Administrator eligibility lives (Expiration\_Admin\_Eligibility; the eligibility request uses the same afterDuration). | `string` | `"P180D"` | no |
| keyvault\_pim\_activation\_max\_duration | Activation cap for Key Vault Secrets Officer. The vault holds Tier-0 secrets: PT2H by default, at most PT4H (the Tier-0 cap, ADR 0020). | `string` | `"PT2H"` | no |
| keyvault\_pim\_group\_mail\_nickname | mail\_nickname (stable lookup key for scripts) of the Key Vault PIM group. | `string` | `"pim-keyvault-secrets-officers"` | no |
| keyvault\_pim\_group\_name | Display name of the group made eligible for Key Vault Secrets Officer. | `string` | `"PIM-KeyVault-Secrets-Officers"` | no |
| keyvault\_pim\_require\_approval | Require approval (PIM-Approvers-Tier0) to activate Key Vault Secrets Officer (default true: the vault holds Tier-0 secrets). | `bool` | `true` | no |
| keyvault\_pim\_scope\_id | Resource id of the lab Key Vault (/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<name>). | `string` | `""` | no |
| pim\_alert\_mailbox | Security mailbox (one address) added to PIM's ADMIN notifications, as a<br/>second signal next to the KQL activation detections:<br/>  * Tier 0 and every approval-gated group: activation alert, eligible<br/>    assignment granted, direct active assignment (an activation bypass);<br/>  * other Tier-1 groups: the two assignment alerts (activation alerts only<br/>    with tier1\_activation\_notifications - a shift-length helpdesk role<br/>    would flood the mailbox and teach the SOC to ignore it).<br/>Empty (default) = notification rules are left at the tenant default. A<br/>real address is tenant data: terraform.tfvars / a CI secret, never<br/>lab.tfvars. Sensitive, like envs/dev alert\_email: the public plan<br/>comment shows "(sensitive value)", and output directory\_role\_pim\_policies<br/>(which carries it) is sensitive too. | `string` | `""` | no |
| pim\_tier\_groups | Tier groups keyed by a short stable id (the key is the Terraform address:<br/>never rename one). Enterprise Access Model: Tier 0 = control plane<br/>(can grant itself or others any access, or change how sign-in is<br/>protected), Tier 1 = management plane. Role template ids are identical in<br/>every tenant (Microsoft Entra built-in roles reference; checked<br/>2026-10-20).<br/><br/>NOT HERE, on purpose:<br/>  * Global Administrator - break-glass holds it standing (modules/groups);<br/>    named-person eligibility is direct and set by<br/>    post-apply/Set-DirectoryRolePimPolicies.ps1 (enable\_global\_admin\_pim\_policy).<br/>  * User Administrator - stays on Privileged-IAM-Admins (main.tf). | <pre>map(object({<br/>    display_name     = string<br/>    mail_nickname    = string<br/>    role_name        = string # documentation only; the template ids are what bind<br/>    role_template_id = string<br/>    tier             = number # 0 or 1 - selects the activation rules<br/>    # More roles held by the same group (one activation elevates to all).<br/>    additional_role_template_ids = optional(list(string), [])<br/>    # true = assign the roles at AU-Workforce-Standard scope when<br/>    # enable_helpdesk_au_scoping is on (tenant-wide otherwise). Only roles<br/>    # Microsoft allows at administrative-unit scope.<br/>    au_scoped = optional(bool, false)<br/>    # Tier 1 only (Tier 0 ALWAYS requires approval). null = no approval.<br/>    require_approval = optional(bool)<br/>    # Shorter activation cap than the tier's (never longer). null = tier cap.<br/>    activation_max_duration = optional(string)<br/>  }))</pre> | <pre>{<br/>  "tier0_application_admins": {<br/>    "display_name": "PIM-Tier0-Application-Admins",<br/>    "mail_nickname": "pim-tier0-application-admins",<br/>    "role_name": "Application Administrator",<br/>    "role_template_id": "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3",<br/>    "tier": 0<br/>  },<br/>  "tier0_auth_policy_admins": {<br/>    "display_name": "PIM-Tier0-Auth-Policy-Admins",<br/>    "mail_nickname": "pim-tier0-auth-policy-admins",<br/>    "role_name": "Authentication Policy Administrator",<br/>    "role_template_id": "0526716b-113d-4c15-b2c8-68e3c22b9f80",<br/>    "tier": 0<br/>  },<br/>  "tier0_ca_admins": {<br/>    "display_name": "PIM-Tier0-CA-Admins",<br/>    "mail_nickname": "pim-tier0-ca-admins",<br/>    "role_name": "Conditional Access Administrator",<br/>    "role_template_id": "b1be1c3e-b65d-4f19-8427-f6fa0d97feb9",<br/>    "tier": 0<br/>  },<br/>  "tier0_cloud_application_admins": {<br/>    "display_name": "PIM-Tier0-Cloud-Application-Admins",<br/>    "mail_nickname": "pim-tier0-cloud-application-admins",<br/>    "role_name": "Cloud Application Administrator",<br/>    "role_template_id": "158c047a-c907-4556-b7ef-446551a6b5f7",<br/>    "tier": 0<br/>  },<br/>  "tier0_hybrid_identity_admins": {<br/>    "display_name": "PIM-Tier0-Hybrid-Identity-Admins",<br/>    "mail_nickname": "pim-tier0-hybrid-identity-admins",<br/>    "role_name": "Hybrid Identity Administrator",<br/>    "role_template_id": "8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2",<br/>    "tier": 0<br/>  },<br/>  "tier0_privileged_auth_admins": {<br/>    "activation_max_duration": "PT2H",<br/>    "display_name": "PIM-Tier0-Privileged-Auth-Admins",<br/>    "mail_nickname": "pim-tier0-privileged-auth-admins",<br/>    "role_name": "Privileged Authentication Administrator",<br/>    "role_template_id": "7be44c8a-adaf-4e2a-84d6-ab2649e08a13",<br/>    "tier": 0<br/>  },<br/>  "tier0_privileged_role_admins": {<br/>    "display_name": "PIM-Tier0-Privileged-Role-Admins",<br/>    "mail_nickname": "pim-tier0-privileged-role-admins",<br/>    "role_name": "Privileged Role Administrator",<br/>    "role_template_id": "e8611ab8-c189-46e8-94e1-60213ab1f814",<br/>    "tier": 0<br/>  },<br/>  "tier0_security_admins": {<br/>    "display_name": "PIM-Tier0-Security-Admins",<br/>    "mail_nickname": "pim-tier0-security-admins",<br/>    "role_name": "Security Administrator",<br/>    "role_template_id": "194ae4cb-b126-40b2-bd5b-6091b380977d",<br/>    "tier": 0<br/>  },<br/>  "tier1_exchange_admins": {<br/>    "display_name": "PIM-Tier1-Exchange-Admins",<br/>    "mail_nickname": "pim-tier1-exchange-admins",<br/>    "role_name": "Exchange Administrator",<br/>    "role_template_id": "29232cdf-9323-42fd-ade2-1d097af3e4de",<br/>    "tier": 1<br/>  },<br/>  "tier1_groups_admins": {<br/>    "display_name": "PIM-Tier1-Groups-Admins",<br/>    "mail_nickname": "pim-tier1-groups-admins",<br/>    "role_name": "Groups Administrator",<br/>    "role_template_id": "fdd7a751-b60b-444a-984c-02652fe8fa1c",<br/>    "tier": 1<br/>  },<br/>  "tier1_helpdesk": {<br/>    "additional_role_template_ids": [<br/>      "c4e39bd9-1100-46d3-8c65-fb160da0071f"<br/>    ],<br/>    "au_scoped": true,<br/>    "display_name": "PIM-Tier1-Helpdesk",<br/>    "mail_nickname": "pim-tier1-helpdesk",<br/>    "role_name": "Helpdesk Administrator + Authentication Administrator (service desk)",<br/>    "role_template_id": "729827e3-9c14-49f7-bb1b-9608f156bbb8",<br/>    "tier": 1<br/>  },<br/>  "tier1_iga_admins": {<br/>    "additional_role_template_ids": [<br/>      "59d46f88-662b-457b-bceb-5c3809e5908f"<br/>    ],<br/>    "display_name": "PIM-Tier1-IGA-Admins",<br/>    "mail_nickname": "pim-tier1-iga-admins",<br/>    "require_approval": true,<br/>    "role_name": "Identity Governance Administrator + Lifecycle Workflows Administrator",<br/>    "role_template_id": "45d8d3c5-c802-45c6-b32a-1d70b5e1e86e",<br/>    "tier": 1<br/>  },<br/>  "tier1_intune_admins": {<br/>    "display_name": "PIM-Tier1-Intune-Admins",<br/>    "mail_nickname": "pim-tier1-intune-admins",<br/>    "require_approval": true,<br/>    "role_name": "Intune Administrator",<br/>    "role_template_id": "3a2c62db-5318-420d-8d74-23affee5d9d5",<br/>    "tier": 1<br/>  },<br/>  "tier1_license_admins": {<br/>    "display_name": "PIM-Tier1-License-Admins",<br/>    "mail_nickname": "pim-tier1-license-admins",<br/>    "role_name": "License Administrator",<br/>    "role_template_id": "4d6ac14f-3453-41d0-bef9-a3e0c569773a",<br/>    "tier": 1<br/>  },<br/>  "tier1_sharepoint_admins": {<br/>    "display_name": "PIM-Tier1-SharePoint-Admins",<br/>    "mail_nickname": "pim-tier1-sharepoint-admins",<br/>    "role_name": "SharePoint Administrator",<br/>    "role_template_id": "f28a1f50-f6e7-4571-818b-6a12f2af6b6c",<br/>    "tier": 1<br/>  },<br/>  "tier1_teams_admins": {<br/>    "display_name": "PIM-Tier1-Teams-Admins",<br/>    "mail_nickname": "pim-tier1-teams-admins",<br/>    "role_name": "Teams Administrator",<br/>    "role_template_id": "69091246-20e8-4a56-aa4d-066075b2a7a8",<br/>    "tier": 1<br/>  }<br/>}</pre> | no |
| privileged\_review\_fallback\_group\_object\_id | Mandatory fallback reviewer group (Learn: reviews of PIM-governed groups need one). Empty => output pim\_eligible\_review\_bodies is {} - default-deny without a fallback could revoke everything nobody answered. | `string` | `""` | no |
| privileged\_review\_instance\_duration\_days | Days each quarterly review instance stays open (ADR 0012, T1: 14). | `number` | `14` | no |
| privileged\_review\_reviewer\_group\_object\_id | Governance group that reviews PIM-eligible + active membership (never one of the reviewed groups). Empty => privileged\_review\_fallback\_group\_object\_id. | `string` | `""` | no |
| privileged\_review\_start\_date | YYYY-MM-DD for recurrence.range.startDate. Empty => null (the post-apply script uses today's UTC date; timestamp() would change the output on every plan). | `string` | `""` | no |
| require\_approval | Require approver sign-off before a Privileged-IAM-Admins activation succeeds (approvers: the PIM-Approvers-Tier1 group). | `bool` | `true` | no |
| require\_justification | Require the activating user to type a justification. | `bool` | `true` | no |
| require\_mfa\_on\_activation | Require MFA at the moment of a Privileged-IAM-Admins activation. (Tier-0<br/>groups use tier0\_activation\_auth\_context\_id instead once CA021 is<br/>enforced; the provider declares the two arguments ConflictsWith.) | `bool` | `true` | no |
| role\_template\_id | Directory role TEMPLATE id Privileged-IAM-Admins holds ACTIVELY. Default<br/>"User Administrator" (a Tier-1 admin). The group gets TIER-1 activation<br/>rules (365-day eligibility, Tier-1 approvers, MFA - never the Tier-0<br/>auth context), and privileged\_role\_template\_ids classifies this role as<br/>tier1, so Global Administrator and the Tier-0 (control-plane) roles are<br/>refused here: bind those through a tier = 0 pim\_tier\_groups entry. | `string` | `"fe930be7-5e62-47db-91af-98c3a49a38b1"` | no |
| tier0\_activation\_auth\_context\_id | Conditional Access authentication context id (e.g. "c1") that a Tier-0<br/>activation must satisfy INSTEAD of the plain MFA flag: CA021<br/>(modules/conditional-access, written by post-apply/Set-AuthContextPolicies.ps1)<br/>requires the admin phishing-resistant strength with sign-in frequency<br/>"every time" - no compliant-device grant until PAWs exist. Applies to<br/>every tier = 0 group and to Global Administrator<br/>(directory\_role\_pim\_policies). Empty (default) = plain MFA.<br/><br/>KEEP IT EMPTY until CA021 is ENFORCED IN THE TENANT. Learn, PIM for<br/>Groups role settings (learn.microsoft.com/entra/id-governance/<br/>privileged-identity-management/groups-role-settings): create and enable<br/>the CA policy before PIM requires the context; the MFA backup "isn't<br/>triggered if the Conditional Access policy is turned off, is in<br/>report-only mode, or has an eligible user excluded" - so a context<br/>behind a report-only CA021 means NO step-up. A precondition refuses a<br/>non-empty value unless activation\_auth\_context\_ca\_enforced = true, which<br/>modules/conditional-access sets only when CA021 is declared enabled AND<br/>attested in the tenant (ca021\_enforced\_in\_tenant).<br/><br/>SWITCHING AN EXISTING TIER-0 POLICY FROM MFA TO THE CONTEXT = TWO APPLIES<br/>(azuread 3.10.0 source: both activation arguments are Optional+Computed,<br/>so leaving one null keeps its PRIOR state value and the Enablement rule<br/>is never re-sent - Graph would keep MultiFactorAuthentication and may<br/>reject the change; the reverse switch leaves c1 enabled):<br/>  Apply 1: tier0\_auth\_context\_switchover\_step1 = true, this variable<br/>           still "" -> Tier 0 sends require\_multifactor\_authentication<br/>           = false. Tier-0 activation now needs approval + justification<br/>           (+ ticket) but NO step-up: run apply 2 straight after, with<br/>           no Tier-0 activation pending (approvers deny any that arrive).<br/>  Apply 2: this variable = "c1" -> the context replaces MFA (MFA is then<br/>           null/unset, as the provider's ConflictsWith requires).<br/>Back to MFA: set "" and switchover false in one apply. Per the provider<br/>source above, that apply sends MFA but leaves the context rule ENABLED<br/>(Optional+Computed keeps the prior value), so activation stays on the<br/>context - stricter, not weaker - until you switch the<br/>AuthenticationContext\_EndUser\_Assignment rule off through Graph or the<br/>portal (verify: on the first tenant run whether Graph then needs both).<br/>A brand-new policy (first apply) can take "c1" directly. | `string` | `""` | no |
| tier0\_activation\_max\_duration | Tier-0 activation cap (contract: 4 hours). Provider accepts PT30M..PT23H30M in 30-minute steps, or P1D. A group may only shorten it (activation\_max\_duration). | `string` | `"PT4H"` | no |
| tier0\_approver\_object\_ids | User object ids placed in the in-module, role-assignable PIM-Approvers-Tier0<br/>group, which approves every Tier-0 activation (tier groups, Azure<br/>Contributor on the lab RG, Global Administrator via<br/>Set-DirectoryRolePimPolicies.ps1). Empty => approver\_object\_ids. Keep<br/>disjoint from the people made eligible (Set-PimGroupEligibility.ps1 warns). | `list(string)` | `[]` | no |
| tier0\_auth\_context\_switchover\_step1 | Apply 1 of the two-apply MFA -> auth-context switch (see tier0\_activation\_auth\_context\_id). Requires activation\_auth\_context\_ca\_enforced. A check warns while it leaves Tier 0 without a step-up. | `bool` | `false` | no |
| tier0\_eligible\_assignment\_duration | How long a Tier-0 ELIGIBLE assignment lives before it must be renewed<br/>(re-requested and re-approved). Privileged-access standard: <= 365 days,<br/>renewed through review; Tier 0 is held to 180. P365D is refused here. | `string` | `"P180D"` | no |
| tier0\_require\_ticket\_info | Tier-0 activation (and Global Administrator) requires ticket information next to the justification (privileged-access standard section 2: ticket reference for Tier 0). | `bool` | `true` | no |
| tier1\_activation\_max\_duration | Tier-1 activation cap (contract: 8 hours, one shift). | `string` | `"PT8H"` | no |
| tier1\_activation\_notifications | Also mail the security mailbox on every activation of Tier-1 groups that need no approval (default false: high volume, covered by the KQL detection). | `bool` | `false` | no |
| tier1\_eligible\_assignment\_duration | How long a Tier-1 ELIGIBLE assignment (and Privileged-IAM-Admins) lives before renewal. Standard: <= 365 days. | `string` | `"P365D"` | no |
| workforce\_au\_display\_name | Display name of the help-desk scope administrative unit. | `string` | `"AU-Workforce-Standard"` | no |
| workforce\_au\_excluded\_employee\_ids | HR employee ids (employeeId) kept OUT of AU-Workforce-Standard: the VIPs<br/>that post-apply/New-RestrictedAdminUnit.ps1 puts in the restricted<br/>management AU (RMAU-VIP). Rendered in output workforce\_au\_membership\_body<br/>as (<workforce\_au\_membership\_rule>) -and (user.employeeId -notIn [...]).<br/>WHY BOTH: the RMAU alone already stops the help desk (an RMAU member can<br/>be changed only by roles scoped to THAT RMAU - Learn, "Restricted<br/>management administrative units", Who can modify objects), but leaving a<br/>VIP in the help desk's own AU makes its member list say the opposite of<br/>the design and would hand the VIP straight back to the help desk if the<br/>RMAU were ever deleted. Keyed on employeeId (HR's key, written by the<br/>inbound provisioning path) rather than UPN, so no tenant domain sits in<br/>a tfvars file. Default empty = rule unchanged. | `list(string)` | `[]` | no |
| workforce\_au\_membership\_rule | Dynamic membership rule rendered into output workforce\_au\_membership\_body<br/>(the provider has no membershipType/membershipRule; applying it is a<br/>Graph PATCH, a TENANT-TIME step). Default: HR-provisioned members only<br/>(an employeeId), never an adm- admin account. Break-glass and service<br/>accounts carry no employeeId. verify: employeeId is populated by the<br/>inbound provisioning + Cloud Sync path; -notStartsWith is accepted in AU<br/>rules. | `string` | `"(user.userType -eq \"Member\") -and (user.employeeId -ne null) -and (user.userPrincipalName -notStartsWith \"adm-\")"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| approver\_group\_mail\_nicknames | PIM approver groups by tier => mail\_nickname (Set-PimGroupEligibility.ps1 / Set-DirectoryRolePimPolicies.ps1 warn when an eligible person is also an approver). |
| approver\_group\_object\_ids | PIM approver groups by tier (tier0 / tier1 => object id; a tier is absent when nothing routes approvals to it). Members are approver\_object\_ids / tier0\_approver\_object\_ids. |
| aws\_admin\_activation\_policy | Evidence summary of the PIM-AWS-Lab-Admins activation policy (null unless enable\_pim\_aws\_admin). |
| aws\_admin\_group\_mail\_nickname | mail\_nickname of PIM-AWS-Lab-Admins for Set-PimGroupEligibility.ps1 -GroupMailNickname (null unless enable\_pim\_aws\_admin). |
| aws\_admin\_group\_object\_id | Object id of PIM-AWS-Lab-Admins (null unless enable\_pim\_aws\_admin). envs/dev assigns it to the AWS IAM Identity Center app; lab/terraform/aws can pin the SCIM copy to it (lab\_admin\_entra\_group\_object\_id). |
| azure\_pim\_eligible\_assignment\_id | Terraform id ({scope}\|{roleDefinitionId}\|{principalId}) of the Azure PIM eligible assignment, or null. |
| azure\_pim\_group\_object\_id | Group eligible for the Azure role on the lab RG (add members post-apply), or null. |
| azure\_role\_management\_policy\_id | Id of the Azure PIM activation policy for the role at the RG scope, or null. |
| demo\_readers\_activation\_policy | Evidence summary of the PIM-Demo-Readers activation policy and the directory roles the group holds (null unless enable\_pim\_demo\_readers). |
| demo\_readers\_group\_mail\_nickname | mail\_nickname of PIM-Demo-Readers for Set-PimGroupEligibility.ps1 -GroupMailNickname (null unless enable\_pim\_demo\_readers). |
| demo\_readers\_group\_object\_id | Object id of PIM-Demo-Readers (null unless enable\_pim\_demo\_readers). envs/bootstrap pim\_demo\_readers\_group\_object\_id takes it for the subscription-scope Azure read roles (human-applied). |
| directory\_role\_pim\_policies | Role template id => JSON (rule bodies + eligibility duration) for post-apply/Set-DirectoryRolePimPolicies.ps1 -PolicyPath. {} unless enable\_global\_admin\_pim\_policy. Sensitive: the notification rules carry pim\_alert\_mailbox (terraform output -json still prints it for the script). |
| group\_role\_management\_policy\_id | Id of the PIM-for-Groups member activation policy. |
| keyvault\_pim\_eligible\_assignment\_id | Terraform id ({scope}\|{roleDefinitionId}\|{principalId}) of the Key Vault PIM eligible assignment, or null. |
| keyvault\_pim\_group\_object\_id | Group eligible for Key Vault Secrets Officer on the lab vault (add members post-apply), or null. |
| pim\_eligible\_review\_bodies | "privileged:<name>" => Graph v1.0 accessReviewScheduleDefinition JSON for<br/>every PIM-governed group (eligible + active members) and, with<br/>enable\_global\_admin\_pim\_policy, ELIGIBLE Global Administrator users<br/>(break-glass excluded by design). Same shape/keys as modules/entitlement<br/>access\_review\_definitions: post-apply/New-AccessReviewDefinitions.ps1<br/>POSTs them (matched by displayName, so a group rendered by both modules<br/>yields one series). {} while privileged\_review\_fallback\_group\_object\_id<br/>is empty. verify: API-created PIM-group reviews include eligible members. |
| privileged\_review\_targets | Display name => object id of every PIM-governed group (Privileged-IAM-Admins, tier groups, Azure PIM group): the privileged access review, and CA002/CA020 included\_groups. |
| privileged\_role\_template\_ids | Directory role template ids governed by this module, by tier (tier0<br/>includes Global Administrator; tier1 includes Privileged-IAM-Admins' role).<br/>Built from the variables, so it is known at plan even with tiers off:<br/>feed modules/conditional-access admin\_session\_role\_template\_ids (CA020)<br/>so CA020's role list and the PIM tier map cannot drift apart. NOT CA002:<br/>CA002 keeps its own admin\_role\_template\_ids, whose validation requires<br/>Microsoft's template list (incl. Billing / Password Administrator, which<br/>no tier group holds). |
| role\_assignment\_id | Id of the active role assignment binding Privileged-IAM-Admins to the target role. |
| tier\_activation\_policies | Effective PIM rules per tier group, for the evidence pack and the on-camera tier walkthrough ({} when disabled). |
| tier\_group\_mail\_nicknames | Map of tier group display name => mail\_nickname (the -GroupMailNickname for Set-PimGroupEligibility.ps1). |
| tier\_group\_object\_ids | Map of tier group display name => object id ({} while enable\_pim\_tiers = false). Run post-apply/Set-PimGroupEligibility.ps1 per group. |
| workforce\_au\_membership\_body | TENANT-TIME Graph body that turns AU-Workforce-Standard into a dynamic AU: PATCH https://graph.microsoft.com/v1.0/directory/administrativeUnits/<workforce\_au\_object\_id> (AdministrativeUnit.ReadWrite.All). null when the AU is off. |
| workforce\_au\_object\_id | Object id of AU-Workforce-Standard (the service desk's role scope), or null. |
<!-- END_TF_DOCS -->
