# File tree

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 1 of 11


```
lab/terraform/
├── .gitignore
├── README.md                         ← the index: the modules and the pages in docs/
├── docs/                             ← the pages of the README (this page is one of them)
├── .terraform-docs.yml               ← settings for the lists in each module README
├── tools/module-docs.sh              ← writes those lists (terraform-docs); --check tells you if a list is old
├── aws/                              ← HUMAN-applied, separate cloud: IAM Identity Center permission set + assignment (after SCIM)
│   ├── .terraform.lock.hcl           ← provider hashes (HashiCorp Terraform 1.16.5, 3 platforms) - committed
│   ├── versions.tf / providers.tf / variables.tf / main.tf / outputs.tf
│   ├── github-oidc.tf                ← optional (enable_github_oidc) read-only GitHub OIDC role for plan runs
│   ├── audit-trail.tf                ← optional (enable_audit_baseline) CloudTrail trail + bucket + IAM Access Analyzer
│   ├── session-manager.tf            ← optional (enable_session_manager) no-inbound-port server, Session Manager shell only, LabServerSession for the PIM group
│   ├── tests/                        ← mocked terraform test (github_oidc.tftest.hcl)
│   ├── terraform.tfvars.example      ← copy → terraform.tfvars (gitignored): profile, region, account guard
│   └── README.md                     ← why separate, order of operations, verify list, CI-OIDC production option
├── envs/
│   ├── bootstrap/                    ← HUMAN-applied: CI identities + their RBAC (own state container)
│   │   ├── .terraform.lock.hcl       ← committed (same as aws/ and dev/)
│   │   ├── backend.tf / providers.tf / versions.tf / variables.tf
│   │   ├── terraform.tfvars.example
│   │   ├── main.tf                   ← pipeline-identity + Reader/Contributor/constrained RBAC admin/state access + entra-diagnostics;
│   │   │                               opt-in: enable_app_management_roles, enable_identity_protection_logs, enable_azure_guardrails
│   │   ├── outputs.tf                ← client ids → GitHub Actions variables; effective pipeline Graph roles
│   │   └── tests/                    ← mocked terraform test (optin.tftest.hcl)
│   └── dev/                          ← CI-applied root composition (10 modules behind staging flags + the Agent ID runtime UAMI)
│       ├── .terraform.lock.hcl       ← committed; CI pins Terraform 1.16.5 to match
│       ├── README.md                 ← apply order + P1/P2/Governance tiers
│       ├── backend.tf                ← azurerm remote state (versioned SA); -backend=false for validate
│       ├── providers.tf              ← azuread + azurerm + random provider config
│       ├── versions.tf               ← terraform + provider version pins
│       ├── variables.tf
│       ├── lab.tfvars                ← COMMITTED policy knobs: staging flags + CA states
│       ├── terraform.tfvars.example  ← copy → terraform.tfvars (gitignored): tenant identifiers
│       ├── main.tf                   ← RG + Log Analytics + module calls behind staging flags
│       ├── outputs.tf
│       └── tests/                    ← mocked `terraform test` plan of the composition
├── k8s/                              ← kind cluster segment, local state, built + destroyed per run (see "Kubernetes workload identity")
│   ├── keyvault-trust/               ← operator-applied per run: Entra app + federated credential, Key Vault Secrets User on one secret; tests/
│   ├── platform/                     ← namespaces + Pod Security labels, CSI driver + Azure Key Vault provider; tests/ (mocked, run by CI)
│   └── identity/                     ← service accounts, SecretProviderClass, group RBAC, admission policy; tests/
├── okta/                             ← HUMAN-applied, separate product: the Okta side of the clinic coexistence (ADR 0022)
│   ├── .terraform.lock.hcl           ← okta/okta 4.20.0 hashes (HashiCorp Terraform 1.16.5, 3 platforms) - committed
│   ├── versions.tf / providers.tf / variables.tf / main.tf / outputs.tf
│   ├── tests/                        ← mocked terraform test (okta_federation.tftest.hcl)
│   ├── terraform.tfvars.example      ← copy → terraform.tfvars (gitignored): org, clinic domain, Entra ids (never the secret)
│   └── README.md                     ← apply order (Entra app first), Integrator Free limits, runbook Phase 1 mapping, verify list
└── modules/
    ├── dc-vm/                        ← AD DS domain controller VM (NSG operator-IP only, no-cache NTDS disk, auto-shutdown); tests/
    ├── intune-vm/                    ← Windows 11 VM, Entra joined + Intune enrolled (CA005 compliant device); tests/
    ├── entra-diagnostics/            ← tenant Entra logs → Log Analytics (bootstrap only: no envs/dev PR can remove it); tests/
    ├── azure-guardrails/             ← Azure Policy: no new standing Owner + Key Vault deletion protection, Audit first (bootstrap only); tests/
    ├── monitoring/                   ← lab/kql as Sentinel rules (trial) or Log Analytics alerts (post-trial): main.tf (5 core),
    │                                   itdr.tf (11 ITDR + containment), itdr_v2.tf (6 more + operator_ips watchlist),
    │                                   telemetry.tf (VaultCheckout_CL, DCE/DCRs, AMA on DC01); tests/
    ├── groups/                       ← break-glass (+ GA), dynamic birthright + role-assignable + app + CA005 pilot groups,
    │                                   Admin-Accounts (standing, no role); optional App-Consent-Reviewers + All-Workforce; tests/
    ├── conditional-access/           ← main.tf CA001-CA008, baseline.tf CA009/CA010, admins.tf CA020/CA021 (rendered)/CA022/
    │                                   CA023 (rendered), clinical.tf CA060; named location, admin + workforce + bootstrap auth strengths; tests/
    ├── pim/                          ← main.tf Privileged-IAM-Admins; tiers.tf 8 Tier-0 + 8 Tier-1 groups; approvers.tf;
    │                                   directory-roles.tf (GA policy, rendered); helpdesk.tf (AU scope); azure.tf; aws.tf;
    │                                   demo-readers.tf (PIM-Demo-Readers, read-only presenter); reviews.tf; tests/
    ├── entitlement/                  ← catalog, access packages per lab/iga/access-catalog.json, ADR 0012 review tiers;
    │                                   reviews.tf (rendered privileged + inactive bodies); b2b.tf (guest catalog/package); tests/
    ├── apps/                         ← AWS IAM Identity Center SAML (+ staged SCIM), ServiceNow SAML (servicenow.tf),
    │                                   Clinical Portal OIDC, guacamole-psm, okta-clinic-idp (okta.tf); tests/
    ├── evidence-store/               ← WORM storage account (version-level immutability, Entra-only, delete-denying writers); tests/
    ├── pipeline-identity/            ← 2 GitHub-OIDC apps (plan/apply) + Graph app roles (bootstrap only); tests/
    └── keyvault/                     ← RBAC Key Vault, PE + private DNS, operator-IP firewall, UAMI; tests/
```

Each module ships `versions.tf` / `variables.tf` / `main.tf` / `outputs.tf`
and is heavily commented inline. Every module carries a
`tests/` folder (mocked `terraform test`, see [Tests](tests.md)); `apps/`, `entitlement/`, `pim/` add a
`README.md` with their staged tenant order and verify list.

---
