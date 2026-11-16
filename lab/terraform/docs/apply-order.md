# Apply order (whole lab)

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 9 of 11


1. Bootstrap the state account (above).
2. `envs/bootstrap` — local, human: CI identities + RBAC; grant admin consent;
   then add the ReadOnly lock on the state account (above).
   Seed the envs/dev state blob once, as yourself:
   `terraform -chdir=lab/terraform/envs/dev init -input=false -backend-config=resource_group_name=<rg> -backend-config=storage_account_name=<sa>`.
   When the key is missing, the azurerm backend writes an empty state (under
   a lease) during init. The Reader-only PLAN identity cannot do that, so
   without this the first PR plan fails.
3. `envs/dev` with `lab.tfvars` flags `false/false` — via the pipeline: RG, Log
   Analytics, Key Vault (free tier, no trial clock). Then `enable_dc = true`
   and build the DC with `lab/scripts/dc/` (still no trial clock).
4. Start the E5 + Governance trials, then a PR flipping both flags to `true`:
   break-glass, groups, CA (all report-only, CA005 pilot-scoped), PIM, access
   packages. Optional later PRs:
   - the three review tiers, one PR each (after governance, once HR users
     with managers exist): `enable_access_reviews_privileged`,
     `enable_access_reviews_requestable`, `enable_access_reviews_inactive`.
     Set `TF_ACCESS_REVIEW_FALLBACK_GROUP_OBJECT_ID` first (CI passes no
     approver group to fall back on), or the plan fails. Switching a policy
     review off again is a portal step (human step 12).
   - `enable_intune_vm = true` (after premium): first re-apply `envs/bootstrap`
     locally so CI may delegate *Virtual Machine Administrator Login*, and do
     the MDM user scope + licence prerequisites in `lab/scripts/intune/README.md`.
5. Post-apply: `terraform output -json`, then
   `lab/scripts/powershell/post-apply/Invoke-PostApply.ps1` (`-ListOnly`,
   then the dry run, then `-Execute`). It runs `01-Verify-Baseline.ps1` first
   as a gate and every other step whose flag is on, in dependency order
   ([`lab/scripts/powershell/README.md`](../../scripts/powershell/README.md)).
   PIM eligibility needs HR-provisioned people, so pass `-PimEligibility`
   after HR provisioning. For the Intune demo:
   `lab/scripts/intune/New-IntuneComplianceBaseline.ps1` (the runbook runs it
   just before the `enable_intune_vm` flip).
6. AWS (separate cloud, local, human): after the SAML + SCIM portal steps in `aws/README.md` (Order of operations, step 2) and once SCIM has created
   `App-AWS-IdentityCenter-Users` in Identity Center, `aws sso login` (profile with AWSSSOMasterAccountAdministrator +
   IAMFullAccess — the lab target is the management account) and apply `aws/` (see `aws/README.md`).
   It grants the group ViewOnlyAccess (PT4H) — the last AWS click-op becomes code.
7. Graduate CA policies one PR at a time by editing `lab.tfvars`.
8. Second `envs/bootstrap` apply with `log_analytics_workspace_id` (Entra logs
   flowing). A few hours later: `enable_sentinel = true` (starts the 31-day
   Sentinel trial), then `lab/scripts/monitoring/Deploy-Playbook.ps1` and set
   `sentinel_playbook_id`. After the trial: `enable_sentinel = false`,
   `enable_la_alerts = true`.
9. Senior-scope layers, one PR each, in the order and on the days of
   [`lab/docs/evidence-capture-plan.md`](../../docs/evidence-capture-plan.md)
   (every flag is `false` in `lab.tfvars`, so nothing starts early):
   `enable_evidence_store` (before Day 0) → `enable_itdr_detections` (before
   `enable_sentinel`: telemetry only, no trial) → `enable_identity_protection_ca`
   + `enable_phishing_resistant_all_users` (report-only) → the other CA
   additions, each report-only (`enable_registration_ca`,
   `enable_device_code_block`, `enable_admin_session_controls`,
   `enable_pim_auth_context`, `enable_protected_actions_ca`,
   `enable_shared_clinical_ca`) →
   `enable_pim_tiers` (+ `enable_helpdesk_au_scoping`,
   `enable_global_admin_pim_policy`; `enable_pim_azure_resources` is a human
   apply) → the `c1` switch for Tier 0 once CA021 is enforced (CA021
   `enabled` in one change; after `Set-AuthContextPolicies.ps1` reports it
   enabled, `ca021_enforced_in_tenant = true`; then
   `pim_tier0_auth_context_switchover_step1`, then
   `pim_tier0_activation_auth_context_id = "c1"`) → `enable_sso_apps` →
   `enable_scim_provisioning` (local seeding apply) → `aws_scim_job_enabled` →
   `enable_servicenow_sso` (once a ServiceNow developer instance exists) →
   the review tiers / `enable_b2b_governance` → `enable_nhi_governance` +
   `enable_agent_identity` → `enable_itdr_detections_v2` (+
   `vault_feed_v2_columns` with the vault feed change) →
   `enable_itdr_containment` (after `Deploy-ContainmentPlaybook.ps1`;
   `containment_on_alert_added` only if the Defender portal correlates ITDR
   alerts into older incidents) → `enable_pam_oidc_app` (with the PAM
   segment: guacamole-psm + CA022). After each: `Invoke-PostApply.ps1`. The
   evidence-store lock (`evidence_immutability_lock_acknowledged`) is its own
   PR at the end of the window.

---
