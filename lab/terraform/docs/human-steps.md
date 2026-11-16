# Human steps Terraform CANNOT do (portal / Microsoft Graph)

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 7 of 11


These require the portal or a Graph call **after** `apply`. They are either
unsupported by the providers or are consent/approval actions that must be
performed by a privileged human.

1. **Grant admin consent for the pipeline Graph app roles.**
   `azuread_app_role_assignment` assigns the Graph application permissions,
   but in some tenants the grant must be **confirmed as consented** by a
   Global Administrator / Privileged Role Administrator. Verify in
   *Entra admin center → App registrations → (apply app) → API permissions*
   that each role shows **“Granted for <tenant>.”** If not, click
   **“Grant admin consent.”**

2. **Directory-role PIM policies are Graph, not Terraform.** For most roles
   the design avoids them: each privileged role is held *actively* by an
   empty, role-assignable group, and the just-in-time control is that group's
   PIM-for-Groups activation policy, which the provider fully expresses
   (`azuread_group_role_management_policy`). Global Administrator is the
   exception (named, direct, expiring eligibility, [ADR 0020](../../docs/adr/0020-pim-activation-design.md)):
   azuread 3.10 has no directory-role policy resource, so `modules/pim`
   renders the rules (output `directory_role_pim_policies`) and
   `post-apply/Set-DirectoryRolePimPolicies.ps1` writes them. The CA021
   authentication context is the same pattern (`Set-AuthContextPolicies.ps1`).

3. **Make named people eligible members.** Who may activate is HR-dependent
   operational data, so it is set after HR provisioning by
   `lab/scripts/powershell/post-apply/Set-PimGroupEligibility.ps1` (named
   `adm-` accounts passed explicitly; 180-day Tier-0, 365-day Tier-1
   eligibility; it warns when a person is also in the tier's approver group)
   rather than in Terraform.

4. **Separation of duties and birthright.** The azuread provider exposes
   neither `incompatibleAccessPackages` nor automatic assignment policies.
   `post-apply/Set-AutoAssignmentPolicies.ps1` creates one HR-attribute
   automatic policy per birthright package (`lab/iga/birthright-rules.json`;
   needs **Identity Governance Administrator**), then
   `post-apply/Set-IncompatibleAccessPackages.ps1` writes the SoD links from
   `lab/iga/sod-rules.json` (SOD-01 to SOD-09), only on the requestable side,
   never on a birthright package, and `-Prune` removes the old
   Nurse → Pharmacy link. `Invoke-PostApply.ps1` runs them in that order
   (steps 5 and 6). `Set-AccessPackageSoD.ps1` is now only a forwarding shim.
   The Graph call underneath:
   ```
   POST /identityGovernance/entitlementManagement/accessPackages/{id}/incompatibleAccessPackages/$ref
   { "@odata.id": "https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/accessPackages/{otherId}" }
   ```

5. **Verify the custom domain.** Workforce UPNs (built by the HR provisioning
   script, `-UpnDomain`) need a domain the tenant has **verified** (TXT
   record) and, for the hybrid path, an AD UPN suffix. Break-glass accounts
   deliberately use the onmicrosoft.com domain and do not depend on it.

6. **Break-glass accounts — post-apply hardening.** Terraform seeds a random
   password (in state) and then ignores password drift. A password alone will
   not get these accounts in: Microsoft's mandatory MFA for the Azure, Entra,
   Intune and M365 admin portals (and Azure CLI / PowerShell / ARM writes)
   covers break-glass accounts too, with no opt-out, and the CA exclusion
   does not change that. After apply:
   - enable the **Passkey (FIDO2)** authentication method for
     Break-Glass-Admins - now scripted as desired state by
     `lab/scripts/powershell/post-apply/Set-AuthenticationMethodsPolicy.ps1`
     (device-bound, attested admin passkey profile; break-glass excluded from
     TAP / Authenticator / SMS / voice; PLAN by default, `-Apply` to write) -
     and register two FIDO2 security keys per account (a human step),
     kept in separate safes and not the method your daily admin uses
     (certificate-based auth instead, if you already run a PKI);
   - rotate the seeded password (state, which PR plans can read, keeps the
     old value) and keep the new one only as sealed physical copies in
     separate safes, as backup material, never the sole credential. If a
     digital copy is needed, use a separate vault that only the custodian
     can access and on which no workload or VM identity has a role - not
     `kv-idlab`, where the UAMI (*Secrets User*) and the DC's identity
     (*Secrets Officer*) hold data-plane roles. Both are ABAC-limited to named
     secrets, but a break-glass credential should not depend on a condition
     staying correct;
   - run `lab/scripts/powershell/01-Verify-Baseline.ps1` to prove the CA
     exclusions, keep `lab/kql/break-glass-signin.kql` alerting, and drill a
     sign-in to the Entra admin center with each key at least every 90 days.

   Sources: [emergency access accounts](https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access),
   [mandatory MFA](https://learn.microsoft.com/entra/identity/authentication/concept-mandatory-multifactor-authentication).

7. **Application-side SSO / SCIM.** AWS IAM Identity Center (SAML + staged
   SCIM), ServiceNow (PDI) SAML, the Clinical Portal (OIDC) and
   guacamole-psm are now **code** (`modules/apps`, behind `enable_sso_apps` /
   `enable_scim_provisioning` / `enable_servicenow_sso` /
   `enable_pam_oidc_app`). What stays human, in order, is in
   [`modules/apps/README.md`](../modules/apps/README.md) "Staged order":
   activating each SAML signing certificate (azuread cannot set
   `preferredTokenSigningKeyThumbprint`), the AWS console identity-source
   switch, putting the AWS SCIM token into Key Vault, the one local seeding
   apply, and the ServiceNow-side identity provider record. ServiceNow
   provisioning is designed, not built. The Okta coexistence is code on
   both sides (`enable_okta_federation` here, the human-applied `okta/`
   root there; ADR 0022); what stays human is minting the one client secret
   (output `okta_idp_client_secret_command`, bounded to 180 days) and
   entering it once as `TF_VAR_entra_client_secret`, granting admin consent
   on `okta-clinic-idp`, and the Okta API token in the applier's shell
   ([`okta/README.md`](../okta/README.md)). The AWS permission set +
   account assignment is code in the separate, human-applied `aws/` root.

8. **Remote-state storage account bootstrap** (see below) — created once,
   out-of-band, before `init` with the real backend.

9. **GitHub side of OIDC.** `envs/bootstrap` creates the Entra trust; copy its
   outputs into repo **Variables** (not secrets), create the `prod`
   environment with a required reviewer, and set the `TF_*` / `TFSTATE_*`
   variables listed in `lab/pipelines/README.md`. There are no repo secrets:
   the five privacy values (your IP, mailboxes, app owner ids) go to the
   pipeline config vault that `envs/bootstrap` creates
   (`enable_pipeline_config_vault`), and the workflows read them over OIDC.

10. **Lifecycle Workflows.** There is no azuread resource for them.
    `lab/scripts/powershell/post-apply/New-LifecycleWorkflows.ps1` creates the
    joiner and leaver workflows (by name, idempotent) after the governance
    apply.

11. **Intune tenant settings + compliance policy** (before and after
    `enable_intune_vm = true`). No provider resource covers the MDM user scope,
    and enrollment happens during the join at apply time, so set the scope and
    license the pilot user **before** the flip.
    `lab/scripts/intune/New-IntuneComplianceBaseline.ps1` creates and assigns
    the compliance policy. Full list and order: `lab/scripts/intune/README.md`.

12. **Switching access reviews off.** The provider suppresses the diff when
    `assignment_review_settings` is removed, so `enable_access_reviews = false`
    leaves the reviews on the policies. Turn them off in the portal
    (*ID Governance → Access packages → <package> → Policies → <policy> →
    Lifecycle → Require access reviews = No*).

13. **Tenant policy the providers cannot express.** Run in dependency order
    by `lab/scripts/powershell/post-apply/Invoke-PostApply.ps1` (dry run
    unless `-Execute`; the break-glass check is step 1 and a gate): the
    cloud-only `adm-` admin accounts and their Admin-Accounts membership, the
    authentication methods policy, the CA021 and CA023 authentication
    contexts, the CA011 Token Protection pilot, birthright automatic assignment, SoD links,
    Lifecycle Workflows, the Global Administrator PIM policy, PIM eligibility,
    the help-desk AU rule and the VIP restricted AU, standalone access reviews,
    the B2B connected organization and external collaboration settings, the
    app management + consent policies, the Entra Agent ID and, last and
    opt-in, converting the build account's standing Global Administrator to
    eligible. Each script is idempotent and has `-WhatIf` / PLAN mode. Order,
    scopes and modes: [`lab/scripts/powershell/README.md`](../../scripts/powershell/README.md).

14. **Microsoft-managed risk policy.** Before `enable_identity_protection_ca`,
    find Microsoft's managed "require risk remediation" Conditional Access
    policy (rolling into P2 tenants) and set it to report-only or Off by hand,
    so CA006 is the single user-risk policy while evidence is captured
    (`modules/conditional-access/main.tf` header, verify: MC1507808).

15. **Grants CI must never make.** A human Owner / User Access Administrator:
    applies `enable_pim_azure_resources` (the APPLY identity cannot write PIM
    role-management policies), grants the evidence-store writer role with the
    `evidence_writer_abac_condition` output, grants *Monitoring Metrics
    Publisher* on `dcr-idlab-vault-checkout` for the vault feed, and runs
    `lab/scripts/monitoring/Deploy-ContainmentPlaybook.ps1` (Graph app roles
    for the playbook's managed identity).

16. **Pipeline widening (bootstrap, human).** Before `enable_sso_apps`, re-apply
    `envs/bootstrap` with `enable_app_management_roles = true` (adds the Tier-0
    `AppRoleAssignment.ReadWrite.All` - record it in the risk register); once
    the P2 licences are assigned, `enable_identity_protection_logs = true` so
    the ITDR identity-risk rule has `AADUserRiskEvents` / `AADRiskyUsers`.

17. **ITDR portal steps.** Enable the Sentinel "Windows Security Events via
    AMA" connector before removing the DC01 rules from `itdr_exclude_rules`
    (verify: `SecurityEvent` via AMA needs Sentinel and the connector);
    create `ITDR-Containment-Approvers` and authorize the playbook's Teams
    connection after `Deploy-ContainmentPlaybook.ps1`; turn on the DC01
    audit subcategories the AD-plane rules read (Kerberos Service Ticket
    Operations, Security Group Management) and, for DCSync, a SACL on the
    domain's replication rights. Order and evidence:
    `lab/scripts/monitoring/README.md` and `lab/docs/evidence-capture-plan.md`.

---
