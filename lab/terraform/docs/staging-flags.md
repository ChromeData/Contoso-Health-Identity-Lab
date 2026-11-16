# Staging flags (every flag and its default)

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 4 of 11


Every flag below is `false` in the committed
[`envs/dev/lab.tfvars`](../envs/dev/lab.tfvars) except `pim_require_approval`
(default `true`). Flip one per PR, in the order of
[Apply order](apply-order.md) step 9. A `check` block warns when a
flag is on without its prerequisite; `validation` blocks refuse the
combinations that cannot work.

**`envs/dev` (CI-applied)**

| Flag | Default | Creates (module) | Needs |
|---|---|---|---|
| `enable_premium` | `false` | Break-glass + groups, Conditional Access CA001-CA005, PIM (groups, conditional-access, pim) | M365 E5 trial (Entra ID P2) |
| `enable_governance` | `false` | Catalog + access packages (entitlement) | `enable_premium`, Entra ID Governance trial |
| `enable_dc` | `false` | DC01 domain controller VM (dc-vm) | nothing: free tier, Azure compute cost |
| `enable_intune_vm` | `false` | Windows 11 VM, Entra joined + Intune enrolled, the CA005 compliant device (intune-vm) | `enable_premium` + the human steps in `lab/scripts/intune/README.md` |
| `enable_sentinel` | `false` | Sentinel onboarding + the core rules (monitoring). **Starts the 31-day trial** | Entra logs flowing for a few hours; not with `enable_la_alerts` |
| `enable_la_alerts` | `false` | The same rules as Log Analytics alerts, the post-trial path (monitoring), except `sentinel_only_rule_keys` (14-day look-back; no Log Analytics equivalent) | not with `enable_sentinel` |
| `enable_access_reviews` | `false` | Shorthand for the three tier flags below (deprecated alias) | `enable_governance` + a fallback reviewer group |
| `enable_access_reviews_privileged` | `false` | ADR 0012 T1: quarterly default-deny reviews of every PIM-governed group and of Global Administrator eligibility (rendered bodies) | `enable_governance` |
| `enable_access_reviews_requestable` | `false` | ADR 0012 T2: half-yearly `removeAccess` review, only on requestable packages that outlive 180 days or allow extension | `enable_governance` |
| `enable_access_reviews_inactive` | `false` | Inactive-user review of `App-Okta-Federation-Users` (rendered body) | `enable_governance` |
| `pim_require_approval` | **`true`** | Approval on Privileged-IAM-Admins activation (pim) | Tier-1 approvers |
| `enable_identity_protection_ca` | `false` | CA006 user risk High, CA007 sign-in risk High (conditional-access) | `enable_premium`, P2 licences **assigned**; Microsoft's managed risk policy set off by hand first |
| `enable_phishing_resistant_all_users` | `false` | CA008, the workforce authentication strength, CA008 pilot group, dynamic All-Workforce group | `enable_premium`; `admin_fido2_allowed_aaguids` or `accept_admin_synced_passkey_risk` |
| `enable_lcw_leaver_trigger` | `false` | dynamic All-Workforce group alone, the scheduled leaver workflow's trigger (a leaver drops out when HR disables the account) | `enable_premium` |
| `ca008_allow_all_users_enforcement` | `false` | Second key: CA008 enforced on all users | registration report shows full coverage; pilot ran enforced |
| `accept_admin_synced_passkey_risk` | `false` | Second key: allow the rollout with no admin AAGUID allow-list (record it in the risk register) | a reviewed risk acceptance |
| `enable_registration_ca` | `false` | CA009: register security info with a one-time TAP or a phishing-resistant method | `enable_premium` |
| `enable_device_code_block` | `false` | CA010: block the device code flow (enforcing it breaks `az login --use-device-code`) | `enable_premium` |
| `enable_admin_session_controls` | `false` | CA020: admin-portal sign-in every 4 h for Tier-0/1 roles and PIM groups | `enable_premium` |
| `enable_pim_auth_context` | `false` | CA021 + authentication context `c1`, rendered for `Set-AuthContextPolicies.ps1` | `enable_premium` |
| `ca021_enforced_in_tenant` | `false` | Attestation, not a feature: CA021 is enforced in the tenant. Only then may PIM require `c1` | an earlier apply declared CA021 `enabled` and `Set-AuthContextPolicies.ps1` reported it enabled |
| `enable_protected_actions_ca` | `false` | CA023 + authentication context `c2` for the protected actions on CA policies and named locations, rendered for `Set-AuthContextPolicies.ps1`; the bind is a manual step once CA023 is enforced | `enable_premium` |
| `enable_shared_clinical_ca` | `false` | CA060: shared clinical workstations (ADR 0014); code only, no such device exists in the lab | `enable_phishing_resistant_all_users` |
| `enable_pim_tiers` | `false` | 8 Tier-0 + 8 Tier-1 PIM groups and the approver groups (pim) | `enable_premium` + Tier-0 approvers |
| `enable_pim_azure_resources` | `false` | PIM-Azure-RG-Contributors eligible for Contributor on the lab RG | `enable_premium`; a **human** applier with Owner / User Access Administrator |
| `enable_pim_aws_admin` | `false` | PIM-AWS-Lab-Admins: AWS admin as a 2-hour PIM-for-Groups activation, assigned to the AWS IAM Identity Center app (ADR 0025) | `enable_premium`, `enable_sso_apps`; `lab/terraform/aws` `enable_lab_admin_jit` |
| `enable_pim_demo_readers` | `false` | PIM-Demo-Readers: read-only presenter access (Global Reader + Security Reader) as an 8-hour PIM-for-Groups activation, no approval, every activation mailed; reviewed quarterly, outside the CA002 / CA020 scope | `enable_premium`; the Azure read roles are envs/bootstrap `enable_pim_demo_readers_azure_rbac` (human-applied) |
| `enable_helpdesk_au_scoping` | `false` | `AU-Workforce-Standard` + help-desk roles scoped to it | `enable_pim_tiers` |
| `enable_global_admin_pim_policy` | `false` | Global Administrator's PIM policy + named 180-day eligibility, rendered for `Set-DirectoryRolePimPolicies.ps1` | `enable_premium` + Tier-0 approvers |
| `pim_tier0_auth_context_switchover_step1` | `false` | Apply 1 of 2 when switching existing Tier-0 policies from MFA to `c1` | CA021 enforced; apply 2 straight after |
| `enable_b2b_governance` | `false` | Affiliated Partners catalog + Affiliated Physicians guest package | `enable_premium` + `enable_governance` |
| `enable_sso_apps` | `false` | AWS IAM Identity Center SAML app + Clinical Portal OIDC app (apps) | `enable_premium`; bootstrap `enable_app_management_roles` |
| `enable_scim_provisioning` | `false` | AWS provisioning job, **stopped**, and its credential | `enable_sso_apps`; a local seeding apply, never CI |
| `aws_scim_job_enabled` | `false` | Starts the AWS provisioning job | Test Connection + one on-demand provision succeeded |
| `require_scim_credentials` | `false` | Fail closed when the SCIM credential would be created without a token (`true` in the apply workflow) | — |
| `enable_pam_oidc_app` | `false` | guacamole-psm + PAM-Operators, and CA022 | `enable_sso_apps` |
| `enable_servicenow_sso` | `false` | ServiceNow SAML app (non-gallery, assignment required, one group) | `enable_sso_apps`; `servicenow_instance_url` in `terraform.tfvars` / `TF_VAR_`, never `lab.tfvars` |
| `enable_okta_federation` | `false` | okta-clinic-idp: Entra as the OIDC identity provider for the acquired clinic's Okta org (apps `okta.tf`), one assignment (App-Okta-Federation-Users); the client secret is minted by a human post-apply, never by Terraform | `enable_sso_apps`; `okta_org_domain` in `terraform.tfvars` / `TF_VAR_`, never `lab.tfvars`; then the human-applied `okta/` root |
| `clinical_portal_preauthorize_azure_cli` | `false` | Pre-authorizes the Azure CLI on the Clinical Portal scope (evidence E25 token demo only) | `enable_sso_apps`; turn off afterwards |
| `enable_nhi_governance` | `false` | App-Consent-Reviewers group for the admin consent workflow (groups) | `enable_premium` |
| `enable_agent_identity` | `false` | `uami-agent-runtime`, a role-less managed identity for Entra Agent ID | nothing in Terraform; the Agent ID API is preview and licence-gated (verify: Agent 365) |
| `enable_itdr_detections` | `false` | The 11 ITDR rules + `VaultCheckout_CL`, DCE/DCR for the vault feed and, with `enable_dc`, AMA + a Security-event DCR on DC01 (monitoring); starts no trial | turn on before `enable_sentinel`; `identity_risk` also needs bootstrap `enable_identity_protection_logs` |
| `enable_itdr_detections_v2` | `false` | The 6 second-wave rules + the `operator_ips` watchlist (Sentinel, with `enable_dc`) | `enable_itdr_detections` |
| `enable_itdr_detections_v3` | `false` | The 2 third-set rules: a dormant admin account signing in again, bulk Key Vault secret reads (both Sentinel only; the Key Vault rule never contains). `false` in `lab.tfvars` too, until its own PR | `enable_itdr_detections` |
| `vault_feed_v2_columns` | `false` | Ticket, Operator and ErrorText columns on `VaultCheckout_CL` | `enable_itdr_detections`; same PR as `ingest-vault-audit.sh --signals all` |
| `enable_itdr_containment` | `false` | Containment automation rule on new High ITDR incidents | `enable_sentinel` + `enable_itdr_detections` + `containment_playbook_id` |
| `containment_on_alert_added` | `false` | Also run containment when a High alert joins an existing incident | `enable_itdr_containment` |
| `enable_evidence_store` | `false` | WORM evidence storage account, Unlocked (evidence-store) | nothing: Azure storage cost only; apply before Day 0 |
| `evidence_immutability_lock_acknowledged` | `false` | Second key: lock the immutability policy (irreversible) | the deliberate lock PR (Day 28 of the capture plan) |

Other committed knobs in `lab.tfvars`: `ca_policy_states` (one entry per
policy, all `enabledForReportingButNotEnforced`), `ca008_scope`
(`"all_users"` while report-only, `"pilot"` to enforce),
`admin_fido2_allowed_aaguids` (`[]`), `pim_tier0_activation_auth_context_id`
(`""` until CA021 is enforced), `operator_ips_expires_on` (ADR 0013's review
date) and `blocked_countries`. `itdr_exclude_rules` (default `[]`) is set per
environment, not committed.

**`envs/bootstrap` (human-applied)**

| Flag | Default | Effect |
|---|---|---|
| `enable_app_management_roles` | `false` | APPLY gets the four Graph roles `modules/apps` needs (incl. Tier-0 `AppRoleAssignment.ReadWrite.All`); PLAN gets two read roles |
| `enable_identity_protection_logs` | `false` | Adds RiskyUsers, UserRiskEvents, RiskyServicePrincipals and ServicePrincipalRiskEvents to the Entra diagnostic setting (P2) |
| `enable_azure_guardrails` | `false` | Assigns the two Azure Policy guardrails (`modules/azure-guardrails`) to the subscription, both in **Audit** (`standing_owner_effect`, `keyvault_protection_effect`); Deny needs `owner_allowed_principal_ids` |

**`aws/` (human-applied)**

| Flag | Default | Effect |
|---|---|---|
| `enable_github_oidc` | `false` | GitHub Actions OIDC provider + a read-only role for plan runs |
| `enable_audit_baseline` | `false` | CloudTrail trail `contoso-lab-audit-trail` (all regions, log file validation) + its locked-down S3 bucket + the free external-access IAM Access Analyzer (`audit-trail.tf`); apply with a LabAdministrator session |
| `enable_session_manager` | `false` | One t4g.micro with no inbound port, SSH key or public IP, reachable only by a Session Manager shell through four VPC endpoints (~$1/day while on); transcripts to CloudWatch Logs; the `LabServerSession` permission set for the SCIM copy of `PIM-AWS-Lab-Admins` (`session-manager.tf`); apply with a LabAdministrator session, turn off after a capture |

**`okta/` (human-applied)**

| Flag | Default | Effect |
|---|---|---|
| `enable_entra_federation` | `false` | The Microsoft Entra ID OIDC identity provider + the routing rule for the clinic login domain (needs the Entra app's client id, the tenant id and `TF_VAR_entra_client_secret`). Off = only the clinic's own estate (group, rule, legacy app) |
| `routing_rule_active` | **`true`** | `false` = the routing rule goes INACTIVE: the runbook's Phase 1 rollback, clinic users back on Okta passwords; a `check` warns on every plan |

---
