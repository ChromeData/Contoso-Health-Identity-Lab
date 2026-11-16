# modules/entitlement

Entra ID Governance for Contoso Health: who may **request** access, who
**approves** it, when it **expires**, and who **re-certifies** it. Decisions:
[ADR 0008](../../../docs/adr/0008-iga-entra-id-governance-midpoint-vs-sailpoint-saviynt.md)
and [ADR 0012](../../../docs/adr/0012-access-review-no-response-and-clinical-lockout.md)
(risk-tiered certification; birthright clinical access is never removed on
silence).

**Status: BUILT.** `validate` and 26 mocked `terraform test` runs pass
(HashiCorp Terraform 1.16.5, 2026-10-20). **Nothing has been applied: no
tenant exists yet.** Every step marked **TENANT-TIME** needs the Entra ID
Governance trial, and every claim marked *verify:* is checked during that
window.

| File | Flag in `envs/dev` (default) | What it builds |
|------|------------------------------|----------------|
| `main.tf` | `enable_governance` (false) | Internal catalog "Clinical" and the packages in `var.access_packages`, matching `lab/iga/access-catalog.json`: **T3 birthright** "Nurse - Clinical Apps" and "ICU - Critical Care Apps" (no Terraform policy: their only policy is the HR-attribute automatic assignment that `post-apply/Set-AutoAssignmentPolicies.ps1` creates), **T2 requestable** "ICU - Float Access" and "Pharmacy - Controlled Substances Apps" (approval, justification, 180-day expiry) |
| `main.tf` | `enable_access_reviews_privileged` (false) | ADR 0012 **T1**: a quarterly policy review on any T1 package, governance group reviews, unanswered = removed |
| `main.tf` | `enable_access_reviews_requestable` (false) | ADR 0012 **T2**: a half-yearly `removeAccess` policy review, **only** on a requestable package that lives longer than 180 days or allows extension (a plain 180-day package is certified by its expiry and re-approval) |
| — | (no flag) | ADR 0012 **T3**: a birthright clinical package is never reviewed by a person. HR attributes certify it, so a silent reviewer can never lock a nurse out |
| `reviews.tf` | `enable_access_reviews_privileged` / `enable_access_reviews_inactive` (false) | **Rendered only** (output `access_review_definitions`): the quarterly **privileged** reviews (eligible + active members of every PIM-governed group, merged with `modules/pim`'s bodies) and the **inactive-user** review, created by `post-apply/New-AccessReviewDefinitions.ps1` |
| `b2b.tf` | `enable_b2b_governance` (false) | Externally visible catalog "Affiliated Partners" and the **"Affiliated Physicians"** package: connected-org requestors, sponsor approval, 90-day expiry, monthly sponsor review |

`enable_access_reviews` is kept only as a deprecated alias for the three
tier flags; it still never reviews a birthright package.

## Design decisions

- **Deny by default.** Every review this module defines removes access
  nobody vouches for: `removeAccess` on the package policies, and
  `defaultDecision = Deny` with `autoApplyDecisionsEnabled = true` on the
  standalone reviews. The fallback reviewer group is mandatory, and a
  precondition fails the plan or apply without it. A review with no one able
  to answer would otherwise revoke everything.
- **Privileged access is reviewed by a governance group**, never by the
  admins themselves. The output precondition rejects a reviewer group that
  is also a reviewed group. The reviewers are not the group owners either:
  PIM-for-Groups reviews resolve only *active* owners, and these groups have
  none at rest.
- **The inactive-user review targets groups that no access package owns**
  (default wiring: `App-Okta-Federation-Users`). If a review removes a member
  from a package-granted group, entitlement management is bypassed and the
  package assignment is left orphaned. Package groups are already covered by
  the policy review's sign-in recommendation (deny if no sign-in for 30 days).
- **Only one catalog is externally visible.** Clinical packages, including
  controlled-substance dispensing, can never be requested by a guest, and
  "enabled for external users" is decided in one place.
- **No hand-made guest invitations.** Guests arrive only through a request
  from a *configured* connected organization, never a `proposed` one (the
  service auto-creates those when a stranger requests a package). A guest is
  approved by a sponsor, holds access for at most 90 days, and is reviewed
  monthly. With the lifecycle setting below, the guest is blocked and then
  deleted when their last assignment ends.

## Day one: which mechanism delivers the birthright package (measured 2026-11-07)

This section is about **the Nursing package (`Nurse - Clinical Apps`) only**. For that package the
joiner Lifecycle Workflow delivers day-one access, not the automatic
assignment policy. In the first HR-form hire (capture log E121, E121b) the
user joined the policy's dynamic group at +4:36, the policy had created no
assignment by +25 min, and the workflow's request task assigned the package
at 01:11:01Z (audit, initiated by Lifecycle Workflows). That workflow runs
on the tenant's 3-hour schedule, so Nursing day-one delivery takes up to
about 3 hours.

The standard installer (`post-apply/New-LifecycleWorkflows.ps1`, called by
`Invoke-PostApply.ps1`) creates ONE joiner: department `Nursing`, package
`Nurse - Clinical Apps`. It creates no ICU joiner. So an ICU hire gets
`ICU - Critical Care Apps` only from the automatic assignment policy, with
no measured day-one time, unless you install a second joiner
(`-JoinerWorkflowName`, `-JoinerDepartment ICU`, `-AccessPackageName`).
The 3-hour figure does not apply to ICU.

For every birthright package the automatic policy keeps access in line with
HR attributes afterwards (movers, and removal after its 3-day grace).
Details: `lab/scripts/mock-hr/README.md`, "Three gaps from the first HR-form
run".

## Provider gaps, and how they are closed

The azuread provider 3.10 schema was checked on 2026-10-20 and has **no**
resource for:

| Graph object | Closed by |
|--------------|-----------|
| `incompatibleAccessPackages` / `incompatibleGroups` (SoD) | `lab/iga/sod-rules.json` → `post-apply/Set-IncompatibleAccessPackages.ps1` (links only on requestable packages; `Set-AccessPackageSoD.ps1` is now a forwarding shim) |
| automatic assignment policy (birthright) | `lab/iga/birthright-rules.json` → `post-apply/Set-AutoAssignmentPolicies.ps1` |
| `accessReviewScheduleDefinition` (standalone reviews) | output `access_review_definitions` → **`post-apply/New-AccessReviewDefinitions.ps1`** (spec below) |
| `connectedOrganization` + its sponsors | output `b2b_post_apply` → **`post-apply/New-B2BConnectedOrganization.ps1`** (spec below) |
| `entitlementManagementSettings` (external-user lifecycle) | output `b2b_post_apply.entitlement_settings_body` → same script |

Terraform renders the exact request bodies from real object ids, so the
definition stays code-reviewed here and only the HTTP call happens outside
Terraform.

## Post-apply scripts (BUILT, Pester-tested with Graph mocked)

Both follow the house style of `post-apply/Set-PimGroupEligibility.ps1`
(`SupportsShouldProcess`, a required-scopes check, `[+]` / `[=]` output,
`exit 1` on any failure) and are run in order by
`post-apply/Invoke-PostApply.ps1` (steps 12 and 13).

| | `New-AccessReviewDefinitions.ps1` | `New-B2BConnectedOrganization.ps1` |
|---|---|---|
| Input | `-DefinitionsPath`: `terraform -chdir=lab/terraform/envs/dev output -json access_review_definitions > reviews.json` (a map of key → JSON string) | `-PostApplyPath`: `terraform output -json b2b_post_apply` |
| Scopes | `AccessReview.ReadWrite.All`, `Group.Read.All`, `PrivilegedEligibilitySchedule.Read.AzureADGroup` (+ `RoleEligibilitySchedule.Read.Directory` for the Global Administrator review). Role: Identity Governance Administrator; PIM-for-Groups reviews need GA, Identity Governance Administrator or Privileged Role Administrator | `EntitlementManagement.ReadWrite.All`, `GroupMember.Read.All`. Role: Identity Governance Administrator |
| Idempotency | An existing definition with the same `displayName` is skipped (`[=]`), never edited; settings drift is reported (`-FailOnDrift` makes it an error) | An existing connected org is reused; `proposed` is promoted to `configured`; an existing sponsor is not re-added |
| Guards | Refuses a body whose silence does not mean Deny; self-review guard: warns about anyone both eligible and a reviewer | The tenant-wide lifecycle `PATCH` is `ConfirmImpact = 'High'` and prints the current values first; `-SkipTenantSettings` skips it |
| Evidence | `lab/evidence/access-reviews/definitions-<yyyyMMdd>.json` + `.sha256` (public-safe); full record with ids to the gitignored `lab/evidence/out/access-reviews/` | Prints the connected org id (for `b2b_connected_organization_id`) and the My Access link |
| `-WhatIf` | Prints each body, no write | No write |

## TENANT-TIME steps (in order; capture the evidence listed)

1. **Reviews**: apply the tier flags one PR at a time (`enable_access_reviews_privileged`, then `_requestable`, then `_inactive`). For the trial, set
   `access_review_start_date` to today and `access_review_duration_days` to
   about 3 so an instance closes inside the trial. Run
   `New-AccessReviewDefinitions.ps1 -WhatIf`, then run it for real.
   *Evidence:* the Graph GET of each policy's `reviewSettings` (see `main.tf`,
   including the open *verify:* about the fallback reviewer under
   `reviewerType = Manager`), the created definition ids, one completed
   privileged review in which an **eligible** member is denied and their
   eligibility disappears, and one instance closing with no response that
   removes access.
2. **Inactive review**: the scope only contains users inactive for 90 days
   who were *created* more than 90 days ago, so a fresh trial tenant shows an
   empty review. *Evidence:* the definition and an empty instance, plus a
   statement that the logic is proven by configuration. Do **not** fake sign-in
   dates.
3. **B2B**: apply `enable_b2b_governance = true`, add real people to
   `B2B-Sponsors-MedicalStaffOffice`, then run
   `New-B2BConnectedOrganization.ps1`. Set `b2b_connected_organization` to a
   domain you control, or to a second free Entra tenant (`tenant_id`). Request
   the package as an identity from that organization, approve it as a sponsor,
   then trigger the monthly review.
   *Evidence:* the request, the approval with justification, the guest user
   created by entitlement management, the assignment expiry date (90 days),
   and the review decision.
4. **Off-switch caveat**: turning a review flag off does not remove the
   policy reviews, because the provider suppresses the diff. Turn them off in
   the portal (`lab/terraform/README.md`, human step 12). Standalone reviews are deleted
   in the portal.

## verify: (open until the trial)

- Policy-attached reviews apply decisions themselves when an instance closes.
  Learn does not state this explicitly on the access-package review page.
- Under `reviewerType = Manager`, the fallback group survives; and a *group*
  is accepted as a fallback reviewer (both noted in `main.tf`).
- A Graph-created "Teams + Groups" review of a PIM-governed group includes
  **eligible** members. Learn documents this for the portal flow; the
  feature is still labelled preview.
- PIM-for-Groups reviews and inactive-user reviews need Entra ID Governance
  (licensing-fundamentals page).
- `descriptionForAdmins` / `descriptionForReviewers` length limits. The
  rendered strings are under 256 characters.
- A group is accepted as a connected organization's internal sponsor.
- The accepted range of `durationUntilExternalUserDeletedAfterBlocked`, and
  whether deleting a package that still has assignments is refused.
- B2B monthly-active-user billing (free tier size, and the subscription
  linking it needs).

## Offline tests

```bash
cd lab/terraform/modules/entitlement
terraform init -backend=false && terraform test   # HashiCorp Terraform 1.16.5
```

`tests/governance.tftest.hcl` (mock azuread, **26 runs, all passing on
2026-10-20**) covers:

- defaults create nothing new and match `lab/iga/access-catalog.json`;
  birthright packages have no policy and no expiry;
- the ADR 0012 tiers: T1 never reviews clinical packages, T2 reviews only
  long or extendable packages, a T1 package is reviewed quarterly by the
  governance group, the inactive flag is independent, the deprecated alias
  spares birthright, the privileged cadence cannot be relaxed;
- rendered bodies deny by default; a PIM body replaces the same-key group
  review; duplicate display names refused; PIM bodies need the T1 flag; a
  body that keeps access on silence is refused;
- failures: no fallback reviewer, a privileged reviewer reviewing itself,
  break-glass as a review target (by name or id), a requested birthright
  package, an expiring automatic package, an automatic privileged package, an
  extension without approval, an SoD pair of two birthright packages;
- the B2B package (external catalog, configured-orgs scope, sponsor approval,
  90-day expiry, monthly `removeAccess` review), the specific-org two-stage
  variant, and rejection of guest access longer than 180 days.

## Inputs, outputs and resources

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
| [azuread_access_package.b2b](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package) | resource |
| [azuread_access_package.this](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package) | resource |
| [azuread_access_package_assignment_policy.b2b](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_assignment_policy) | resource |
| [azuread_access_package_assignment_policy.this](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_assignment_policy) | resource |
| [azuread_access_package_catalog.b2b](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_catalog) | resource |
| [azuread_access_package_catalog.clinical](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_catalog) | resource |
| [azuread_access_package_resource_catalog_association.b2b](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_resource_catalog_association) | resource |
| [azuread_access_package_resource_catalog_association.groups](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_resource_catalog_association) | resource |
| [azuread_access_package_resource_package_association.b2b](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_resource_package_association) | resource |
| [azuread_access_package_resource_package_association.groups](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_resource_package_association) | resource |
| [azuread_group.b2b_access](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.b2b_sponsors](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| catalog\_group\_object\_ids | Map of group key => object id of the ASSIGNED groups packages may grant<br/>(servicenow/aws/okta/icu\_critical\_care/pharmacy\_dispensing). Dynamic groups<br/>must not appear here - entitlement management cannot grant them. | `map(string)` | n/a | yes |
| access\_packages | Access packages in the Clinical catalog, keyed by a short stable id. Each<br/>carries its ADR 0012 tier and assignment model. The defaults mirror<br/>lab/iga/access-catalog.json (tests/governance.tftest.hcl checks that):<br/>  nurse     T3 automatic  birthright for nursing staff<br/>  icu       T3 automatic  birthright for ICU staff (the mover target)<br/>  icu\_float T2 request    ICU apps for float / agency nurses: the<br/>                          requestable side, so SoD links can sit on it<br/>  pharmacy  T2 request    controlled-substance dispensing | <pre>map(object({<br/>    display_name = string<br/>    description  = string<br/>    group_keys   = list(string) # keys into catalog_group_object_ids<br/>    # ADR 0012 tier: T1 privileged, T2 requestable, T3 birthright clinical.<br/>    tier = string<br/>    # How people get it:<br/>    #   automatic - HR attributes, through the automatic assignment policy that<br/>    #               post-apply/Set-AutoAssignmentPolicies.ps1 creates from<br/>    #               lab/iga/birthright-rules.json. Terraform creates NO policy<br/>    #               for it: no request path, no expiry, no review (T3 only).<br/>    #   request   - a person asks and an approver grants; Terraform creates the<br/>    #               assignment policy with an expiry (T1 / T2 only).<br/>    assignment = string<br/>    # request only: lifetime in days (null = assignment_duration_days).<br/>    duration_in_days = optional(number)<br/>    # request only: allow "extend" before expiry. An extension always goes<br/>    # through the same approval again (approval_required_for_extension), and a<br/>    # T2 package that allows it gets a half-yearly policy review (ADR 0012).<br/>    extension_enabled = optional(bool, false)<br/>  }))</pre> | <pre>{<br/>  "icu": {<br/>    "assignment": "automatic",<br/>    "description": "Critical-care apps for ICU staff. Assigned automatically from your HR department and job title; float and agency nurses request ICU - Float Access instead.",<br/>    "display_name": "ICU - Critical Care Apps",<br/>    "group_keys": [<br/>      "servicenow",<br/>      "icu_critical_care"<br/>    ],<br/>    "tier": "T3"<br/>  },<br/>  "icu_float": {<br/>    "assignment": "request",<br/>    "description": "ICU critical-care apps for float and agency nurses covering ICU shifts. Manager approval; expires after 180 days (request again to keep it). Cannot be held with Pharmacy - Controlled Substances Apps.",<br/>    "display_name": "ICU - Float Access",<br/>    "group_keys": [<br/>      "servicenow",<br/>      "icu_critical_care"<br/>    ],<br/>    "tier": "T2"<br/>  },<br/>  "nurse": {<br/>    "assignment": "automatic",<br/>    "description": "Clinical apps for nursing staff (ServiceNow + AWS). Assigned automatically from your HR department and job title; nothing to request.",<br/>    "display_name": "Nurse - Clinical Apps",<br/>    "group_keys": [<br/>      "servicenow",<br/>      "aws"<br/>    ],<br/>    "tier": "T3"<br/>  },<br/>  "pharmacy": {<br/>    "assignment": "request",<br/>    "description": "Controlled-substance dispensing. SoD: must NOT be held with Nurse - Clinical Apps.",<br/>    "display_name": "Pharmacy - Controlled Substances Apps",<br/>    "group_keys": [<br/>      "pharmacy_dispensing"<br/>    ],<br/>    "tier": "T2"<br/>  }<br/>}</pre> | no |
| access\_review\_duration\_days | Days each review instance stays open for decisions. Must be shorter than<br/>the recurrence interval (checked by a precondition in main.tf, e.g. < 90<br/>for quarterly). 14 gives managers two working weeks. | `number` | `14` | no |
| access\_review\_fallback\_group\_object\_id | Object id of the group whose members review when a user has no manager in<br/>the directory (the portal makes a fallback MANDATORY for manager reviews),<br/>and the fallback reviewer of every standalone review. Empty => falls back<br/>to approver\_group\_object\_id. If both are empty while any review flag is on,<br/>plan fails with a precondition error rather than creating reviews nobody<br/>can complete.<br/><br/>No-response behaviour is not an input any more: ADR 0012 fixes it per<br/>tier. T1 and T2 = removeAccess (removed when nobody answers); T3 is never<br/>in a review, so silence can never remove birthright access. (The old<br/>access\_review\_no\_response\_action variable allowed keepAccess on privileged<br/>access, which ADR 0012 option 2 rejects.) | `string` | `""` | no |
| access\_review\_frequency | How often T1 (privileged) PACKAGE policy reviews recur (ADR 0012: quarterly). Never less often than quarterly. T2 uses requestable\_review\_frequency; T3 is never reviewed by a person. | `string` | `"quarterly"` | no |
| access\_review\_reviewer\_type | T2 package reviews only (T1 package reviews always use the privileged<br/>reviewer group, review\_type Reviewers - never the requestor's manager).<br/>How "the user's manager reviews, with a fallback" is expressed to the<br/>provider. azuread 3.10 maps this block to the Graph BETA<br/>assignmentReviewSettings shape, which has a reviewerType but no explicit<br/>fallbackReviewers field (that only exists in the v1.0 reviewSettings shape).<br/>  Manager   (default) reviewerType = Manager; the fallback group is sent as<br/>            a reviewer with backup = true.<br/>  Reviewers reviewerType = Reviewers; reviewers = requestorManager<br/>            (primary) + the fallback group (backup = true).<br/>Use Reviewers only if a real apply shows the service dropping the backup<br/>reviewer under Manager (see the post-apply check in main.tf). | `string` | `"Manager"` | no |
| access\_review\_start\_date | Optional RFC3339 UTC start of the first review (e.g. "2026-11-02T08:00:00Z").<br/>Empty = the service starts the series now. The start date cannot be changed<br/>once a review series exists. | `string` | `""` | no |
| approval\_required | Require approval before an assignment is granted. | `bool` | `true` | no |
| approval\_timeout\_days | Days an approval request waits before timing out. | `number` | `14` | no |
| approver\_group\_object\_id | Object id of a group whose members approve requests. If empty, approval<br/>falls back to the requestor's MANAGER (subject\_type requestorManager),<br/>which requires each requestor to have a manager set (HR provisioning does). | `string` | `""` | no |
| assignment\_duration\_days | Default lifetime of a REQUEST (T1/T2) assignment before it expires (contract: 180 days; per-package duration\_in\_days overrides it). Automatic (T3 birthright) assignments never expire. A T2 package that lives longer than 180 days gets a half-yearly policy review when enable\_access\_reviews\_requestable is on (ADR 0012). | `number` | `180` | no |
| b2b\_access\_group\_name | Assigned group the guest package grants (assign it to the apps affiliated physicians use). | `string` | `"Ext-Affiliated-Physicians"` | no |
| b2b\_access\_package\_name | Display name of the guest access package. | `string` | `"Affiliated Physicians"` | no |
| b2b\_approval\_timeout\_days | Days a guest request waits for each approval stage before it is denied. | `number` | `7` | no |
| b2b\_assignment\_duration\_days | Guest assignment lifetime (contract: 90 days). Capped at 180: longer guest access defeats the point of time-boxing it. | `number` | `90` | no |
| b2b\_catalog\_name | Display name of the externally visible catalog. | `string` | `"Affiliated Partners"` | no |
| b2b\_connected\_organization | The affiliated clinic, rendered into the connectedOrganization request<br/>body for the post-apply step (no provider resource exists). tenant\_id set<br/>=> azureActiveDirectoryTenant identity source (the clinic has Entra ID);<br/>empty => domainIdentitySource on domain\_name (email one-time passcode /<br/>other IdPs). The default is fictional and uses the reserved .example TLD. | <pre>object({<br/>    display_name = string<br/>    domain_name  = string<br/>    tenant_id    = optional(string, "")<br/>  })</pre> | <pre>{<br/>  "display_name": "Fabrikam Affiliated Clinic",<br/>  "domain_name": "fabrikam-clinic.example"<br/>}</pre> | no |
| b2b\_connected\_organization\_id | Object id of the connected organization, once the post-apply step has<br/>created it. Empty => the policy accepts members of ALL connected<br/>organizations in state "configured" (AllConfiguredConnectedOrganizationSubjects).<br/>Set it to narrow the policy to that one clinic (SpecificConnectedOrganizationSubjects). | `string` | `""` | no |
| b2b\_guest\_deletion\_after\_block\_days | Tenant entitlement-management setting rendered for the post-apply step:<br/>when a connected-org guest loses their LAST package assignment, block<br/>sign-in, then delete the guest account after this many days. Graph only<br/>accepts a duration; 30 keeps a recovery window for a mistaken removal. | `number` | `30` | no |
| b2b\_require\_external\_sponsor\_approval | Add a first approval stage for the clinic's EXTERNAL sponsors (their own<br/>medical director vouches before Contoso's internal sponsor decides).<br/>Off by default: external sponsors must already exist as guests in this<br/>tenant, which the lab has no real clinic to provide. | `bool` | `false` | no |
| b2b\_review\_duration\_days | Days each guest review instance stays open. Must be shorter than the interval (precondition in b2b.tf). | `number` | `14` | no |
| b2b\_review\_frequency | Recurrence of the sponsor review on the guest package (monthly: shorter than the 90-day expiry, so it actually fires). | `string` | `"monthly"` | no |
| b2b\_sponsor\_group\_name | Medical Staff Office group: fallback approvers + monthly reviewers for guest access. | `string` | `"B2B-Sponsors-MedicalStaffOffice"` | no |
| break\_glass\_group\_object\_id | Break-Glass-Admins group (modules/groups). Used only as a guard: ADR 0012<br/>keeps break-glass out of every default-deny review (a review that removes<br/>the recovery path is worse than no review; the 90-day drill checks it<br/>instead). With it set, the review outputs refuse any standalone review<br/>that names this group. Empty = only the name check (no review target<br/>whose key contains "break-glass" / "breakglass"). | `string` | `""` | no |
| catalog\_description | Catalog description. | `string` | `"Clinical application access packages for Contoso Health."` | no |
| catalog\_name | Access package catalog display name (contract: Clinical). | `string` | `"Clinical"` | no |
| enable\_access\_reviews | DEPRECATED - use the three flags above. Kept so an existing caller<br/>(envs/dev) still plans: true is read as all three of<br/>enable\_access\_reviews\_privileged, \_requestable and \_inactive. Even then no<br/>T3 (birthright) package is ever reviewed - the old behaviour, where this one<br/>switch also put a quarterly removeAccess review on the clinical packages,<br/>is gone (ADR 0012). Switch callers to the three flags; the alias will then<br/>be removed. | `bool` | `false` | no |
| enable\_access\_reviews\_inactive | Render the inactive-user (stale account) reviews in reviews.tf for inactive\_review\_group\_object\_ids. Default Deny + auto-apply; independent of the tier flags. | `bool` | `false` | no |
| enable\_access\_reviews\_privileged | T1 (ADR 0012): render the quarterly privileged reviews (PIM-governed groups, eligible + active, and pim\_eligible\_review\_bodies) with default Deny + auto-apply, and attach a quarterly removeAccess policy review to any T1 package. Never touches a T2 or T3 package. | `bool` | `false` | no |
| enable\_access\_reviews\_requestable | T2 (ADR 0012): attach a half-yearly removeAccess policy review to every T2 package that lives longer than 180 days or allows extension. A plain 180-day T2 package needs none: the expiry plus re-approval IS the certification. Never touches a T3 (birthright) package. | `bool` | `false` | no |
| enable\_b2b\_governance | Create the externally visible "Affiliated Partners" catalog and the<br/>"Affiliated Physicians" guest package (connected-org requestors, sponsor<br/>approval, 90-day expiry, monthly sponsor review). Needs Entra ID<br/>Governance. Leave false until the Governance trial runs; then run the<br/>connected-organization post-apply step (README.md) or the policy has no<br/>eligible requestors. Switching it back off destroys the package and<br/>catalog, so guests lose access at once (verify: whether the service<br/>refuses to delete a package that still has assignments). | `bool` | `false` | no |
| inactive\_review\_days | Days without any sign-in that put a member in scope of the inactive-user review (portal allows up to 730). 90 matches the stale-account KPI. | `number` | `90` | no |
| inactive\_review\_frequency | Recurrence of the inactive-user review. Same vocabulary as access\_review\_frequency. | `string` | `"quarterly"` | no |
| inactive\_review\_group\_object\_ids | Groups whose INACTIVE members (no sign-in for inactive\_review\_days) are<br/>reviewed, keyed by display name. Use groups whose membership is NOT owned<br/>by an access package (e.g. App-Okta-Federation-Users, the acquired-clinic<br/>population): removing a member from a package-granted group behind<br/>entitlement management's back leaves the package assignment orphaned -<br/>package groups are already covered by the policy review's sign-in-based<br/>recommendation. Dynamic groups cannot have members removed by a review. | `map(string)` | `{}` | no |
| pim\_eligible\_review\_bodies | Hand-off from modules/pim (output pim\_eligible\_review\_bodies): Graph v1.0<br/>accessReviewScheduleDefinition bodies (key => JSON string) for privileged<br/>access the PIM-group reviews above cannot see - the DIRECT role<br/>eligibility kept for Global Administrator (ADR 0002), scoped with<br/>/roleManagement/directory/roleEligibilityScheduleInstances or<br/>/roleManagement/directory/roleDefinitions/<id>. They are merged into<br/>access\_review\_definitions ONLY while enable\_access\_reviews\_privileged is<br/>on, so the one post-apply step (New-AccessReviewDefinitions.ps1) creates<br/>every T1 review. modules/pim renders the PIM-group reviews too, under the<br/>same "privileged:<group>" keys and display names as reviews.tf: on a key<br/>clash the modules/pim body wins, so each series is rendered once. Contract,<br/>checked here and again by the script: the displayName starts "Privileged<br/>access review:" (10-Review-KPIs.ps1 files it as T1; the script matches by<br/>displayName, so display names must be unique - output precondition),<br/>default decision Deny, auto-apply on, justification required, at least<br/>one reviewer and one fallback reviewer. Keys must not start "inactive:". | `map(string)` | `{}` | no |
| privileged\_review\_frequency | Recurrence of the standalone privileged access review (ADR 0012 T1: quarterly, the usual SOX / HITRUST cadence for admin access). Never less often than quarterly. | `string` | `"quarterly"` | no |
| privileged\_review\_group\_object\_ids | PIM-governed admin groups whose ELIGIBLE + active membership is reviewed,<br/>keyed by group display name (the key becomes the review's displayName, so<br/>keep it stable). Wire from modules/pim output privileged\_review\_targets:<br/>Privileged-IAM-Admins, the PIM tier groups and the Azure-resource eligible<br/>group. Values may be unknown at plan (new groups) - they only feed the<br/>rendered JSON. | `map(string)` | `{}` | no |
| privileged\_review\_reviewer\_group\_object\_id | Group whose members review privileged access (e.g. a security-governance<br/>group). Empty => the access-review fallback group. Must NOT be one of the<br/>reviewed groups (no self-certification of privilege; checked at apply). | `string` | `""` | no |
| requestable\_review\_frequency | Review cadence for the T2 packages that get a policy review (longer than 180 days or extendable). ADR 0012: half-yearly. Never less often than half-yearly. | `string` | `"halfyearly"` | no |
| requestor\_justification\_required | Require the requestor to supply a business justification. | `bool` | `true` | no |
| sod\_incompatible\_pairs | LEGACY. Kept so envs/dev's sod\_incompatible\_package\_id\_pairs output still<br/>resolves. The source of truth for separation of duties is<br/>lab/iga/sod-rules.json (SOD-01..09). SOD-01 supersedes this pair and adds<br/>ICU and ICU - Float Access; post-apply/Set-IncompatibleAccessPackages.ps1<br/>applies it. That script writes a link only ON the requestable side of a<br/>pair, because a link on a birthright package could block its automatic<br/>assignment (ADR 0012). So every pair here must contain at least one<br/>request package (precondition on the output). Set-AccessPackageSoD.ps1 is<br/>now a deprecation shim that runs Set-IncompatibleAccessPackages.ps1. | `list(list(string))` | <pre>[<br/>  [<br/>    "nurse",<br/>    "pharmacy"<br/>  ]<br/>]</pre> | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| access\_package\_ids | Map of package key => access package id (automatic and request packages). |
| access\_review\_definitions | Map of review key => JSON body for POST /identityGovernance/accessReviews/definitions: T1 privileged PIM-group reviews + pim\_eligible\_review\_bodies (enable\_access\_reviews\_privileged) and inactive-user reviews (enable\_access\_reviews\_inactive). Empty while those flags are off. |
| access\_review\_settings | Risk-tiered review configuration (ADR 0012): the three flags, duration, reviewers, and the per-package policy reviews actually attached (tier, frequency, review type, policy id; unanswered = removeAccess). null when every review flag is off. |
| assignment\_policy\_ids | Map of package key => REQUEST assignment policy id, for request (T1/T2) packages only. Automatic (T3) packages have no Terraform policy: their automatic assignment policy comes from post-apply/Set-AutoAssignmentPolicies.ps1. |
| b2b\_access\_group\_object\_id | Ext-Affiliated-Physicians group (assign to the guest-facing apps), or null. |
| b2b\_access\_package\_id | Id of the Affiliated Physicians access package (share its My Access link with the clinic), or null. |
| b2b\_assignment\_policy\_id | Id of the connected-org guest policy, or null. |
| b2b\_catalog\_id | Id of the externally visible Affiliated Partners catalog, or null when enable\_b2b\_governance = false. |
| b2b\_post\_apply | Inputs for the B2B post-apply step: connectedOrganization body (state configured), internal sponsor group, and the tenant external-user lifecycle settings body. null when enable\_b2b\_governance = false. |
| b2b\_sponsor\_group\_object\_id | B2B-Sponsors-MedicalStaffOffice group (fallback approvers + reviewers; add members post-apply), or null. |
| birthright\_package\_names | Display names of the automatic (T3) packages, sorted. Each needs exactly one automatic assignment policy from post-apply/Set-AutoAssignmentPolicies.ps1 (lab/iga/birthright-rules.json) - until that runs, nobody holds them. |
| catalog\_id | Id of the Clinical catalog. |
| package\_assignment\_model | Per package key: display\_name, tier (T1/T2/T3), assignment (automatic/request), expires\_after\_days (null = never: automatic), extension\_enabled, request\_policy (whether Terraform creates one) and certification (how it is re-certified; policy\_review is null when no campaign applies). |
| sod\_incompatible\_package\_id\_pairs | LEGACY package-id pairs (var.sod\_incompatible\_pairs), kept for envs/dev. Separation of duties is applied from lab/iga/sod-rules.json by post-apply/Set-IncompatibleAccessPackages.ps1 (Set-AccessPackageSoD.ps1 is a deprecation shim for it), with links only on the requestable side of each pair. |
<!-- END_TF_DOCS -->
