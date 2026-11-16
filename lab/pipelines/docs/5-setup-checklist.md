# 5. Setup checklist (what a human must configure)

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 5 of 7


Do these once. Nothing in the repo contains a secret; all of this is config on
the GitHub and Entra sides.

## A–C. Entra apps, Graph roles, Azure RBAC — one local bootstrap apply
The pipeline cannot create its own identities (chicken-and-egg), and no PR may
be able to widen its own permissions. So all of A–C lives in
[`../terraform/envs/bootstrap`](../../terraform/envs/bootstrap), applied **locally
by a human admin**, in a separate state container CI cannot reach:

- [ ] `cd lab/terraform/envs/bootstrap && cp terraform.tfvars.example terraform.tfvars`
      → set `github_owner`, `github_repo`, `github_owner_id`, `github_repo_id`
      (after the public repo exists: `gh api repos/OWNER/REPO --jq '.owner.id, .id'`),
      `tfstate_storage_account_name`.
- [ ] `terraform init -backend-config="storage_account_name=<sa>" && terraform apply`.
      This creates:
  - **PLAN** app + federated credential `repo:OWNER@OWNER_ID/REPO@REPO_ID:pull_request`, Graph
    roles `User.Read.All`, `Group.Read.All`, `Policy.Read.All`,
    `EntitlementManagement.Read.All`, `RoleManagement.Read.Directory`,
    `RoleManagementPolicy.Read.AzureADGroup`; Azure **Reader** (subscription).
  - **APPLY** app + federated credential `repo:OWNER@OWNER_ID/REPO@REPO_ID:environment:prod`,
    Graph roles `User.ReadWrite.All`, `Group.ReadWrite.All`, `Policy.Read.All`,
    `Policy.ReadWrite.ConditionalAccess`, `EntitlementManagement.ReadWrite.All`,
    `RoleManagement.ReadWrite.Directory`,
    `RoleManagementPolicy.ReadWrite.AzureADGroup`; Azure **Contributor** +
    **Role Based Access Control Administrator constrained by an ABAC condition**
    to the Key Vault Secrets User/Officer roles and *Virtual Machine
    Administrator Login* for the Intune VM (Contributor alone cannot create
    role assignments; the condition stops CI granting Owner to anything). The VM
    login role was added later: **re-apply bootstrap** before the pipeline
    applies `enable_intune_vm = true`, or the condition refuses the grant.
    **Scope** (`apply_azure_scope`, `envs/bootstrap/least-privilege.tf`):
    `subscription` for a first deployment only; `resource_group` (this lab,
    after senior gap 8) puts both roles on `rg-identity-lab` alone, where every
    Azure resource envs/dev manages lives. APPLY cannot remove the
    `CanNotDelete` locks on the Key Vaults: none of its roles has
    `Microsoft.Authorization/locks/delete`, and the condition stops it granting
    itself Owner or User Access Administrator (tested with a mirror identity,
    capture log E154).
  - APPLY: **Storage Blob Data Contributor** on the `tfstate` container only
    (apply takes the blob lease). PLAN: **Storage Blob Data Reader** on the
    same container (PR plans run with `-lock=false`). State holds the
    generated break-glass, DC and Intune VM local-admin passwords, so any
    same-repo PR run can read them.
  - PLAN: **Cognitive Services OpenAI User** on the Azure OpenAI account once
    `azure_openai_resource_id` is set.
- [ ] Click **Grant admin consent** for the tenant on BOTH apps (Entra → App
      registrations → API permissions) and confirm every row says *Granted*.
- [ ] Seed the envs/dev state blob once, as yourself:
      `terraform -chdir=lab/terraform/envs/dev init -input=false -backend-config=resource_group_name=<rg> -backend-config=storage_account_name=<sa>`.
      When the key is missing, the azurerm backend writes an empty state
      (under a lease) during init. The Reader-only PLAN identity cannot do
      that, so without this the first PR plan fails.
- [ ] Register resource providers once, as yourself — `envs/dev` sets
      `resource_provider_registrations = "none"` because the Reader-only PLAN
      identity cannot register them:
      ```bash
      for rp in Microsoft.KeyVault Microsoft.Network Microsoft.Compute Microsoft.ManagedIdentity \
                Microsoft.OperationalInsights Microsoft.OperationsManagement Microsoft.SecurityInsights \
                Microsoft.Insights Microsoft.DevTestLab Microsoft.Logic Microsoft.Web \
                Microsoft.CognitiveServices Microsoft.Storage; do az provider register -n $rp; done
      ```
- [ ] **Second bootstrap apply** once `envs/dev` has created Log Analytics (and
      the E5 trial is on): set `log_analytics_workspace_id` → the tenant's
      Entra diagnostic setting streams sign-in/audit/provisioning logs. It is
      human-owned on purpose: a pipeline PR can't remove it.

> `RoleManagement.ReadWrite.Directory` on APPLY is effectively Tier 0. The
> mitigations are the `prod` reviewer gate, the environment-scoped subject,
> and that its own identity, federation and grants are not in the root it
> applies (bootstrap is human-only); it could still escalate out of band, so
> this is change control, not a privilege boundary.

## D. GitHub — repo variables (Settings → Secrets and variables → Actions → Variables)
These are **identifiers, not secrets** — use *Variables*, not Secrets (the two
privacy-only exceptions follow the list):
- [ ] `AZURE_TENANT_ID`
- [ ] `AZURE_SUBSCRIPTION_ID`
- [ ] `AZURE_PLAN_CLIENT_ID`  (PLAN app client ID)
- [ ] `AZURE_APPLY_CLIENT_ID` (APPLY app client ID)
- [ ] (HR feed, optional) `HR_SYNC_CLIENT_ID` (bootstrap output `github_oidc_hr_sync_client_id`),
      `HR_PROV_SP_ID`, `HR_PROV_JOB_ID` (the HR provisioning app, `lab/setup/handback.env`),
      `HR_UPN_DOMAIN`; optional `HR_FEED_WAIT_SECONDS` (default 180) and
      `HR_FEED_BASE_SHA` (the commit the first push is compared with; default
      the point where `hr-feed` left `main`)
- [ ] (Evidence pack, optional) `EVIDENCE_CLIENT_ID` (bootstrap output
      `github_oidc_evidence_client_id`); it also reads `AZURE_TENANT_ID`,
      `AZURE_SUBSCRIPTION_ID` and `TF_EVIDENCE_STORAGE_ACCOUNT_NAME`. Optional:
      `EVIDENCE_RUNNER` (a self-hosted runner label on a network the evidence
      store's firewall admits; default `ubuntu-latest`, which it refuses),
      `EVIDENCE_RESOURCE_GROUP` (default `rg-identity-lab`),
      `EVIDENCE_CONTAINER_NAME` (default `evidence`)
- [ ] `AZURE_OPENAI_ENDPOINT`    e.g. `https://contoso-health-aoai.openai.azure.com`
- [ ] `AZURE_OPENAI_DEPLOYMENT`  e.g. `gpt-5.4-mini` (**verify:** a current GA
      chat model in your region at deploy time; gpt-4o is Deprecated/Legacy per
      the Foundry retirement schedule). `review.py` calls the v1 endpoint, so
      there is no `AZURE_OPENAI_API_VERSION` to set. It sends
      `max_completion_tokens` and no temperature, so it works with both GPT-5.x
      reasoning models and gpt-4o (verify: on the first real PR run).
- [ ] (optional) `AZURE_OPENAI_MAX_COMPLETION_TOKENS` (default 4000) and
      `AZURE_OPENAI_REASONING_EFFORT` (unset = model default; values are
      model-dependent)
- [ ] `TFSTATE_RG`, `TFSTATE_STORAGE_ACCOUNT`  (backend `-backend-config` values)
- [ ] `TF_ONMICROSOFT_DOMAIN`      e.g. `contosohealthlab.onmicrosoft.com`
- [ ] `TF_KEY_VAULT_NAME`          e.g. `kv-idlab-7f3a`
- [ ] `TF_PIM_APPROVER_OBJECT_IDS` JSON list, e.g. `["<admin object id>"]`
- [ ] `TF_SENTINEL_PLAYBOOK_ID`    printed by `lab/scripts/monitoring/Deploy-Playbook.ps1`
- [ ] `TF_KV_SECRETS_OFFICER_IDS`  JSON list of custodian object ids
- [ ] `TF_ENTITLEMENT_APPROVER_GROUP_OBJECT_ID` (optional) group object id
      whose members approve access-package requests. Unset = approval goes
      to the requestor's manager. Set it here, not only in a local
      `terraform.tfvars`, or the next CI apply moves approval back to the
      manager. It is also the review fallback below when that one is unset.
- [ ] `TF_ACCESS_REVIEW_FALLBACK_GROUP_OBJECT_ID` (optional) group object id
      whose members review users with no manager. Once access reviews are
      on, the plan fails if neither this nor
      `TF_ENTITLEMENT_APPROVER_GROUP_OBJECT_ID` is set.
- [ ] `TF_CA010_EXCEPTION_GROUP_OBJECT_IDS` (optional) JSON list of
      `CA010-Exclusion-<reason>` group ids, excluded from the device-code
      block next to break-glass. Unset = `[]`. Set here, or the next CI apply
      removes the exception.
- [ ] `TF_SERVICENOW_INSTANCE_URL`, `TF_SERVICENOW_SSO_SYS_ID` (optional) for
      the ServiceNow SAML app (`enable_servicenow_sso` in `lab.tfvars`): the
      instance URL and, once the identity provider record exists in
      ServiceNow, its sys_id (a second apply). Unset = `''`; the plan
      refuses the flag without the URL.
- [ ] `TF_INTUNE_VM_ADMIN_LOGIN_OBJECT_IDS` (optional) JSON list of user object
      ids that get *Virtual Machine Administrator Login* on the Intune VM (the
      CA005 pilot group gets it anyway). Unset = `[]`.
- [ ] Senior-scope identifiers (all optional until their staging flag is on;
      unset = empty / `[]`):
      `TF_PIM_TIER0_APPROVER_OBJECT_IDS` (JSON list; empty = the PIM approvers),
      `TF_PRIVILEGED_REVIEW_REVIEWER_GROUP_OBJECT_ID` (governance group that
      reviews PIM-eligible access), `TF_B2B_CONNECTED_ORGANIZATION_ID`
      (printed by `New-B2BConnectedOrganization.ps1`),
      `TF_CA008_PILOT_GROUP_OBJECT_ID` (only to reuse an existing pilot group),
      `TF_AWS_SAML_ENTITY_ID`, `TF_AWS_SAML_ACS_URLS` (JSON list),
      `TF_AWS_ACCESS_PORTAL_URL`, `TF_AWS_SCIM_TEMPLATE_ID` (from the AWS
      Identity Center console / `aws_scim_template_lookup_command`),
      `TF_CONTAINMENT_PLAYBOOK_ID` (printed by
      `Deploy-ContainmentPlaybook.ps1`), `TF_EVIDENCE_STORAGE_ACCOUNT_NAME`
      (globally unique), and for the ITDR rules `TF_IAC_PRINCIPAL_IDS` (JSON
      list of the APPLY identity's immutable ids: the `envs/bootstrap` output
      `iac_principal_ids`; empty = nothing counts as IaC, so every pipeline
      change alerts, which fails closed) and `TF_PRIVILEGED_USER_OBJECT_IDS`
      (JSON list of extra privileged user object ids, e.g. from
      `Find-ShadowAdmins.ps1 -PrivilegedIdsPath`). Set both in the
      `enable_itdr_detections` PR. The AWS SCIM token is **never** a CI value: one local
      seeding apply writes it from Key Vault, and `terraform-apply.yml` sets
      `TF_VAR_require_scim_credentials=true` so a CI apply that would create
      it empty fails instead.

**No repository secrets.** The workflows hold no stored value of any kind.
The five privacy values below are not credentials; they used to be repo
secrets (and Dependabot copies) only so GitHub masked them. The owner deleted
the five old `TF_*` repository secrets on 2026-11-10; the pipeline reads
these values only from Key Vault, after the OIDC sign-in. They now live in
the **pipeline config vault** (`envs/bootstrap` `pipeline-config.tf`,
repo Variable `TF_PIPELINE_CONFIG_VAULT`, default `kv-idlab-cicd-20f1`).
Step *Pipeline config from Key Vault* (`.github/scripts/pipeline-config.sh`)
reads them after the OIDC sign-in, as PLAN or APPLY (Key Vault Secrets User on
that vault only), masks each value and each list element, and exports them
as `TF_VAR_*`. A value it cannot read stops the job: the old secrets fell
back to `[]`/'' and planned removals. Every read is an `AuditEvent` in
loga-idlab. Write a value with
`printf '%s' '<value>' | lab/scripts/operator/set-pipeline-config.sh <vault> <name>`
(stdin only, shape-checked).

| Key Vault secret | Terraform variable | Shape |
|---|---|---|
| `tf-operator-ip-ranges` | `operator_ip_ranges` | JSON list, e.g. `["203.0.113.7/32"]`: Key Vault firewall, the DC and Intune VM NSGs, the evidence store firewall and the Sentinel `operator_ips` watchlist. Each entry one IPv4 /32 with `enable_dc`; never wider than /24; `0.0.0.0/0` fails validation. |
| `tf-alert-email` | `alert_email` | one address (post-trial alerts) |
| `tf-app-owner-object-ids` | `app_owner_object_ids` | JSON list of the human app owners' object ids (`modules/apps`) |
| `tf-saml-cert-notification-emails` | `saml_cert_notification_emails` | JSON list of SAML certificate expiry mailboxes |
| `tf-pim-alert-mailbox` | `pim_alert_mailbox` | one security mailbox for PIM notifications |

All five are also `sensitive` in Terraform, so the plan comment hides them.
Dependabot PR runs use the same OIDC sign-in and the same vault, so there is
no Dependabot secret to keep in step either. (verify: `id-token: write` and
repo Variables are honoured in Dependabot-triggered `pull_request` runs; if
not, azure/login fails and the plan check is red on Dependabot PRs, as
before.)

Policy knobs (staging flags, CA states, blocked countries) are **not**
variables: they live in the committed `lab/terraform/envs/dev/lab.tfvars`, so
every change is a reviewable diff — the CA flip PR in the demo edits that file.
That includes `itdr_exclude_rules` and the `evidence_immutability_*` trio:
they reach CI only through `-var-file=lab.tfvars`. `-var-file` outranks
`TF_VAR_`, so a `TF_VAR_itdr_exclude_rules` would be silently ignored, and a
repo Variable for the immutability settings would let a settings change,
with no PR and no review, lock the WORM store irreversibly.

> **Public-repo caution:** the plan comment is public. Anything not marked
> `sensitive` (object ids, UPNs, the onmicrosoft domain) is visible to anyone.
> None of it is a credential, but keep that in mind before adding variables.

## E. GitHub — the `prod` Environment with a required reviewer
> **Keep the reviewer on `prod`.** `prod` is the only Environment that gets the APPLY identity, so it is the gate: required reviewer ChromeData, "Prevent self-review" on, "Allow administrators to bypass" off, branch `main` only. The review plan job has no environment (read-only PLAN app). Do not remove the `prod` reviewer and do not move it to another Environment (section 3).

- [ ] Settings → **Environments** → **New environment** → name it **`prod`**
      (the name MUST match `environment: prod` in `terraform-apply.yml`).
- [ ] Add **Required reviewers** (yourself / a second admin). This is the human
      gate; the apply run pauses until approved. Tick **Prevent self-review**
      and clear **Allow administrators to bypass configured protection rules**.
- [ ] **Deployment branches and tags → Selected branches and tags → add
      `main`.** Required. The APPLY subject `environment:prod` carries no
      branch ref, so this setting is the only thing that ties the write
      identity to merged code. Without it, any branch can reach the APPLY app
      after the reviewer approves, for example a `workflow_dispatch` of an
      unmerged branch or a workflow added on a branch. (The job's `if:
      github.ref == refs/heads/main` in `terraform-apply.yml` is defence in
      depth only.) Do not use "Protected branches only": per GitHub's docs,
      when no branch protection rule exists in the repository, that option
      lets every branch deploy, and `main` here is protected by a ruleset,
      not a classic rule (verify: whether rulesets count for this option; the
      docs do not say).

## F. GitHub — branch protection / ruleset on `main`
- [ ] **One human code review on every PR (karen-review round 2, R1).** Since
      2026-11-08 AI agents author and merge only as the bot
      (`contoso-health-lab-bot[bot]`, through `bot-gh`), and `gh` on the
      agents' Mac signs in only as the bot. So the owner (ChromeData) is no
      longer the author, and can approve. `.github/CODEOWNERS` makes
      ChromeData the code owner of every path. In ruleset `main-protection`,
      under *Require a pull request before merging*:
      - Required approvals: **1**
      - **Require review from Code Owners**: on
      - **Require approval of the most recent reviewable push**: on (a push
        after the approval needs a new one)
      - Dismiss stale pull request approvals when new commits are pushed: on
      - Bypass list: **empty** (no app, no role, not the owner)
      Then *Settings -> Actions -> General -> Workflow permissions*: **off**
      "Allow GitHub Actions to create and approve pull requests", so no
      workflow token can be the approval. The bot's App can submit a review,
      but it is not a code owner, so its approval never counts.
      On GitHub Free this works because the repo is public (rulesets and
      code owner review are free for public repos). A PR that ChromeData
      authored itself (older PRs) cannot be approved by ChromeData: re-open
      it as the bot (`bot-gh`), or close it.
      Merge order: the agent opens the PR as the bot -> checks go green ->
      the owner reads the diff and clicks **Approve** in the browser -> the
      merge captain merges as the bot -> for Terraform, the apply waits on
      **Review deployments** for the owner again.
      **Status 2026-11-10 (done):** ruleset `main-protection` (id 25516348)
      requires 1 approving review and code owner review (read through the
      API: `required_approving_review_count` 1,
      `require_code_owner_review` true). `.github/CODEOWNERS` (#274) names
      the owner for every path, so no pull request merges without his
      review. The owner reports that "Allow GitHub Actions to create and
      approve pull requests" is off; the bot cannot read that setting, so
      this is the owner's statement, not a read.
- [ ] Require status checks to pass: `terraform plan`, `checkov (IaC scan)`,
      `trufflehog (secret scan)`, `terraform validate + test (mocked)` and
      `Pester + PSScriptAnalyzer + shell tests` (`lab-tests.yml`, no path
      filter for the same reason as below). (AI review is advisory — do **not** make it a
      required check.) `terraform-plan.yml` has no workflow-level `paths:`
      filter on purpose: GitHub leaves a path-skipped required check *Pending*
      and blocks the merge. It runs on every PR; TruffleHog always scans, and
      plan + Checkov skip at job level when nothing under `lab/terraform/**`
      changed (a job skipped by `if:` reports Success). If change detection
      itself fails, they run anyway (fail closed).
- [ ] Outside contributors: a fork PR cannot plan (no OIDC token, §2). Review
      the diff, push the branch into this repo, and merge from a same-repo PR.
- [ ] (Optional) require branches up to date; block force-push.
- [ ] Private vulnerability reporting enabled (`SECURITY.md` sends reporters
      to the *Report a vulnerability* button, which only appears once it is
      on). The publish script does it; verify in Settings.

## G. Smoke test
- [ ] Open a trivial PR under `lab/terraform/**` → confirm the plan comment
      (plain-English summary on top from `.github/scripts/plain-plan.py`, the
      raw plan under *Technical details*), the Checkov/TruffleHog checks, and
      the AI-review comment appear. The summary's tests run offline:
      `python3 -m unittest discover -s .github/scripts/tests`.
- [ ] Open a docs-only PR (e.g. edit `lab/docs/*.md`) → confirm `terraform plan`
      and `checkov (IaC scan)` show *Skipped*, `trufflehog (secret scan)` runs,
      and the PR is mergeable (not stuck on *Pending*).
- [ ] Merge → confirm `terraform-apply` pauses on the `prod` reviewer gate →
      approve → confirm apply runs with no secret in the logs.

---
