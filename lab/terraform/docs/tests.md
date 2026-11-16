# Tests (mocked, offline)

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 6 of 11


`terraform init -backend=false && terraform test` in each directory below
(`envs/dev` with `-var-file=lab.tfvars`). Every provider is a
`mock_provider`, so no tenant, subscription or cloud credential is involved.
`.github/workflows/lab-tests.yml` runs `validate` in every directory and
every one of these tests on each pull request (configured; no workflow has
run yet).

**Last run: 2026-10-26, HashiCorp Terraform 1.16.5, author's machine, the
working tree: 356 runs passed, 0 failed, across 19 directories** (333 in the
Entra / Azure / AWS / Okta roots and modules, 23 in the three Kubernetes
roots), and `validate` passed in all 19. (2026-10-20: 325 runs in 18
directories, before `modules/apps/tests/okta.tftest.hcl` and the `okta` root.)

| Directory | Test file(s) | Runs | What it asserts |
|---|---|---|---|
| `envs/dev` | `mock_plan.tftest.hcl` | 13 | The composition plans with the committed `lab.tfvars` and none of the staged layers plans anything; `lab.tfvars` holds back every SecurityEvent rule, the preview rule, the vault anomaly rule and `identity_risk`, on the Sentinel and the Log Analytics path; with every flag on it plans on both detection paths (Sentinel, Log Analytics alerts); legacy flags on with new flags off; the `c1` context refused while CA021 is report-only, in the same change that enables CA021, and without the tenant attestation, and allowed once CA021 is enforced; no DC keeps a /24 out of the watchlist; DC01 refuses a range wider than one host; flags without premium warn |
| `envs/bootstrap` | `optin.tftest.hcl` | 15 (2026-11-07) | `enable_evidence_delete_lock` adds one CanNotDelete lock on the evidence ACCOUNT (never the RG), none by default, refused without the account name; Nothing extra by default (no Azure Policy guardrail either; `enable_azure_guardrails` assigns both in Audit, a typo'd effect refused); `enable_pim_demo_readers_azure_rbac` grants exactly Reader, Microsoft Sentinel Reader and Log Analytics Reader (pinned role ids) to the PIM group at subscription scope, refused without a group id or for a group that is not the role-assignable PIM-Demo-Readers, and never widens APPLY's delegable roles; `enable_app_management_roles` adds exactly the four APPLY and two read-only PLAN roles; `enable_identity_protection_logs` adds the four risk categories to the baseline |
| `aws` | `github_oidc`, `entra_operator`, `lab_admin`, `patient_portal`, `audit_trail` (`.tftest.hcl`) | 30 (2026-11-06) | GitHub OIDC: off by default; the role trusts one repository's PR subject only; every allow is a read; wildcard and environment subjects refused; missing repository ids fail; an existing OIDC provider is reused. Operator: trust pinned to the operator, guardrails v2 + v3 (no IAM, Identity Center or account-creating writes; can't stop, delete or empty the audit trail). Audit trail: off by default; all regions, log file validation, management events only; bucket private, versioned, kept, writable only by this trail. Lab admin and patient portal: see `aws/README.md` |
| `okta` | `okta_federation.tftest.hcl` | 16 | By default only the clinic's estate (Clinic-Staff, its login-domain rule, the legacy bookmark app, one assignment); with `enable_entra_federation` the Entra OIDC IdP on the tenant's v2.0 endpoints (openid profile email, link by email) and ONE routing rule, priority 1, suffix-matching the clinic login domain only and targeting that IdP, attached to Okta's built-in discovery policy by data source (the Default Rule stays); the secret is sensitive end to end and, like the client and tenant ids, required when on; the rollback sets the rule INACTIVE, keeps the IdP and raises the warning check; JIT can be turned off; an @ or scheme in the domain, a plain-http app URL, a non-Okta cell, a host or -admin org name and a non-GUID client id refused; one mocked apply |
| `modules/apps` | `apps.tftest.hcl`, `servicenow.tftest.hcl`, `okta.tftest.hcl` | 46 | One AWS assignment, SAML basics and claims, wildcard reply URL and wrong template refused, three app roles mapped to fixed ids, SCIM absent by default and created stopped, empty SCIM token fails the gated apply and only warns in a PR plan, guacamole-psm id-token only and operators only; ServiceNow absent by default, one assignment, the sign-on URL from the IdP `sys_id`; a missing group or instance URL, a wildcard, trailing-slash, path, non-ServiceNow or plain-http instance URL and a malformed `sys_id` refused; three mocked applies; okta-clinic-idp absent by default, when on one app (single tenant, implicit grants off, the Graph scopes Okta asks for), one SP (assignment required), one assignment to App-Okta-Federation-Users and one redirect URI (the Okta authorize callback, https by construction), the ITSM reference stamped, the flag without an org host or group fails the plan, a scheme, path, wildcard, non-Okta host, look-alike suffix or -admin host refused, preview and EMEA cells accepted, a secret lifetime over 180 days refused; a fourth mocked apply (the bounded secret-minting command, the NHI row) |
| `modules/conditional-access` | `ca002_ca020_ca021_admins`, `ca004`, `ca006_ca007_risk`, `ca008_phishing_resistant`, `ca009_ca010_baseline`, `ca060_clinical` (`.tftest.hcl`) | 71 | CA002 role list cannot shrink; CA020 session-only, report-only, 4 h max; CA021 rendered report-only and its contract with the post-apply script, and the PIM context refused until CA021 is enforced and attested; CA023 off by default, report-only, never on the PIM context; risk policies report-only with the safe shape; CA008 scope, second keys, phishable combinations refused, break-glass excluded from every policy; CA009 multi-use TAP refused; CA010 exception group next to break-glass; CA022 targets the PSM app + admin portals with the ADMIN strength; CA060 device filter and injection-safe profile name; CA004 uses the bare named-location GUID |
| `modules/dc-vm` | `operator_ip.tftest.hcl` | 11 | Only single-host operator addresses open RDP / LDAPS; /24, /31, any-address, bare, IPv6 and malformed entries refused; disk and outbound shape unchanged |
| `modules/entitlement` | `governance.tftest.hcl` | 26 | Defaults match `lab/iga/access-catalog.json`; birthright packages have no policy and no expiry; T1 never reviews clinical packages; T2 only long or extendable packages; reviews deny by default; no self-review; break-glass never a review target; requested birthright, expiring automatic and automatic privileged packages refused; B2B package shape |
| `modules/azure-guardrails` | `guardrails.tftest.hcl` | 7 (2026-11-06) | Audit by default (assignment and definition); the Owner rule matches a real `/subscriptions/<id>/providers/...` role definition id (the old `equals` never did), one wildcard, not Contributor; allowed principals reach the assignment; Deny with nobody allowed refused; the Key Vault rule is the built-in logic (purge protection exists and on, recover skipped, no `notEquals "true"`, the missing-soft-delete check only under the old-API guard); bad inputs refused |
| `modules/entra-diagnostics` | `categories.tftest.hcl` | 7 | Baseline user, NHI and Graph categories; risk categories added by the switch; deduplication; a table name or a case typo instead of a category refused; AuditLogs cannot be dropped |
| `modules/evidence-store` | `worm.tftest.hcl` | 13 | WORM and Entra-only by default; retention bounds; lock needs acknowledgement; firewall format; wide ranges refused; writers container-scoped and cannot delete |
| `modules/groups` | `optional_groups.tftest.hcl` | 4 | Optional groups absent by default; the consent reviewers group is not role-assignable; All-Workforce never matches break-glass or guests; Admin-Accounts is role-assignable with assigned (standing) membership |
| `modules/intune-vm` | `network_exposure.tftest.hcl`, `vm_identity.tftest.hcl` | 41 | RDP is the only inbound allow and only from the operator entries (up to /24; /23 and wider, any-address, service tags, bare, IPv6 and malformed entries refused); Standard static public IP, no DNS label; size, image SKU, licence and Trusted Launch pinned; OS disk shape; system-assigned identity only; Intune enrolment on by default; one VM Administrator Login assignment per user or group at VM scope, none by default; nightly deallocation; multi-session, Pro and Windows 10 SKUs, bad hostnames, a reserved admin name and non-GUID object ids refused |
| `modules/keyvault` | `diagnostics.tftest.hcl`, `uami_abac.tftest.hcl` | 6 | Empty workspace id refused; wide IP range refused; the UAMI's read is ABAC-limited to the named secrets and an empty allow-list is refused |
| `modules/monitoring` | `itdr.tftest.hcl`, `itdr_v2.tftest.hcl` | 32 | Defaults create nothing; ITDR rules map the `.kql` columns; telemetry before Sentinel; containment only on High ITDR incidents, only with Sentinel and never on the SoD or vault rules; Log Analytics path skips the Sentinel-only rules; DC01 DCR events; ids rendered and display names refused; `operator_ips` watchlist ranges, expiry and owner rules; `vault_feed_v2_columns` |
| `modules/pim` | `pim.tftest.hcl` | 46 | Defaults keep only the original binding; PIM-Demo-Readers holds exactly Global Reader + Security Reader, PT8H MFA activation with no approval, mailed, reviewed, outside the CA scope and the tier map; tier groups and their notifications; one approver warns; the `c1` context replaces MFA only once CA021 is enforced, and the two-apply switchover; Global Administrator refused in a tier group; Tier-0 roles cannot sit in Tier 1; approval cannot be waived on Tier 0; Tier-0 eligibility capped at 180 days; help-desk AU scoping; the Global Administrator policy bodies; Azure PIM shape; Privileged-IAM-Admins can hold neither Global Administrator nor a Tier-0 role |
| `modules/pipeline-identity` | `plan_roles.tftest.hcl` | 5 | PLAN's opt-in Graph roles are an allow-list of read roles: ReadWrite, Invite, Create, Send and Manage roles refused |
| `k8s/platform` | `platform.tftest.hcl` | 3 | Pod Security labels; CSI driver chart and every image pinned; one token audience; Secret sync off; rotation on; non-kind context refused |
| `k8s/identity` | `identity.tftest.hcl` | 8 | SecretProviderClass serves one Key Vault secret through Workload ID, no Secret sync; no API token mounted; human RBAC has no secrets and no cluster scope; admission policy binds the workload to one digest and the pipeline |
| `k8s/keyvault-trust` | `keyvault_trust.tftest.hcl` | 6 | The federated credential trusts exactly the workload; Key Vault Secrets User on one secret; kind, trailing-slash and plain-http issuers refused |

Run them with `terraform`, not `tofu`: OpenTofu's mock providers fill in
computed ids at plan time, which hid an "Invalid count argument" error in
`modules/keyvault` that Terraform's plan (computed ids unknown, as in a real
first plan) caught. The `aws/` root documents its own checks in
[`aws/README.md`](../aws/README.md).

Run every directory the way CI does:

```bash
for d in envs/dev envs/bootstrap aws okta k8s/platform k8s/identity k8s/keyvault-trust modules/*; do
  terraform -chdir="$d" init -backend=false -input=false >/dev/null &&
  terraform -chdir="$d" validate &&
  { [ -d "$d/tests" ] || continue; terraform -chdir="$d" test $( [ -f "$d/lab.tfvars" ] && echo -var-file=lab.tfvars ); }
done
```

- No `terraform apply` has run — **no tenant exists yet**. Every statement
  above is a `validate` / `fmt` / mocked-test result or a property of the
  committed code, not a deployment result.
- The four roots (`envs/dev`, `envs/bootstrap`, `aws`, `okta`) carry a
  `.terraform.lock.hcl` meant to be **committed**: `registry.terraform.io`
  hashes generated by HashiCorp Terraform 1.16.5 with `terraform providers lock
  -platform=linux_amd64 -platform=darwin_arm64 -platform=darwin_amd64`
  (see `.gitignore`). Both workflows pin Terraform 1.16.5 to match. Child
  modules have no lock file. `tofu init` rewrites a root's lock file with
  `registry.opentofu.org` entries, so validate with tofu in a scratch copy (or
  `git checkout` the lock file afterwards) and never commit a tofu-written one.
- **Checkov.** Run locally with Checkov 3.3.20 on 2026-10-20 (`checkov -d
  lab/terraform --framework terraform`): **46 passed, 0 failed, 10 skipped**.
  Every skip is an inline `#checkov:skip=<ID>:<reason>` on its resource:
  - `dc-vm` and `intune-vm`: CKV_AZURE_151 (encryption at host: needs the
    `EncryptionAtHost` subscription feature; the disks use platform-managed
    server-side encryption) and CKV_AZURE_50 (VM extensions: the DC is built
    with `az vm run-command`, and the endpoint's Entra join needs the
    `AADLoginForWindows` extension);
  - `dc-vm`'s NTDS disk: CKV_AZURE_93 (platform-managed keys by design, the
    same trade-off as the evidence store);
  - `pipeline-identity`: CKV_AZURE_249 on the two GitHub federated
    credentials (their subjects are pinned to the immutable owner@id/repo@id
    form, which the check's pattern does not recognise);
  - `evidence-store` (CKV_AZURE_33, CKV_AZURE_59) and `keyvault`
    (CKV_AZURE_189), with the reasons in their `main.tf`;
  - `envs/operator`: CKV_AZURE_39 on the write-session role (ADR 0030). The
    check flags any custom role with `actions = ["*"]`; this one removes
    every `Microsoft.Authorization` write and delete, so it cannot assign
    roles or remove locks (pinned by `tests/operator.tftest.hcl`).

  Until 2026-10-20 the first seven were a documented baseline of 8 failed
  checks. The eighth, CKV_AZURE_251, is fixed rather than skipped: the NTDS
  disk now has `public_network_access_enabled = false` and
  `network_access_policy = "DenyAll"` (asserted in `dc-vm`'s tests; BUILT,
  not applied). `terraform-plan.yml` runs Checkov on every PR that touches
  `lab/terraform/**` with `soft_fail: false`, so any new failed check blocks
  the merge. Version gap: the pinned `checkov-action` runs Checkov **3.3.3**
  (an image tag the workflow cannot override), not 3.3.20, so CI may report
  a different set of checks (verify: on the first CI run).

---
