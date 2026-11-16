# Contoso Health — Entra ID IAM / PAM Terraform Lab

Terraform for an **Identity & Access Management / Privileged Access
Management** lab on **Microsoft Entra ID**, modelled for the fictional
**Contoso Health** hospital group. Behind the `envs/dev` root it builds
break-glass accounts and groups (including the standing Admin-Accounts group,
the admin passkey target), Conditional Access (CA001-CA010, CA020, CA022,
CA060, plus the rendered CA021 and CA023; CA011 is a Graph script),
Privileged Identity Management
(tier groups, approver groups, Global Administrator policy, AU-scoped help
desk, PIM for Azure resources), Entitlement Management (access packages,
risk-tiered access reviews, B2B guests), a hardened Key Vault, the AD DS
domain controller and Intune "compliant device" VMs, SSO / SCIM apps (AWS
IAM Identity Center, ServiceNow SAML, the Clinical Portal, the PAM broker),
the 24 detections with
their telemetry and approval-gated containment, and a WORM evidence store.
Every layer sits behind a staging flag that is `false` in `lab.tfvars`
([Staging flags](docs/staging-flags.md)). The GitHub-OIDC
CI identities live in a separate, human-applied `envs/bootstrap` root, and the
AWS IAM Identity Center permission set in an equally separate, human-applied
`aws/` root, and the Okta side of the acquired clinic's coexistence (ADR 0022) in
a third human-applied root, `okta/`. ("Human-applied" means applied
outside CI, from the operator workstation. The owner starts or approves
each such apply. From 2026-11-05 to 2026-11-08 AI helpers running as the lab
operator also applied roots from unmerged branches: 14 applies from 9
branches, 13 by helpers (the last the three targeted `okta/` applies of the
wave-1 cut-over, E184, 2026-11-08) and one at the owner's direction
(`envs/bootstrap` from the #282 branch). Each one, and how it was
reconciled, is in `lab/docs/change-record-outside-the-gate.md`.) Workforce users (Dana Okafor and colleagues) are **not**
Terraform's: HR provisioning owns them.

> **Status: BUILT.** Every directory validates and every mocked test passes
> (counts in [Tests](docs/tests.md)). **Applied to the lab tenant by the pipeline since 2026-10-28: 64 merged changes** (see `lab/evidence/capture-log.csv`). RAN · tenant: bootstrap, dev stages day1 to day3, sentinel, dc, itdr, apps, servicenow, okta, reviews, intune-vm.

Providers: **azuread `~> 3.10`** (Microsoft Graph / Entra) and **azurerm
`~> 4.0`** (Azure resources), plus **random `~> 3.6`** for initial passwords.
The separate `aws/` root alone uses **aws `~> 6.0`**, and the separate `okta/`
root alone **okta/okta `~> 4.0`** (4.20.0 locked).

> **Placeholders to swap for your tenant:** `onmicrosoft_domain`,
> `subscription_id`, `tenant_id`, the globally-unique `key_vault_name` and
> state storage account, (bootstrap) `github_owner` / `github_repo`, and
> (aws) `aws_region` / `allowed_account_ids`.
> Everything else defaults to the shared contract names.

---

## Modules

Each module has a README: its purpose, the real call from the lab, its tests, and lists of inputs, outputs and resources.
[`tools/module-docs.sh`](tools/module-docs.sh) makes the lists with `terraform-docs`. `--check` tells you if a list is old.
The real example of the modules in use is [`envs/dev/main.tf`](envs/dev/main.tf).

| Module | What it makes |
|---|---|
| [`groups`](modules/groups/README.md) | The groups and the two break-glass accounts that Terraform owns. |
| [`conditional-access`](modules/conditional-access/README.md) | The Conditional Access policies, the authentication strengths and one named location. |
| [`pim`](modules/pim/README.md) | Just-in-time admin access: activation, time limits and approval. |
| [`entitlement`](modules/entitlement/README.md) | Access packages: who can request, who approves, when it expires, who reviews. |
| [`apps`](modules/apps/README.md) | Single sign-on and provisioning for AWS, ServiceNow and Okta. |
| [`monitoring`](modules/monitoring/README.md) | The KQL detections as Sentinel rules or Log Analytics alerts. |
| [`entra-diagnostics`](modules/entra-diagnostics/README.md) | The Entra logs to Log Analytics. |
| [`evidence-store`](modules/evidence-store/README.md) | The write-once store for audit evidence. |
| [`keyvault`](modules/keyvault/README.md) | A hardened Key Vault with a private endpoint. |
| [`pipeline-identity`](modules/pipeline-identity/README.md) | The GitHub Actions identities, with federated credentials only. |
| [`leaver-extension`](modules/leaver-extension/README.md) | The Logic App that removes automatic access packages when a person leaves. |
| [`azure-guardrails`](modules/azure-guardrails/README.md) | Two Azure Policy guardrails, in audit mode first. |
| [`dc-vm`](modules/dc-vm/README.md) | The domain controller virtual machine. |
| [`intune-vm`](modules/intune-vm/README.md) | The managed Windows 11 virtual machine. |

## Contents

| Page | What it holds |
|---|---|
| [File tree](docs/file-tree.md) | Each folder and file, with one line on its purpose. |
| [Module map](docs/module-map.md) | The 14 modules and the environment that calls each one. |
| [License requirements per resource](docs/license-requirements.md) | The Microsoft license that each resource needs to operate. |
| [Staging flags (every flag and its default)](docs/staging-flags.md) | Each feature flag, its default, and what it turns on. |
| [Validate / fmt status](docs/validate-and-fmt.md) | The last `terraform validate` and `terraform fmt` results, by folder. |
| [Tests (mocked, offline)](docs/tests.md) | The mocked tests: where they are, how to run them, and what each set proves. |
| [Human steps Terraform CANNOT do (portal / Microsoft Graph)](docs/human-steps.md) | The steps that Terraform cannot do. A person does them in the portal or with Graph. |
| [Remote-state bootstrap (one-time, out-of-band)](docs/remote-state-bootstrap.md) | How to make the storage account for the Terraform state, one time. |
| [Apply order (whole lab)](docs/apply-order.md) | The order of the applies for the full lab. |
| [Kubernetes workload identity (`k8s/`)](docs/kubernetes-workload-identity.md) | The Kubernetes part (`k8s/`). It is not in the apply order. |
| [Security notes](docs/security-notes.md) | The security rules that the code keeps, such as the break-glass exclusion. |
