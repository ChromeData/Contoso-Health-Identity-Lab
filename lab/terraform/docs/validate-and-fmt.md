# Validate / fmt status

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 5 of 11


Re-validated 2026-10-20 with **HashiCorp Terraform v1.16.5** (`terraform
fmt -check -recursive` clean; `init -backend=false` + `validate` clean in
every directory below), and again on 2026-10-26 for `modules/apps`, `envs/dev`
and the new `okta` root. Providers locked: **azuread 3.10.0**, **azurerm
4.81.0**, **random 3.9.1**, **hashicorp/aws 6.69.1** (`aws/` only) and
**okta/okta 4.20.0** (`okta/` only).
OpenTofu v1.13.1 also validated every directory on 2026-10-19, before the
latest changes.

| Directory | `init -backend=false` | `validate` | `fmt` |
|-----------|-----------------------|------------|-------|
| `modules/apps` | ok | **Success** | clean |
| `modules/conditional-access` | ok | **Success** | clean |
| `modules/dc-vm` | ok | **Success** | clean |
| `modules/entitlement` | ok | **Success** | clean |
| `modules/entra-diagnostics` | ok | **Success** | clean |
| `modules/evidence-store` | ok | **Success** | clean |
| `modules/groups` | ok | **Success** | clean |
| `modules/intune-vm` | ok | **Success** | clean |
| `modules/keyvault` | ok | **Success** | clean |
| `modules/monitoring` | ok | **Success** | clean |
| `modules/pim` | ok | **Success** | clean |
| `modules/pipeline-identity` | ok | **Success** | clean |
| `envs/dev` (whole composition) | ok | **Success** | clean |
| `envs/bootstrap` | ok | **Success** | clean |
| `aws` (separate root, hashicorp/aws 6.69.1) | ok | **Success** | clean |
| `okta` (separate root, okta/okta 4.20.0) | ok | **Success** | clean |
| `k8s/platform`, `k8s/identity`, `k8s/aks-mapping` (now `k8s/keyvault-trust`) | ok | **Success** | clean |

What the committed code itself enforces (`validation` / `precondition` /
`check` blocks and plain expressions, so you can check each in the file named):

- **CA:** every policy defaults to report-only; `ca_policy_states` rejects a
  missing key, an unknown key and an invalid state; break-glass is excluded
  from every policy; CA008 all-users enforcement and a workforce rollout
  without the admin AAGUID list each need a second key
  (`modules/conditional-access/variables.tf`, `main.tf`).
- **Break-glass:** the domain must be `*.onmicrosoft.com` and there are at
  least two accounts (`modules/groups/variables.tf`).
- **PIM:** Tier 0 without approvers fails at plan; Global Administrator can
  never be a tier group's role; a Tier-0 role cannot sit in a Tier-1 group;
  Tier-0 groups cannot waive approval; Tier-0 eligibility cannot exceed 180
  days; the `c1` authentication context is refused until CA021 is declared
  enforced (`modules/pim/variables.tf`, `envs/dev/main.tf`).
- **Key Vault and VMs:** a malformed IP range or one wider than /24 is
  rejected (the same rule guards `operator_ip_ranges` in `envs/dev`; DC01
  accepts single hosts only), and an empty allow-list turns public network
  access off (`modules/keyvault/variables.tf`, `modules/dc-vm/variables.tf`).
- **Staging:** every premium/governance module sits behind its `lab.tfvars`
  flag (`count` in `envs/dev/main.tf`), whose `check` blocks warn on flag
  combinations that cannot work. Access reviews fail at plan without a
  fallback reviewer group and are risk-tiered per ADR 0012: a birthright
  clinical package is never reviewed by a person (`modules/entitlement/`).
- **Detections:** containment never runs on the SoD or vault rules; the
  identity ids the ITDR rules judge by are immutable ids, never display names
  (`modules/monitoring/`).
- **Bootstrap:** the APPLY federated subject is environment-scoped
  (`modules/pipeline-identity/main.tf`); its RBAC-admin grant carries the
  ABAC role condition, and CI state access is container-scoped
  (`envs/bootstrap/main.tf`); a write role can never be added to PLAN.
