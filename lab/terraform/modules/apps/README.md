# modules/apps — SSO and provisioning as code

**No stand-in.** This module builds real Entra objects for the real AWS IAM
Identity Center connector and a ServiceNow developer instance, and a real
OIDC app registration.

**Status: BUILT** (AWS SAML + SCIM, ServiceNow SAML, ServiceNow
provisioning, Clinical Portal OIDC, guacamole-psm, okta-clinic-idp;
`validate` and 57 mocked `terraform test` runs pass, 2026-11-05). The AWS,
ServiceNow SAML and Okta stages were applied in the lab tenant on 2026-10-28
(`lab/docs/your-turn/07-apps-sso.md`, capture-log E22-E24, E57); what has run
live since is in `lab/evidence/capture-log.csv`. Statements below come from
`terraform validate`, the mocked `terraform test` in `tests/`, provider
source, Microsoft and AWS documentation, or a live Graph read (dated). Anything
not yet proven is marked *verify:*.

| # | What | Resources | Staging |
|---|---|---|---|
| 1 | **AWS IAM Identity Center, SAML.** Gallery app, SAML mode, assignment required, Identifier and Reply URL, an Entra-minted signing certificate, a claims-mapping policy (NameID plus ABAC session tags), and **one** assignment: `App-AWS-IdentityCenter-Users` | `azuread_application_from_template`, `azuread_service_principal` (`use_existing`), `azuread_application_identifier_uri`, `azuread_application_redirect_uris`, `azuread_service_principal_token_signing_certificate`, `azuread_claims_mapping_policy` + assignment, `azuread_app_role_assignment` | envs/dev `enable_sso_apps` |
| 2 | **AWS IAM Identity Center, SCIM.** Provisioning job, created **stopped**, and its credential from Key Vault | `azuread_synchronization_job`, `azuread_synchronization_secret` | envs/dev `enable_scim_provisioning`; the job starts only when `aws_scim_job_enabled` is set |
| 3 | **Contoso Clinical Portal, OIDC.** App roles Clinician, Pharmacist and Auditor; a `Clinical.Read` scope; a groups claim limited to app-assigned groups; assignment required; group-to-role grants | `azuread_application`, `azuread_application_identifier_uri`, `azuread_service_principal`, `azuread_app_role_assignment`, optional `azuread_application_pre_authorized` | envs/dev `enable_sso_apps` |
| 4 | **guacamole-psm, OIDC sign-in for the PSM stand-in** ([`guacamole.tf`](guacamole.tf)). Implicit **id_token only** (Guacamole 1.6's OpenID extension), no client secret, redirect `http://localhost:8081/guacamole/`, assignment required, **one** assignment: the new `PAM-Operators` group. Replaces the portal click-path in `lab/pam/README.md` §6 | `azuread_group`, `azuread_application`, `azuread_service_principal`, `azuread_app_role_assignment` (default access role) | envs/dev `enable_pam_oidc_app` (needs `enable_sso_apps`) |
| 5 | **ServiceNow, SAML** ([`servicenow.tf`](servicenow.tf)). Non-gallery SAML app with the settings Microsoft's ServiceNow tutorial documents, assignment required, an Entra-minted signing certificate, NameID = UPN, and **one** assignment: `App-ServiceNow-Users`. Accounts come from row 7 ([below](#servicenow-pdi-saml)) | `azuread_application_from_template` (non-gallery template), `azuread_service_principal` (`use_existing`), `azuread_application_identifier_uri`, `azuread_application_redirect_uris`, `azuread_service_principal_token_signing_certificate`, `azuread_claims_mapping_policy` + assignment, `azuread_app_role_assignment` | envs/dev `enable_servicenow_sso` (needs `enable_sso_apps` and `servicenow_instance_url`) |
| 6 | **okta-clinic-idp, OIDC: Entra as the identity provider for the acquired clinic's Okta org** ([`okta.tf`](okta.tf)). Single tenant, implicit grants off, **one** redirect URI (the Okta authorize callback on `okta_org_domain`, https by construction), the Graph scopes Okta asks for declared, assignment required, **one** assignment: `App-Okta-Federation-Users`. The client secret is NOT created: a human mints it post-apply, bounded to 180 days ([below](#okta-coexistence-entra-side)). The Okta half is the human-applied root [`../../okta`](../../okta/README.md) | `azuread_application`, `azuread_service_principal`, `azuread_app_role_assignment` (default access role) | envs/dev `enable_okta_federation` (needs `enable_sso_apps` and `okta_org_domain`); ADR 0022 |
| 7 | **ServiceNow provisioning** ([`servicenow_provisioning.tf`](servicenow_provisioning.tf)). A second app from the ServiceNow **gallery** template, provisioning only, hidden from My Apps, assignment required, **one** assignment: the SSO app's `App-ServiceNow-Users`. Its `ServiceNowOutDelta` job is created **stopped**; its credential (the ServiceNow integration user) comes from Key Vault and is written once by a local seeding apply ([below](#servicenow-provisioning)) | `azuread_application_from_template` (gallery template), `azuread_service_principal` (`use_existing`), `azuread_application_owner`, `azuread_application_redirect_uris`, `azuread_app_role_assignment`, `azuread_synchronization_job`, `azuread_synchronization_secret` | envs/dev `enable_servicenow_provisioning` (needs `enable_sso_apps`, `servicenow_instance_url`); the job starts only when `servicenow_provisioning_job_enabled` is set |
| 8 | **Contoso Claims Viewer, SAML: the app migrated off AD FS** ([`claims_viewer.tf`](claims_viewer.tf), [`../../../adfs`](../../../adfs/README.md)). Same identifier (`urn:contoso:claims-viewer`) and reply URL as the AD FS relying party. The AD FS claim rules converted: a claims-mapping policy (basic claim set off; rule 4's regex = `ExtractMailPrefix`) and two app roles assigned to the same AD groups (rules 3a/3b). Assignment required. BUILT, not applied | `azuread_application_from_template`, `azuread_application_app_role`, `azuread_service_principal` (`use_existing`), `azuread_application_identifier_uri`, `azuread_application_redirect_uris`, `azuread_service_principal_token_signing_certificate`, `azuread_claims_mapping_policy` + assignment, `azuread_app_role_assignment` x2 | envs/dev `enable_claims_viewer_app` (needs `enable_sso_apps` and the two group ids); ADR 0009 |

Provider: **azuread `~> 3.10`** (checked against 3.10.0 source and schema).
No other provider is used. App-role and scope ids are fixed GUIDs, and Entra
holds the signing certificate's private key.

---

## The design decisions, and why

- **Entra decides who reaches AWS. AWS decides what they get.** Each
  assignment on the AWS app does two jobs. It is the SSO gate, and it is the
  SCIM scope, because provisioning syncs assigned principals only.
  [`lab/terraform/aws`](../../aws/README.md) then grants each group a
  permission set. A new principal is deliberately a code change (a new SCIM
  scope and a new AWS principal), not one more list element: each is its own
  named resource. There are exactly two:
  - `aws_users`: App-AWS-IdentityCenter-Users, the staff path (access
    package, ViewOnlyAccess in AWS);
  - `aws_admins` (`enable_aws_admins_assignment`, ADR 0025):
    PIM-AWS-Lab-Admins, whose members are eligible-only. At rest the group
    is empty, so SCIM creates it empty in AWS and nobody can complete the
    SAML sign-in as an AWS admin. A member is copied to AWS only while a PIM
    activation lasts, and gets the LabAdministrator permission set there.
    Not a nested group (app assignment and SCIM do not expand nesting), not
    a direct user assignment (that would keep the admin account provisioned
    and able to sign in all the time).
- **`azuread_application_from_template`, not `azuread_application` with
  `template_id`.** The first resource manages nothing on the objects it
  creates, so Terraform can never strip the template's `User` and
  `msiam_access` app roles. Graph says not to modify or remove those.
- **The adopted service principal sets every attribute explicitly.** With
  `use_existing`, the provider PATCHes the whole object from config (read in
  the 3.10.0 source). An unset `app_role_assignment_required` would be sent as
  `false`, letting any user in the tenant get a token. An unset `tags` would be
  sent empty, and the app would drop out of Enterprise applications. Both are
  pinned, and the mocked test asserts both.
- **The Reply URL replaces the template's wildcard.** The template ships
  `https://*.signin.aws.amazon.com/platform/saml/acs/*`. After apply, Entra
  posts assertions only to this Identity Center instance. Wildcards are
  rejected at plan. List **every** ACS URL of the instance: on 2026-11-05 the
  first staff sign-in through the access portal failed with AADSTS50011
  because the portal's AuthnRequest names
  `https://us-east-1.signin.aws/platform/saml/acs/<id>` while only the
  console panel's `https://us-east-1.sso.signin.aws/...` was listed. To read
  the URL AWS really sends: open the access portal in a private window and
  decode the `SAMLRequest` it posts to `login.microsoftonline.com/<tenant>/saml2`
  (base64; `AssertionConsumerServiceURL` attribute).
- **Claims are code.** A claims-mapping policy supersedes the portal's
  *Attributes & Claims* blade, which becomes read-only. NameID is pinned to
  `userPrincipalName`, the value the connector's default mapping sends as the
  SCIM `userName`. If the two ever differ, every AWS sign-in fails. So the
  claims are protected from a well-meant portal edit.
- **ABAC comes from SAML, not SCIM.** `Department` is sent as
  `https://aws.amazon.com/SAML/Attributes/AccessControl:Department` on every
  sign-in. AWS documents that an attribute *removed* in Entra is not removed
  from the SCIM-synced user, so a SCIM-sourced tag can go stale. Sent per
  sign-in, a mover (Nursing → ICU) carries the new tag at their next AWS
  session.
- **The OIDC app's groups claim is `ApplicationGroup`.** Only groups assigned
  to the app are emitted. That keeps tokens small (no 200-group overage) and
  tells the app nothing about unrelated memberships.
- **Roles are user-only and fixed.** `allowed_member_types = ["User"]`, so
  there are no app-only (daemon) grants. Role ids are GUIDs that never change,
  because tokens and assignments key off them. Clinician and Pharmacist are
  the same separation-of-duties pair as the Nurse and Pharmacy access
  packages.
- **The implicit flow stays off.** Demos decode a real access token from the
  CLI instead (see *Demo* below).
- **Every app has a human owner.** The applying identity is always an owner,
  which `Application.ReadWrite.OwnedBy` requires, alongside
  `app_owner_object_ids`. A `check` warns on every plan without a human
  owner, and `nhi_inventory` exports owner and credential expiry for the NHI
  evidence pack. In the lab tenant (2026-11-05) the two accountable owners are
  named lab admins, the IAM Engineer and the Access Governance Lead (secret
  `TF_APP_OWNER_OBJECT_IDS`), so no app depends on one person; the build
  account is not an app owner.

---

## Staged order (tenant time)

Each stage is its own PR, so one reviewer sees one change.

| Stage | Who | What | Evidence to capture |
|---|---|---|---|
| 0 | done offline | Module, tests, wiring contract | `terraform test` output |
| 1 | PR → CI apply | `enable_sso_apps = true` (needs `enable_premium`). Creates both apps, the signing certificate, claims policy and assignments. The AWS app **cannot sign anyone in yet**: no Identifier, which fails closed. | Plan comment; Enterprise apps list |
| 1a | operator | **Activate the signing certificate**: run the `aws_saml_signing_cert_activation_command` output (`Update-MgServicePrincipal … -PreferredTokenSigningKeyThumbprint …`). azuread 3.10 cannot set `preferredTokenSigningKeyThumbprint`, and Graph requires it. | Screenshot of the active certificate |
| 2 | operator, AWS console | *IAM Identity Center → Settings → Identity source → Change identity source → External identity provider.* Copy the **Issuer URL**, **ACS URL(s)** and **access portal URL** from *Service provider metadata*. AWS shows them before you commit. | — |
| 2a | PR → CI apply | Set `aws_saml_entity_id`, `aws_saml_acs_urls` and `aws_access_portal_url` (`TF_VAR_`/`terraform.tfvars`; tenant values, never `lab.tfvars`). | Plan comment |
| 2b | operator, AWS console | Upload the Entra metadata from output `aws_federation_metadata_url` under *IdP SAML metadata*, type `ACCEPT`, then *Change identity source*. | AWS settings page |
| 3 | operator | Dana (a member of the App group): My Apps → AWS IAM Identity Center → access portal. Before SCIM, she must already exist in AWS. Either finish Stage 4 first, or create her by hand once and delete her afterwards. | SAML trace: NameID and `AccessControl:Department` |
| 4 | operator, AWS console | *Settings → Automatic provisioning → Enable.* Put the **SCIM endpoint** and **access token** straight into Key Vault: `az keyvault secret set --vault-name <kv> --name aws-scim-tenant-url …` and `--name aws-scim-token …`. AWS shows them once. | — |
| 4a | operator | Run the `aws_scim_template_lookup_command` output. Put the returned `id` in `aws_scim_template_id`. *verify:* the id. | Command output |
| 4b | operator, local apply | `enable_scim_provisioning = true`. Run the **seeding apply locally**, where the Key Vault firewall admits you (*SCIM credential* below). It creates the job, **stopped**, and writes the credential once. | Plan/apply log (token redacted) |
| 4c | operator, portal | *Provisioning → Test Connection*, then **Provision on demand** for Dana. *verify:* on-demand works while the job is stopped. | Provisioning log entry |
| 4d | PR → CI apply | `aws_scim_job_enabled = true`, which starts the ~40-minute cycle. | Provisioning logs; AWS Users "Created by SCIM" |
| 5 | operator | Apply [`lab/terraform/aws`](../../aws/README.md): the permission set on the SCIM-created group. | `aws sso-admin list-account-assignments` |
| 6 | operator | Leaver: `04-Leaver.ps1 -ProvisionOnDemandApps 'AWS IAM Identity Center'`. The name matches `aws_app_display_name`. | Leaver CSV; AWS user disabled |

---

## SCIM credential

The AWS token is a real credential. It is shown once and is valid for one
year (*verify:*). It is handled like this:

1. **System of record: Key Vault.** The secrets are `aws-scim-tenant-url` and
   `aws-scim-token`. Nothing goes in git, `lab.tfvars` or GitHub variables.
2. **Only the run that creates the credential reads it.**
   ```bash
   export TF_VAR_aws_scim_credentials="$(jq -n \
     --arg u "$(az keyvault secret show --vault-name <kv> --name aws-scim-tenant-url --query value -o tsv)" \
     --arg t "$(az keyvault secret show --vault-name <kv> --name aws-scim-token     --query value -o tsv)" \
     '{tenant_url:$u, secret_token:$t}')"
   export TF_VAR_require_scim_credentials=true
   # Keeps APPLY as the apps' Terraform owner during a local apply. Read it
   # first and stop if it is missing; -var wins over any value in tfvars.
   apply_id="$(terraform -chdir=../bootstrap output -raw github_oidc_apply_client_id)" && [ -n "$apply_id" ] \
     || { echo "no APPLY client id: init envs/bootstrap first" >&2; return 1 2>/dev/null || exit 1; }
   terraform apply -var-file=lab.tfvars -var="apply_client_id=$apply_id"   # in envs/dev, as the documented local deployment
   unset TF_VAR_aws_scim_credentials
   ```
   It runs locally because the Key Vault firewall admits only the operator IP
   and the private endpoint. GitHub-hosted runners cannot reach it, and the
   lab does not punch a hole for them.
3. **PR plans never see it.** The PLAN identity has no vault access, by
   design: anyone who can open a PR controls what a plan prints. A PR that
   turns SCIM on gets one *warning* (`check.scim_credential_supplied_on_create`).
4. **The gated apply fails closed.** With `require_scim_credentials = true`
   (wiring: set it in `terraform-apply.yml`), a run that would *create* the
   credential without a value fails its plan. The postcondition reads the
   planned value. After creation, that is the stored value, so later runs pass.
5. **Written once, then ignored.** `lifecycle { ignore_changes = [credential] }`.
   Graph never returns the token (it answers `*`), so routine plans need
   nothing.
6. **Rotation.** AWS allows two active tokens (*verify:*). Create a new one,
   update Key Vault, then
   `terraform apply -replace='module.apps[0].azuread_synchronization_secret.aws[0]'`
   with step 2's exports. Test Connection, then delete the old token in AWS.
7. **Residual risk, accepted for the lab.** The token is in Terraform state,
   marked sensitive. State is readable by the CI identities. That is the same
   accepted risk the root README records for the break-glass passwords.
   Revoking the token in AWS makes any copy useless.

---

## Signing-certificate rotation

`end_date` defaults to Entra's three years. Microsoft mails
`saml_cert_notification_emails` before expiry (*verify:* the 60/30/7-day
schedule). A rotation is a **coordinated change**, never a routine apply. A
plan that shows `-/+` on
`azuread_service_principal_token_signing_certificate.aws` means:

1. Merge in a window you control.
2. Activate the new certificate (Stage 1a command).
3. Re-upload `aws_federation_metadata_url` in AWS straight away. AWS trusts
   one IdP certificate (*verify:*), so sign-ins fail between steps 2 and 3.

---

## Graph permissions (wiring: `envs/bootstrap` / `modules/pipeline-identity`)

The APPLY identity today has **no `Application.*` write role**. Its comment
says "envs/dev creates no app registrations". This module changes that.

| Identity | Add | Why | Least privilege per Graph docs |
|---|---|---|---|
| APPLY | `Application.ReadWrite.OwnedBy` | Instantiate the template, SP settings, signing certificate, identifier and reply URLs, sync job, sync secret, claims-policy assignment. Reaches **only apps it owns**, which is why it is always an owner. | Yes for instantiate, sync job, secrets and provisionOnDemand. The provider docs list `Application.ReadWrite.All` for the sync job. *verify:* OwnedBy suffices on first run, and fall back to `Application.ReadWrite.All` if not. |
| APPLY | `Policy.ReadWrite.ApplicationConfiguration` | Create and update the claims-mapping policy | Yes |
| APPLY | `AppRoleAssignment.ReadWrite.All` + `Application.Read.All` | Group → app grants, and `prevent_duplicate_names` | Yes. **High privilege:** it can grant any app role, including Graph roles, so it is Tier 0 like `RoleManagement.ReadWrite.Directory`. Add it to the APPLY risk acceptance. The alternative is to assign groups by hand in a post-apply step and drop the permission. |
| PLAN | `Application.Read.All` | Refresh apps, SPs, assignments and templates | Yes |
| PLAN | `Synchronization.Read.All` | Refresh the sync job and secret metadata | *verify:* least-privileged read for `GET …/synchronization/jobs` and `/secrets` |

---

## Demo: see the roles and groups claims (optional flag)

With `clinical_portal_preauthorize_azure_cli = true` and a Clinician grant to
a group Dana is in:

```bash
az login --tenant <tenant> --allow-no-subscriptions        # as Dana
az account get-access-token --scope "$(terraform output -raw clinical_portal_identifier_uri)/Clinical.Read" \
  --query accessToken -o tsv | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null | jq '{aud, roles, groups, acct}'
```

Expected: `roles: ["Clinician"]`, `groups` = the assigned group's id only, and
`acct: 0`. An unassigned user gets `AADSTS50105` (*verify:* the code), because
assignment is required. *verify:* Azure CLI obtains tokens for a
pre-authorized third-party scope.

---

## ServiceNow (PDI) SAML

**BUILT, applied 2026-10-28** (`enable_servicenow_sso`, [`servicenow.tf`](servicenow.tf),
13 of the 23 mocked runs in `tests/servicenow.tftest.hcl`). The ServiceNow Personal
Developer Instance is free, and it is also where the PAM broker validates
change tickets at tenant time (`lab/pam/README.md` §5). Same shape as the AWS
app: one assignment, assignment required, an Entra-minted certificate,
claims as code.

**Non-gallery template, on purpose.** Microsoft publishes the non-gallery
template id in the Graph docs; neither the Learn ServiceNow tutorial nor the
Graph docs publish the ServiceNow *gallery* template id, so the SSO app was
built without it. The gallery id was read live later (2026-11-05,
[provisioning](#servicenow-provisioning)) and is used only by the separate
provisioning app: moving THIS app to the gallery would be a replacement (new
client id, certificate and ServiceNow IdP metadata) for no sign-in gain.

| Setting (Microsoft Learn, *ServiceNow SSO tutorial*) | Value |
|---|---|
| Identifier | `servicenow_instance_url`, e.g. `https://devNNNNN.service-now.com` (no trailing `/`) |
| Reply URL | `<instance>/navpage.do`, exactly one, no wildcard |
| Sign-on URL | `<instance>/login_with_sso.do?glide_sso_id=<sys_id>` once `servicenow_sso_sys_id` is set; `<instance>/navpage.do` before |
| NameID | `userPrincipalName`, format *unspecified* (claims-mapping policy) |
| Logout URL | not managed here (the provider exposes it only on `azuread_application`); sign-in does not need it |

Staged order (tenant time, after the AWS stages):

| Stage | Who | What | Evidence to capture |
|---|---|---|---|
| S1 | PR → CI apply | `enable_servicenow_sso = true`, with `servicenow_instance_url` in `terraform.tfvars` / `TF_VAR_` (never `lab.tfvars`) | Plan comment; Enterprise apps list |
| S1a | operator | Activate the signing certificate: output `servicenow_saml_signing_cert_activation_command` | Screenshot of the active certificate |
| S2 | operator, ServiceNow | Activate *Integration – Multiple Provider Single Sign-On Installer*; create a SAML identity provider by importing output `servicenow_federation_metadata_url`; NameID policy `urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`; *User Field* = `user_name` (ServiceNow `user_name` = Entra UPN, the lab's convention) | IdP record |
| S3 | PR → CI apply | `servicenow_sso_sys_id` = the IdP record's sys_id, so the My Apps tile signs in through it | Plan comment |
| S3a | operator, ServiceNow | The instance-wide switch `glide.authenticate.multisso.enabled = true` ([side door](#servicenow-side-door) first). A record made by API also lacks two things the form adds: *SSO Script* `MultiSSOv2_SAML2_custom`, and the **`idp_certificate`** row linking the record to the Entra signing certificate - the IdP's `x509_certificate` field alone is not read, and every response fails with "Unable to locate the SAML 2.0 Certificate" (syslog, 2026-11-05) | Table API read-back; syslog |
| S4 | operator | A member of `App-ServiceNow-Users` signs in from My Apps; a non-member is refused | SAML trace (NameID); sign-in log entries |

### ServiceNow side door

ServiceNow will not turn multi-provider SSO on (business rule *Check ACR and
SSO* aborts the property change) until at least one **Account Recovery**
user exists: a local account with the `sso_config_admin` role, a password
and multi-factor authentication, enrolled in `acr_user`
(`glide.sso.acr.enabled` is already true on a PDI). From then on **only
recovery users can sign in to the UI locally**, with password + authenticator
code; everyone else goes through Entra. Seen on dev459905, 2026-11-05: with
SSO on, the built-in `admin` gets "User name or password invalid" at
`login.do`; with SSO off the same password signs in.

| Account | What it is for | How it signs in |
|---|---|---|
| `acr.breakglass` | The UI side door if Entra or the IdP record breaks: `admin` + `sso_config_admin`, enrolled in Account Recovery | `login.do`, password + authenticator code. Both live in the operator's login Keychain only (`contoso-lab-servicenow-acr`, `-acr-totp`), never together in Key Vault, so one store never holds both factors |
| `admin` (built in) | Table API automation (basic auth) | API only while SSO is on. Do **not** enrol it in MFA: `glide.authenticate.multifactor.for_integrations = true` then refuses its basic auth (seen with `acr.breakglass`: 401) |
| `svc-entra-provisioning` | The provisioning connector ([below](#servicenow-provisioning)) | Web-service access only, never the UI |

Rotate `acr.breakglass` like a break-glass account: test it after every
change to the IdP record, re-pair its authenticator if the seed is exposed.

## ServiceNow provisioning

**RAN · tenant, 2026-11-05** (`enable_servicenow_provisioning`,
[`servicenow_provisioning.tf`](servicenow_provisioning.tf), 10 of the 23
mocked runs in `tests/servicenow.tftest.hcl`; capture-log E82, E83). Entra
creates the ServiceNow account, keeps it in step, and switches it off
(`active = false`, `locked_out = true`) when the person is disabled in Entra
or leaves the group (both seen live). Seen live: provision-on-demand created `test-user-a` (user_name =
her UPN, created by `svc-entra-provisioning`); she then signed in from the My
Apps tile through Entra and landed in that account; a non-member was refused
by Entra (AADSTS50105); a member disabled in Entra, and another removed from
the group, were each switched off in ServiceNow on the next on-demand run.

**Read live, not guessed** (2026-11-05, on a throwaway instance of the
template, deleted and purged afterwards):

| Graph read | Result |
|---|---|
| `GET /applicationTemplates?$filter=displayName eq 'ServiceNow'` | `0919fd62-4056-4151-83f7-7cfd3fade8e3`, publisher ServiceNow, provisioning type `sync` |
| `GET /servicePrincipals/{id}/synchronization/templates` | `ServiceNowOutDelta` (default; the connector Learn's tutorial configures) and `serviceNowScim` |
| …its metadata `Basic` | credential keys `InstanceName`, `UserName`, `Password` (secret) |
| …its User mapping | `user_name` ← `userPrincipalName` (matching), `active` ← `Switch([IsSoftDeleted], , "False", "1", "True", "0")` |
| `POST …/jobs/{id}/validateCredentials` with the integration user | 204 (Test Connection) |

**Why a second app.** The connector comes only with the gallery app, and the
SSO app is non-gallery. A provisioning-only gallery app, hidden from My Apps
(`HideApp`) and assigned to the **same** `App-ServiceNow-Users`, adds
accounts without touching the sign-in that works: one group decides both who
may sign in and who has an account. `user_name` ← `userPrincipalName` is the
same value as the SSO NameID, so the account provisioning creates is the
account the Entra sign-in lands in.

**The integration user.** `svc-entra-provisioning` on the instance: the
`admin` role, because Learn's tutorial requires "a user account in
ServiceNow with the admin role", and *Web service access only*, so it can
never sign in to the UI. It is not the instance's built-in `admin`.

**The credential, written once.** Same rules as the AWS token
([SCIM credential](#scim-credential)): Key Vault is the system of record
(`servicenow-provisioning-username`, `servicenow-provisioning-password`);
only the run that creates the credential reads it; PR plans only warn
(`check.servicenow_provisioning_credential_supplied_on_create`); the gated
apply (`require_scim_credentials = true`) fails closed instead of writing it
empty; `ignore_changes` afterwards; the password sits in state as
sensitive (accepted residual risk; revoke = reset it in ServiceNow).

**Order, and why the CI apply waits.** CI runners cannot reach the vault, so
the credential's creating run is local. After the PR merges:

1. The seeding apply, as the operator, in three targeted steps (a full
   local apply also tries to reconcile objects outside this change). The
   gallery app arrives with a Web redirect set, so the provider will only
   *update* `azuread_application_redirect_uris.servicenow_provisioning`
   after an import (the AWS gallery app needed the same, PR #59):
   ```bash
   cd lab/terraform/envs/dev
   # The values travel through a pipe only (never a command-line argument).
   export TF_VAR_servicenow_provisioning_credentials="$(
     { az keyvault secret show --vault-name <kv> --name servicenow-provisioning-username -o json
       az keyvault secret show --vault-name <kv> --name servicenow-provisioning-password -o json; } \
       | jq -cs '{user_name: .[0].value, password: .[1].value}')"
   # export hides a failed read: check what arrived, and stop if it is not both values.
   [ "$(printf '%s' "$TF_VAR_servicenow_provisioning_credentials" | jq -r '(.user_name // "" | length) > 0 and (.password // "" | length) >= 16')" = true ] \
     || { echo "Key Vault read failed: no seeding" >&2; unset TF_VAR_servicenow_provisioning_credentials; return 1 2>/dev/null || exit 1; }
   export TF_VAR_require_scim_credentials=true
   apply_id="$(terraform -chdir=../bootstrap output -raw github_oidc_apply_client_id)" && [ -n "$apply_id" ] \
     || { echo "no APPLY client id: init envs/bootstrap first" >&2; return 1 2>/dev/null || exit 1; }
   # a) everything except the reply URL: app, SP, owner, assignment, job, credential.
   #    The job stays STOPPED here whatever lab.tfvars says (it says "started"
   #    since E83): Test Connection and on-demand come first (step 3).
   terraform apply -var-file=lab.tfvars -var="apply_client_id=$apply_id" -var=servicenow_provisioning_job_enabled=false \
     -target='module.apps[0].azuread_synchronization_secret.servicenow[0]' \
     -target='module.apps[0].azuread_app_role_assignment.servicenow_provisioning_users[0]' \
     -target='module.apps[0].azuread_application_owner.servicenow_provisioning[0]'
   # b) adopt the template's Web redirect set. A targeted apply does not write
   #    new root outputs yet, so the id comes from state (the output
   #    servicenow_provisioning_reply_url_import_id holds the same value after
   #    the next full apply).
   import_id="$(terraform state show -no-color 'module.apps[0].azuread_application_from_template.servicenow_provisioning[0]' \
     | awk -F'"' '/^ *application_id *=/{print $2 "/redirectUris/Web"}')" && [ -n "$import_id" ] \
     || { echo "no import id: step a did not create the app" >&2; return 1 2>/dev/null || exit 1; }
   terraform import -var-file=lab.tfvars -var="apply_client_id=$apply_id" -var=servicenow_provisioning_job_enabled=false \
     'module.apps[0].azuread_application_redirect_uris.servicenow_provisioning[0]' "$import_id"
   # c) replace the wildcard with the instance's one URL (an in-place update)
   terraform apply -var-file=lab.tfvars -var="apply_client_id=$apply_id" -var=servicenow_provisioning_job_enabled=false \
     -target='module.apps[0].azuread_application_redirect_uris.servicenow_provisioning[0]'
   unset TF_VAR_servicenow_provisioning_credentials
   ```
   Step a's plan must show only the provisioning objects (6 to add: app,
   service principal, owner, assignment, job, credential) and step c's only
   the reply-URL update (1 to change).
2. Then approve the CI apply. One that ran before step 1 failed its plan on
   the credential postcondition and changed nothing: re-run it. On a rebuild
   (job already `true` in `lab.tfvars`), that CI apply starts the job, so do
   step 3 before approving it.
3. Test Connection (`validateCredentials`), then provision on demand one
   member of `App-ServiceNow-Users` and read the ServiceNow `sys_user` back.
   Read the job schema back too: `user_name` ← `userPrincipalName` matching.
4. A separate PR sets `servicenow_provisioning_job_enabled = true` (the
   ~40-minute cycle), as `aws_scim_job_enabled` did for AWS (done after E82
   and E83).

**First-run notes (2026-11-05).** The provision-on-demand for a member is
skipped as *NotEffectivelyEntitled* when that person is not (or no longer) in
`App-ServiceNow-Users`: check membership before reading anything else into
it. The CI apply after the seeding showed no change to any provisioning
object.

The APPLY identity owns the provisioning app's registration through
`azuread_application_owner`: an app-only instantiate records no owner (seen
on the probe), and without it the pipeline (`Application.ReadWrite.OwnedBy`)
could not keep the reply URL. The gallery's wildcard reply URL
(`https://*.service-now.com/*`) is replaced by the instance's one URL.

A PDI hibernates when idle and is reclaimed after a period of inactivity
(*verify:* the current policy). Nothing in CI calls the instance: the
pipeline only manages the Entra side.

---

## ServiceNow access fulfilment

**BUILT** (`enable_servicenow_fulfilment`, [`servicenow_fulfilment.tf`](servicenow_fulfilment.tf),
3 mocked runs in `tests/servicenow_fulfilment.tftest.hcl`). The same design
**RAN · tenant** on 2026-11-07 with a throwaway twin of this app, deleted
after the proof (capture-log E170-E172; [`lab/servicenow`](../../../servicenow/README.md)).

ServiceNow asks Entra ID Governance to add or remove a person on a Clinical
access package after the manager approved in ServiceNow. The app:

| Property | Value | Why |
|---|---|---|
| Graph API permissions | **none** | the Graph reference lets an app-only caller hold an entitlement-management role *instead of* `EntitlementManagement.ReadWrite.All` |
| Role | *Access package assignment manager* (`e2182095-...`) on the Clinical catalog only | add / remove people on existing packages; cannot edit packages, policies or groups |
| Credential | certificate, public half in [`files/servicenow-fulfilment.pem`](files/servicenow-fulfilment.pem) | no client secret anywhere; the private key exists only in the instance's key store |
| Sign-in | assignment required, hidden | an app-only client: no user gets a token for it |

**Replication wait.** The catalog role assignment waits 90 s after the
service principal is created (`time_sleep`, keyed to the SP's object id):
entitlement management refused it with *SubjectNotFound* when it came right
after the SP (catch-up apply run 42512070374, 2026-11-08).

Residual risk: the role spans the whole Clinical catalog (Pharmacy included).
Entra still enforces incompatible packages (seen live: an ICU nurse was
refused Pharmacy), every request carries the ServiceNow ticket number, and
requestable packages expire. Rotation: `lab/servicenow/fulfilment-cert.py`
then a PR.

## Validation status (offline only)

| Check | Result |
|---|---|
| `terraform fmt -check -recursive` | clean |
| `terraform init -backend=false` + `validate` (HashiCorp Terraform 1.16.5, azuread 3.10.0) | **Success** |
| `terraform test` (`tests/apps.tftest.hcl` + `tests/servicenow.tftest.hcl` + `tests/okta.tftest.hcl`, mocked azuread) | **57 passed, 0 failed** (19 + 23 + 15): plan runs plus six mocked applies that exercise the provider's own id parsing (2026-11-05, HashiCorp Terraform 1.16.5; 46 on 2026-10-26 before ServiceNow provisioning) |
| Checkov 3.3.20 (`-d modules/apps`) | 0 failed infrastructure checks. The secret scan (CKV_SECRET_6) flags the lines holding the synthetic test credentials (`tests/apps.tftest.hcl` AWS token since 2026-10-26, `tests/servicenow.tftest.hcl` integration user, 2026-11-05): mocked-test strings, no real secret |

The tests pin:

- one assignment, to the App group;
- assignment required, SAML mode and the enterprise tag kept;
- wrong gallery template refused;
- wildcard reply URL refused;
- NameID and Department claims present;
- exactly three user-only roles;
- `ApplicationGroup` groups claim, implicit flow off;
- grants map to the fixed role ids, and an unknown role is refused;
- no SCIM objects unless enabled;
- the job is created stopped;
- a template id is required;
- an empty token fails the gated apply and only warns in a PR plan;
- a malformed SCIM endpoint is refused;
- guacamole-psm is absent by default; when on it issues id tokens only, is
  single tenant, requires assignment, is assigned only to PAM-Operators, and a
  plain-http non-localhost redirect is refused;
- ServiceNow is absent by default; when on it plans the app, the service
  principal (SAML, assignment required), one assignment and the certificate;
  the sign-on URL uses the IdP `sys_id`; the claims policy can be turned off;
  the flag without an instance URL or without the group fails the plan; a
  wildcard, trailing-slash, path or Reply-URL, non-ServiceNow or plain-http
  instance URL and a malformed `sys_id` are refused; the assignment prefers
  the app's `User` role.
- ServiceNow provisioning is absent by default; when on it plans the gallery
  app (the template id read from Graph), a hidden service principal with
  assignment required, APPLY as owner of the registration, the instance's one
  reply URL instead of the wildcard, one assignment to the SSO app's group,
  the `ServiceNowOutDelta` job stopped, and exactly the credential keys
  `InstanceName` (the URL's host label), `UserName`, `Password`; an empty
  credential fails the gated apply and only warns in a PR plan; the flag
  without an instance URL or group fails the plan; a short password or an odd
  user name is refused; the job can be started; the assignment falls back to
  the gallery `User` role, never default access.
- okta-clinic-idp is absent by default; when on it plans one app (single
  tenant, implicit grants off, exactly the delegated Graph scopes Okta asks
  for), one service principal (assignment required), one assignment to
  App-Okta-Federation-Users and one redirect URI, the Okta authorize
  callback; the ITSM reference is stamped; the flag without an org host or
  without the group fails the plan; a scheme, path, wildcard, non-Okta host,
  look-alike suffix or `-admin` host is refused and preview / EMEA cells are
  accepted; a secret lifetime over 180 days is refused; the mocked apply
  builds the ids, the bounded secret-minting command and the NHI row from
  the applied values.

**guacamole-psm at tenant time:** apply with `enable_pam_oidc_app = true`, add
the operators to `PAM-Operators` (and to `CA008-Pilot-PhishingResistant`, so
the PSM sign-in needs a phishing-resistant method while CA008 runs in pilot
scope), put output `guacamole_psm_client_id` in `lab/pam/.env` as
`OIDC_CLIENT_ID`, then follow `lab/pam/README.md` §6 from step 3. Evidence: an
operator's Entra sign-in log entry for `guacamole-psm` (CA result + method),
a refused sign-in by a non-operator (AADSTS50105, *verify:* code), and the
Guacamole History row naming the UPN. The same flag also creates **CA022** in
`modules/conditional-access` (`admins.tf`, report-only first): guacamole-psm
and the admin portals need the admin phishing-resistant authentication
strength, so a PSM session always starts with phishing-resistant MFA.

---

## Tenant-time verify list

- [ ] Template `21ed01d2-ec13-4e9e-86c1-cd546719ebc4` resolves to *AWS IAM Identity Center (successor to AWS Single Sign-On)*, so the plan passes the postcondition.
- [ ] The instantiated SP carries roles `User` / `msiam_access` and tag `WindowsAzureActiveDirectoryIntegratedApp`. A second `terraform plan` shows **No changes**.
- [ ] Certificate activated. The federation metadata carries the new thumbprint.
- [ ] A SAML trace of Dana shows NameID = UPN (record the NameID format) and `AccessControl:Department`. The portal blade shows claims as policy-managed (read-only).
- [ ] An unassigned user is refused at the AWS tile: assignment required works.
- [ ] Sync template id recorded. Test Connection passes. Provision on demand (Dana) succeeds while the job is stopped.
- [ ] After `aws_scim_job_enabled`, the provisioning logs show the group and members created. AWS lists them as *Created by SCIM*.
- [ ] `ExternalIds` on the AWS group = the Entra group object id. This enables the `entra_group_object_id` pin in `lab/terraform/aws`.
- [ ] `Application.ReadWrite.OwnedBy` was enough for the sync job (else record the fallback).
- [ ] Leaver: Dana is out of the App group, deprovisioned on demand, and gone from the AWS portal.
- [ ] OIDC: the token shows `roles`, `groups` (app groups only) and `acct`.
- [ ] ServiceNow: the identifier URI is accepted (the SP is already in SAML mode; identifier-URI policy); the instantiated roles include `User`; NameID value and format as ServiceNow receives them; a non-member is refused at the tile.
- [x] ServiceNow provisioning (2026-11-05, E82/E83): the seeding plan shows only the provisioning objects; Test Connection passes; the job schema keeps `user_name` ← `userPrincipalName` as the matching rule; provision on demand of a member creates a `sys_user` whose `user_name` = UPN, and that person's Entra sign-in lands in it; a member **disabled in Entra**, and a member **removed from App-ServiceNow-Users**, are each set `active = false` on the next on-demand run; the CI apply after the seeding changed **no provisioning object** (its plan had other slices' changes, so it was not "No changes").
- [x] ServiceNow provisioning cycle (2026-11-05, E84): after `servicenow_provisioning_job_enabled`, the first full cycle created the other members (Sofia Reyes, Marcus Bello, Grace Mwangi, Test User C) and the group membership without errors.
- [ ] okta-clinic-idp: admin consent on the four delegated Graph scopes is accepted and no clinic user sees a consent prompt; `Add-MgApplicationPassword` with `Application.ReadWrite.OwnedBy` is enough for an owner (else record the fallback); a non-member of App-Okta-Federation-Users is refused by Entra before Okta sees them (record the AADSTS code); the Entra sign-in log row for `okta-clinic-idp` shows the CA result; the redirect URI equals the Okta root's `okta_callback_uri`.

---

## Okta coexistence (Entra side)

**BUILT, flag off** (`enable_okta_federation`, [`okta.tf`](okta.tf), 15
mocked runs in `tests/okta.tftest.hcl`; [ADR 0022](../../../docs/adr/0022-okta-coexistence-as-code.md)).
This is Phase 1 of [`lab/docs/okta-migration-runbook.md`](../../../docs/okta-migration-runbook.md)
("Okta trusts Entra") as code: the acquired clinic keeps its Okta org for the
apps that have not moved yet, its users sign in at Entra (so Conditional
Access applies), and Okta accepts the Entra identity through this app. The
Okta half (the identity provider, the routing rule, `Clinic-Staff`, the legacy
app) is the separate, human-applied root [`lab/terraform/okta`](../../okta/README.md),
applied **after** this one. **Nothing has been applied: no tenant and no Okta
org exist.**

| Setting (runbook Phase 1, step 1 and 4) | Value |
|---|---|
| App registration | `okta-clinic-idp` (`okta_idp_app_display_name`), single tenant, Web platform, implicit grants off |
| Redirect URI | `https://<okta_org_domain>/oauth2/v1/authorize/callback`, exactly one; `okta_org_domain` is the bare org host (`*.okta.com`, `*.oktapreview.com`, `*.okta-emea.com`; Integrator Free orgs are `integrator-NNNNNNN.okta.com`), never the `-admin` host |
| API permissions (declared, consent is human) | Microsoft Graph delegated `openid`, `profile`, `email`, `User.Read` (*verify:* Okta's current list for a generic OIDC IdP) |
| Enterprise app | assignment required; **one** assignment: `App-Okta-Federation-Users` (`okta_federation_users_group_object_id`, from `modules/groups`) |
| Client secret | **not created by Terraform.** Output `okta_idp_client_secret_command` mints one with `Add-MgApplicationPassword`, bounded to `okta_idp_secret_lifetime_days` (default and maximum 180: the `P180D` rotation in `lab/iga/nhi-secrets-register.json`), and prints it once for `TF_VAR_entra_client_secret` in the Okta root |
| Hand-off to the Okta root | outputs `okta_idp_client_id` and `okta_idp_endpoints` (the tenant's v1.0 issuer, authorize, token and JWKS - v1.0 because only its ID token carries the `amr` Okta's trust claims reads; no userinfo, which refuses v1.0 tokens; the app adds the `email` optional claim to that ID token) |
| NHI inventory row | `okta_clinic_idp`: credential type *client-secret, human-minted, bounded*, no outbound secret |

**Why there is no `okta_idp_secret_mode = "keyvault"`.** It was considered and
not built, because it does not fit the lab's Key Vault: an
`azuread_application_password` puts the secret value in `envs/dev` state,
which the PLAN identity can read (`lab/pipelines/README.md`); the
`modules/keyvault` module takes no secret input (only the names its UAMI may
read), its writers are human Secrets Officers by design, the CI APPLY identity
holds no data-plane role on the vault, the vault sits behind a private
endpoint with a deny-by-default firewall a hosted runner cannot reach, and
this module declares `azuread` only. So the secret follows the runbook: one
human, one bounded secret, entered once into Okta, deleted with the app in
Phase 4. (`okta.tf` header.)

Staged order (tenant time, after `enable_sso_apps`):

| Stage | Who | What | Evidence to capture |
|---|---|---|---|
| O1 | PR → CI apply | `enable_okta_federation = true`, with `okta_org_domain` in `terraform.tfvars` / `TF_VAR_` (never `lab.tfvars`) | Plan comment; the app and its one assignment in Enterprise applications |
| O1a | operator (Tier 0) | Grant admin consent on `okta-clinic-idp` (Enterprise applications → Permissions), so no clinic user is prompted | Screenshot of the granted delegated permissions |
| O1b | operator | Run output `okta_idp_client_secret_command`; keep the value only in the shell that applies the Okta root (`read -s`) | The secret's `displayName` and `endDateTime` in the app's Certificates & secrets (never the value) |
| O2 | operator, Okta | Apply [`lab/terraform/okta`](../../okta/README.md) with `enable_entra_federation = true`: `entra_client_id` = output `okta_idp_client_id`, `entra_tenant_id` from `okta_idp_endpoints`, the secret as `TF_VAR_entra_client_secret` | The Okta root's plan; outputs `entra_idp_id`, `routing_rule_id` |
| O3 | operator | Cross-check: `terraform output -raw okta_idp_redirect_uri` here equals `terraform -chdir=../../okta output -raw okta_callback_uri` | The two strings side by side |
| O4 | operator | Runbook Phase 1 *Validate*: a member of `App-Okta-Federation-Users` with a clinic login signs in to Okta and is sent to Entra; a non-member is refused at Entra | Entra sign-in log row for `okta-clinic-idp` with the CA result; Okta System Log IdP event |
| O5 | operator | Runbook Phase 1 *Rollback* rehearsal: `routing_rule_active = false` in the Okta root, timed, then back | The timed rollback in the evidence log |

## Clinic Lab Results (Okta -> Entra, wave 1)

`clinic_results.tf`, flag `enable_clinic_results_app` (envs/dev, same name).
The first app the acquired clinic moves **off Okta** (runbook Phase 2; the
tracker and the cut-over tools are in [`lab/okta-migration/`](../../../okta-migration/README.md)).

| Object | Value | Why |
|---|---|---|
| App registration | `Clinic Lab Results`, single tenant, **public client**, one loopback redirect `http://localhost:8471/callback`, no fallback public-client flows | The app is a workstation viewer: auth code + PKCE, no secret, the same shape it had in Okta (a native app) |
| Delegated Graph | `openid`, `profile`, `email` | Sign-in only; the app calls no API |
| Enterprise app | assignment required | No assignment, no token (AADSTS50105) |
| Group | `App-ClinicResults-Users`, **assigned**, member drift ignored | Not a copy of Okta's `Clinic-Staff`: its rule (login domain) means every hospital user after the acquisition |
| Assignment | the group, default access role, the only one | One principal per app, as everywhere in this module |
| Conditional Access | CA061 (modules/conditional-access `clinical.tf`): MFA strength + sign-in every 8 h, the group only, break-glass excluded; **enforced** (lab.tfvars) | The Okta policy it replaces was "two factors, re-authenticate after 8 hours", already enforced |
| API (the CA061 target) | `Clinic Lab Results API`: `api://<client id>`, one delegated scope `Results.Read`, v2 tokens, assignment required (same group), the client pre-authorized; hidden from My Apps | Conditional Access cannot target a public client (Graph 1034 `PublicClientsAreUnsupported`, run 42512070374). Learn: CA "is applied when a client calls a service". The client requests `Results.Read` at sign-in, so CA061 is evaluated on the API token |

Post-apply, as the operator (`lab/okta-migration/cutover.mjs prestage` does
both and reads them back): admin consent on the three delegated scopes
(`oauth2PermissionGrants`, AllPrincipals), and the pilot user(s) added to
`App-ClinicResults-Users`.

## Inputs, outputs and resources

The lists below are made by `terraform-docs`. Do not edit them by hand. Run [`tools/module-docs.sh`](../../tools/module-docs.sh).

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.6.0 |
| azuread | ~> 3.10 |
| time | ~> 0.13 |

### Providers

| Name | Version |
| ---- | ------- |
| azuread | ~> 3.10 |
| time | ~> 0.13 |

### Resources

| Name | Type |
| ---- | ---- |
| [azuread_access_package_catalog_role_assignment.servicenow_fulfilment](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/access_package_catalog_role_assignment) | resource |
| [azuread_app_role_assignment.aws_admins](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.aws_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.clinic_results_api_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.clinic_results_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.clinical_portal](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.guacamole_pam_operators](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.okta_federation_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.servicenow_provisioning_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_app_role_assignment.servicenow_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment) | resource |
| [azuread_application.clinic_results](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.clinic_results_api](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.clinical_portal](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.guacamole_psm](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.okta_idp](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application.servicenow_fulfilment](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application) | resource |
| [azuread_application_app_role.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_app_role) | resource |
| [azuread_application_certificate.servicenow_fulfilment](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_certificate) | resource |
| [azuread_application_from_template.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_from_template) | resource |
| [azuread_application_from_template.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_from_template) | resource |
| [azuread_application_from_template.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_from_template) | resource |
| [azuread_application_from_template.servicenow_provisioning](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_from_template) | resource |
| [azuread_application_identifier_uri.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_identifier_uri) | resource |
| [azuread_application_identifier_uri.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_identifier_uri) | resource |
| [azuread_application_identifier_uri.clinic_results_api](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_identifier_uri) | resource |
| [azuread_application_identifier_uri.clinical_portal](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_identifier_uri) | resource |
| [azuread_application_identifier_uri.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_identifier_uri) | resource |
| [azuread_application_owner.servicenow_provisioning](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_owner) | resource |
| [azuread_application_pre_authorized.azure_cli](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_pre_authorized) | resource |
| [azuread_application_pre_authorized.clinic_results_client](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_pre_authorized) | resource |
| [azuread_application_redirect_uris.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_redirect_uris) | resource |
| [azuread_application_redirect_uris.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_redirect_uris) | resource |
| [azuread_application_redirect_uris.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_redirect_uris) | resource |
| [azuread_application_redirect_uris.servicenow_provisioning](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_redirect_uris) | resource |
| [azuread_claims_mapping_policy.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/claims_mapping_policy) | resource |
| [azuread_claims_mapping_policy.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/claims_mapping_policy) | resource |
| [azuread_claims_mapping_policy.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/claims_mapping_policy) | resource |
| [azuread_group.clinic_results_users](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_group.pam_operators](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group) | resource |
| [azuread_service_principal.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.clinic_results](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.clinic_results_api](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.clinical_portal](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.guacamole_psm](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.okta_idp](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.servicenow_fulfilment](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal.servicenow_provisioning](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal) | resource |
| [azuread_service_principal_claims_mapping_policy_assignment.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal_claims_mapping_policy_assignment) | resource |
| [azuread_service_principal_claims_mapping_policy_assignment.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal_claims_mapping_policy_assignment) | resource |
| [azuread_service_principal_claims_mapping_policy_assignment.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal_claims_mapping_policy_assignment) | resource |
| [azuread_service_principal_token_signing_certificate.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal_token_signing_certificate) | resource |
| [azuread_service_principal_token_signing_certificate.claims_viewer](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal_token_signing_certificate) | resource |
| [azuread_service_principal_token_signing_certificate.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal_token_signing_certificate) | resource |
| [azuread_synchronization_job.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/synchronization_job) | resource |
| [azuread_synchronization_job.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/synchronization_job) | resource |
| [azuread_synchronization_secret.aws](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/synchronization_secret) | resource |
| [azuread_synchronization_secret.servicenow](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/synchronization_secret) | resource |
| [time_sleep.clinic_results_api_sp_replication](https://registry.terraform.io/providers/hashicorp/time/latest/docs/resources/sleep) | resource |
| [time_sleep.servicenow_fulfilment_sp_replication](https://registry.terraform.io/providers/hashicorp/time/latest/docs/resources/sleep) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| aws\_users\_group\_object\_id | Object id of App-AWS-IdentityCenter-Users (modules/groups output<br/>app\_access\_group\_object\_ids["aws"]). The STAFF principal on the AWS<br/>enterprise app (ViewOnlyAccess in AWS). Assignment is the access decision<br/>AND the SCIM scope: the provisioning service syncs assigned users/groups<br/>only. The one other principal the module allows is the PIM admin group<br/>(enable\_aws\_admins\_assignment, ADR 0025); there is no list of extras. | `string` | n/a | yes |
| app\_owner\_object\_ids | Entra USER object ids recorded as owners of both apps (app registration +<br/>enterprise app). Every non-human identity needs an accountable human owner:<br/>it is who the NHI inventory, credential-expiry mail and access reviews<br/>route to. The identity running Terraform is always added as well (it must<br/>stay an owner to manage the apps with Application.ReadWrite.OwnedBy).<br/>ADR 0018 / nhi-standard N1: at least TWO people (a named owner plus a<br/>backup); fewer and a check warns on every plan.<br/>Sensitive: these are named people's object ids, and the PR plan comment<br/>is public (GitHub masks a secret only as one whole string, never each id<br/>of a JSON list, and never in a comment). | `list(string)` | `[]` | no |
| aws\_abac\_session\_tags | AWS session tags sent in the SAML assertion as<br/>https://aws.amazon.com/SAML/Attributes/AccessControl:<key>, keyed by tag<br/>key, valued by the Entra user attribute (claims-mapping "ID") that feeds<br/>it. Default: Department <- user.department, the attribute HR already<br/>drives, so a mover (Nursing -> ICU) gets a different tag at the next AWS<br/>sign-in with no AWS-side change. SAML (per sign-in) rather than SCIM is<br/>deliberate: AWS documents that an attribute REMOVED in Entra is not removed<br/>from the SCIM-synced user, so a SCIM-sourced tag can go stale. Needs<br/>"Attributes for access control" enabled in Identity Center (tenant-time<br/>step). Empty map = no session tags. | `map(string)` | <pre>{<br/>  "Department": "department"<br/>}</pre> | no |
| aws\_access\_portal\_url | AWS access portal sign-in URL (https://d-xxxxxxxxxx.awsapps.com/start, or<br/>the custom alias). Becomes the enterprise app's Sign-on URL so the My Apps<br/>tile starts an SP-initiated sign-in. Empty = My Apps uses IdP-initiated. | `string` | `""` | no |
| aws\_admins\_group\_object\_id | Object id of PIM-AWS-Lab-Admins (modules/pim output<br/>aws\_admin\_group\_object\_id). Only read when enable\_aws\_admins\_assignment.<br/>Its members are ELIGIBLE-only, so at rest it holds nobody: SCIM creates<br/>the group in AWS empty, and copies a member only while their PIM<br/>activation lasts. It must never be App-AWS-IdentityCenter-Users (that<br/>would hand the staff group the admin permission set). | `string` | `""` | no |
| aws\_app\_display\_name | Display name of the AWS enterprise app. Keep "AWS IAM Identity Center":<br/>lab/scripts/powershell/04-Leaver.ps1 -ProvisionOnDemandApps finds the app<br/>by this exact name, and the walkthrough video and runbooks use it. | `string` | `"AWS IAM Identity Center"` | no |
| aws\_gallery\_template\_id | Entra application-gallery template id for "AWS IAM Identity Center<br/>(successor to AWS Single Sign-On)". Microsoft Graph documents<br/>21ed01d2-ec13-4e9e-86c1-cd546719ebc4 (learn.microsoft.com/graph/<br/>application-saml-sso-configure-api, checked 2026-10-20). The plan reads the<br/>template back and fails if its name is not AWS IAM Identity Center, so a<br/>wrong id can never instantiate some other vendor's app. | `string` | `"21ed01d2-ec13-4e9e-86c1-cd546719ebc4"` | no |
| aws\_saml\_acs\_urls | Reply URL(s) (Assertion Consumer Service) for THIS Identity Center<br/>instance, pattern https://<host>/platform/saml/acs/<id>. List every ACS<br/>URL AWS uses, not only the first one its console shows: the same <id><br/>appears on more than one host (IPv4 and dual-stack variants are separate<br/>URLs), and Entra refuses a sign-in whose AuthnRequest names an ACS URL<br/>that is not listed (AADSTS50011). Read live on 2026-11-05: the console<br/>panel showed https://us-east-1.sso.signin.aws/platform/saml/acs/<id>, but<br/>the AuthnRequest the access portal sends names<br/>https://us-east-1.signin.aws/platform/saml/acs/<id> - so the lab lists<br/>both. Replaces the gallery template's wildcard reply URL, so assertions<br/>can only be posted to THIS instance. Empty = not managed yet. | `list(string)` | `[]` | no |
| aws\_saml\_claims\_policy\_enabled | Assign a claims-mapping policy to the AWS app: NameID pinned to<br/>userPrincipalName (must equal the SCIM userName, or sign-in fails) plus<br/>the ABAC session tags in aws\_abac\_session\_tags. A claims-mapping policy<br/>SUPERSEDES the portal's "Attributes & Claims" blade, which turns read-only:<br/>claims become reviewed code instead of a click anyone with Application<br/>Administrator can change. false = the gallery app's default claims<br/>(the documented fallback if the first sign-in shows a NameID problem). | `bool` | `true` | no |
| aws\_saml\_entity\_id | Identifier (Entity ID) = the IAM Identity Center "Issuer URL", shown on<br/>AWS Settings -> Identity source -> Change identity source -> External<br/>identity provider -> Service provider metadata (pattern<br/>https://<region>.signin.aws.amazon.com/platform/saml/<id>). AWS shows it<br/>BEFORE the change is committed, so it can be set first. Empty (default) =<br/>not managed yet: the app exists but cannot complete a SAML sign-in.<br/>Not a secret, but tenant-specific: terraform.tfvars / TF\_VAR\_, never lab.tfvars. | `string` | `""` | no |
| aws\_scim\_credentials | The AWS SCIM endpoint and bearer token. SOURCE: Key Vault secrets<br/>aws-scim-tenant-url / aws-scim-token, exported as TF\_VAR\_ only in the run<br/>that CREATES (or deliberately replaces) the credential - see README "SCIM<br/>credential". Never committed, never in lab.tfvars, never available to PR<br/>plans. null (default) = not supplied in this run; once the credential<br/>exists Terraform ignores it (lifecycle ignore\_changes), so routine plans<br/>never need the token. | <pre>object({<br/>    tenant_url   = string # SCIM endpoint, https://scim.<region>.amazonaws.com/<id>/scim/v2<br/>    secret_token = string # AWS "Access token" - shown once, valid 1 year (verify:)<br/>  })</pre> | `null` | no |
| aws\_scim\_job\_enabled | Start the provisioning job (the ~40-minute incremental cycle). false<br/>(default) = the job exists but is stopped: run Test Connection and<br/>provision ONE user on demand first, then flip this in its own PR. Turning<br/>it back to false pauses provisioning (nothing is deleted in AWS). | `bool` | `false` | no |
| aws\_scim\_template\_id | Synchronization template id of the AWS IAM Identity Center connector (NOT<br/>the gallery template id above). Read it AFTER the first SSO apply:<br/>  GET https://graph.microsoft.com/v1.0/servicePrincipals/<sp-object-id>/synchronization/templates<br/>(output aws\_scim\_template\_lookup\_command). Required when<br/>enable\_scim\_provisioning = true. Left empty on purpose: Microsoft does not<br/>publish it and guessing it would fail at apply. verify: the id returned. | `string` | `""` | no |
| claims\_viewer\_admins\_group\_object\_id | Entra object id of GRP-ClaimsViewer-Admins (synced from AD). Gets app role ClaimsViewer.Admin. | `string` | `""` | no |
| claims\_viewer\_clinicians\_group\_object\_id | Entra object id of GRP-ClaimsViewer-Clinicians (an AD group synced by Cloud Sync; lab/adfs/scripts/11-Add-ClaimsViewerRp.ps1 creates it). Gets app role ClaimsViewer.Clinician. | `string` | `""` | no |
| claims\_viewer\_saml\_signing\_cert\_end\_date | Expiry of the Claims Viewer SAML signing certificate (RFC 3339). null = Entra's default (3 years). Changing it replaces the certificate: re-run lab/adfs/claims-viewer/fetch-metadata.sh entra. | `string` | `null` | no |
| clinic\_results\_display\_name | Display name of the Clinic Lab Results app registration. lab/okta-migration finds the Entra app by this name, so it must match the Okta app's label. | `string` | `"Clinic Lab Results"` | no |
| clinic\_results\_redirect\_uris | Public-client redirect URIs of Clinic Lab Results. Loopback only<br/>(http://localhost:<port>/... or http://127.0.0.1:<port>/...): the app<br/>runs on the clinic workstation (lab/okta-migration/clinic-results). Must<br/>equal the redirect URI of the Okta app it replaces, so the cut-over<br/>changes the IdP and nothing else. | `list(string)` | <pre>[<br/>  "http://localhost:8471/callback"<br/>]</pre> | no |
| clinical\_portal\_display\_name | Display name of the OIDC app registration. | `string` | `"Contoso Clinical Portal"` | no |
| clinical\_portal\_preauthorize\_azure\_cli | Pre-authorize the Azure CLI (first-party public client<br/>04b07795-8ddb-461a-bbee-02f9e1bf7b46) for the Clinical.Read scope, so the<br/>demo can run `az account get-access-token --scope api://<client-id>/Clinical.Read`<br/>and decode the roles/groups claims without hosting a web app or enabling<br/>the implicit flow. Assignment-required still blocks unassigned users.<br/>Off by default: it is a demo convenience, not part of the target design. | `bool` | `false` | no |
| clinical\_portal\_redirect\_uris | Web (confidential client, authorization-code) redirect URIs. Default is a<br/>local sample web app, because the lab hosts no portal: the app proves the<br/>identity contract (roles, groups, consent), not a website. https only,<br/>except http://localhost, which Entra allows for development. | `list(string)` | <pre>[<br/>  "https://localhost:5001/signin-oidc"<br/>]</pre> | no |
| clinical\_portal\_role\_assignments | App-role grants, keyed by a STATIC name (the keys drive for\_each, so they<br/>must be known at plan even when the group is created in the same apply).<br/>Assign GROUPS: membership then comes from HR rules and access packages,<br/>and a leaver loses the role when they leave the group. Example:<br/>  { nurses\_clinician   = { role = "Clinician",  principal\_object\_id = <All-Nurses> },<br/>    pharmacy\_pharmacist = { role = "Pharmacist", principal\_object\_id = <App-Pharmacy-Dispensing-Users> } }<br/>Note: app-role grants do not flow through nested groups. | <pre>map(object({<br/>    role                = string # Clinician | Pharmacist | Auditor<br/>    principal_object_id = string # group (preferred) or user object id<br/>  }))</pre> | `{}` | no |
| enable\_aws\_admins\_assignment | Assign a SECOND principal to the AWS app: the PIM-for-Groups admin group<br/>(modules/pim output aws\_admin\_group\_object\_id, PIM-AWS-Lab-Admins). A<br/>plain bool, not "is the id set", because the group id is unknown at plan<br/>when the group is created in the same apply (count needs a known value).<br/>ADR 0025. | `bool` | `false` | no |
| enable\_claims\_viewer\_app | Create the Contoso Claims Viewer SAML app: the app migrated off AD FS<br/>(lab/adfs, ADR 0009 phase 3), with the AD FS claim rules converted into a<br/>claims-mapping policy and two app roles. Needs the two group object ids<br/>below. envs/dev flag: enable\_claims\_viewer\_app. Off by default. | `bool` | `false` | no |
| enable\_clinic\_results\_app | Create Clinic Lab Results: the acquired clinic's first app moved from<br/>Okta to Entra (okta-migration wave 1). Public-client app registration<br/>(auth code + PKCE, loopback redirect, no secret), its enterprise app<br/>(assignment required) and the assigned group App-ClinicResults-Users as<br/>its ONE assignment. CA061 (modules/conditional-access) targets it. Off<br/>by default. | `bool` | `false` | no |
| enable\_guacamole\_psm\_app | Create the guacamole-psm app registration + enterprise app (implicit<br/>id\_token, no secret, assignment required) and the PAM-Operators group it<br/>is assigned to, so the lab/pam Guacamole stand-in signs operators in<br/>through Entra (MFA + Conditional Access) instead of local passwords.<br/>envs/dev flag: enable\_pam\_oidc\_app. Off by default. | `bool` | `false` | no |
| enable\_okta\_federation | Create okta-clinic-idp, the Entra half of the Okta coexistence<br/>(lab/docs/okta-migration-runbook.md Phase 1, ADR 0022): a single-tenant<br/>OIDC app registration whose one redirect URI is the Okta org's authorize<br/>callback, its service principal with assignment required, and ONE<br/>assignment (App-Okta-Federation-Users). The client secret is NOT created:<br/>a human mints it post-apply (output okta\_idp\_client\_secret\_command) and<br/>hands it once to the Okta root (lab/terraform/okta). Needs<br/>okta\_org\_domain and okta\_federation\_users\_group\_object\_id. envs/dev flag:<br/>enable\_okta\_federation. Off by default. | `bool` | `false` | no |
| enable\_scim\_provisioning | Create the provisioning job and its credential (envs/dev flag<br/>enable\_scim\_provisioning). Off by default: it needs the AWS SCIM endpoint<br/>and token, which exist only after the AWS identity source has been switched<br/>to Entra (README "Staged order"). | `bool` | `false` | no |
| enable\_servicenow\_fulfilment | Create the app ServiceNow uses to fulfil approved access requests:<br/>"ServiceNow - Access Fulfilment", certificate credential only<br/>(files/servicenow-fulfilment.pem), no Graph API permission, and ONE<br/>entitlement-management role: Access package assignment manager on<br/>servicenow\_fulfilment\_catalog\_id. lab/servicenow/README.md. | `bool` | `false` | no |
| enable\_servicenow\_provisioning | Create the ServiceNow PROVISIONING app (gallery template "ServiceNow",<br/>hidden from My Apps, assignment required, ONE assignment:<br/>App-ServiceNow-Users - the SSO app's group), its synchronization job<br/>(ServiceNowOutDelta, STOPPED unless servicenow\_provisioning\_job\_enabled)<br/>and its credential (InstanceName from servicenow\_instance\_url + the<br/>integration user from servicenow\_provisioning\_credentials). Needs<br/>servicenow\_instance\_url and servicenow\_users\_group\_object\_id. The run<br/>that creates the credential is a LOCAL seeding apply (README "ServiceNow<br/>provisioning"). envs/dev flag: enable\_servicenow\_provisioning. Off by<br/>default. | `bool` | `false` | no |
| enable\_servicenow\_sso | Create the ServiceNow SAML enterprise app (non-gallery template, settings<br/>from the Learn ServiceNow SSO tutorial): assignment required, ONE<br/>assignment (App-ServiceNow-Users), Entra-minted signing certificate,<br/>NameID = userPrincipalName. Needs servicenow\_instance\_url and<br/>servicenow\_users\_group\_object\_id. Provisioning to ServiceNow is the<br/>separate enable\_servicenow\_provisioning (servicenow\_provisioning.tf).<br/>envs/dev flag: enable\_servicenow\_sso. Off by default. | `bool` | `false` | no |
| guacamole\_redirect\_uris | Web redirect URIs of guacamole-psm. Must equal OPENID\_REDIRECT\_URI in<br/>lab/pam/docker-compose.oidc.yml. https only, except http://localhost<br/>(the local stand-in), which Entra allows for development. | `list(string)` | <pre>[<br/>  "http://localhost:8081/guacamole/"<br/>]</pre> | no |
| iac\_owner\_client\_id | Client id of the identity Terraform runs as on APPLY (the GitHub APPLY<br/>app, repo variable AZURE\_APPLY\_CLIENT\_ID). It is made an owner of every app<br/>here so it can keep managing them with Application.ReadWrite.OwnedBy -<br/>whoever runs a plan or a local apply. Empty = the caller (offline tests, a<br/>first local apply before the APPLY app exists). | `string` | `""` | no |
| okta\_federation\_users\_group\_object\_id | Object id of App-Okta-Federation-Users (modules/groups output<br/>app\_access\_group\_object\_ids["okta"]) - the ONLY principal assigned to<br/>okta-clinic-idp, i.e. the allow-list of who may federate into Okta.<br/>Required when enable\_okta\_federation = true. | `string` | `""` | no |
| okta\_idp\_app\_display\_name | Display name of the Entra app registration Okta signs in through (sign-in logs, the Okta System Log's IdP name is separate). The runbook calls it okta-clinic-idp. | `string` | `"okta-clinic-idp"` | no |
| okta\_idp\_secret\_lifetime\_days | Lifetime, in days, of the client secret a human mints post-apply with<br/>output okta\_idp\_client\_secret\_command (Terraform never creates it). At<br/>most 180: the P180D rotation recorded for okta-clinic-idp-client-secret<br/>in lab/iga/nhi-secrets-register.json. Rotation = mint a new one, enter it<br/>in the Okta root, remove the old one in Entra. | `number` | `180` | no |
| okta\_org\_domain | The Okta org HOST, e.g. integrator-1234567.okta.com (an Integrator Free<br/>org), dev-12345.okta.com, <org>.oktapreview.com or <org>.okta-emea.com.<br/>Bare host: no scheme (the module adds https), no path, no wildcard, no<br/>port, lower case, and never the -admin host (the admin console is not an<br/>OIDC callback). A custom Okta domain is a design change (the callback<br/>host follows issuer\_mode in the Okta root), not a value here. Required<br/>when enable\_okta\_federation = true. Not a secret, but org-specific:<br/>terraform.tfvars / TF\_VAR\_, never lab.tfvars. | `string` | `""` | no |
| require\_scim\_credentials | Fail closed instead of warning when this run would CREATE a provisioning<br/>credential without its value: the AWS SCIM credential without<br/>aws\_scim\_credentials, or the ServiceNow connector credential without<br/>servicenow\_provisioning\_credentials. Set true in the reviewer-gated<br/>apply (and in a local seeding run); leave false for PR plans, which by<br/>design can never read the vault. Once a credential exists this has no<br/>effect on it (the stored value satisfies it). | `bool` | `false` | no |
| saml\_cert\_notification\_emails | Addresses Entra mails 60, 30 and 7 days before the SAML signing<br/>certificate expires (verify: the notification schedule). Use a team<br/>mailbox, not a person. Sensitive so a public plan comment never shows it. | `list(string)` | `[]` | no |
| saml\_signing\_cert\_end\_date | Expiry of the SAML token-signing certificate (RFC 3339, e.g.<br/>"2027-10-31T00:00:00Z"). null = Entra's default of 3 years. Shorter is<br/>stricter but every rotation is a coordinated change: changing this<br/>REPLACES the certificate, and AWS must be given the new IdP metadata in<br/>the same window or every AWS sign-in fails (README "Certificate rotation"). | `string` | `null` | no |
| service\_management\_reference | ITSM reference stamped on both app registrations (serviceManagementReference),<br/>e.g. the ServiceNow CI or change number. Lets an auditor go from an app in<br/>Entra to its owning record without asking anyone. Empty = not set. | `string` | `""` | no |
| servicenow\_app\_display\_name | Display name of the ServiceNow enterprise app (My Apps tile, sign-in logs). | `string` | `"ServiceNow"` | no |
| servicenow\_fulfilment\_app\_display\_name | Display name of the ServiceNow fulfilment app. lab/servicenow/apply.py finds its client id by this name. | `string` | `"ServiceNow - Access Fulfilment"` | no |
| servicenow\_fulfilment\_catalog\_id | Object id of the access package catalog ServiceNow may assign in (the Clinical catalog, module.entitlement catalog\_id). Required when enable\_servicenow\_fulfilment = true. | `string` | `""` | no |
| servicenow\_instance\_url | The ServiceNow instance URL, e.g. a Personal Developer Instance<br/>https://devNNNNN.service-now.com. It is the SAML Identifier (Entity ID)<br/>exactly, and the Reply URL is <this>/navpage.do. No trailing slash (the<br/>Learn tutorial: ServiceNow's Entity ID has none), no path, no wildcard.<br/>Required when enable\_servicenow\_sso = true. Not a secret, but<br/>tenant-specific: terraform.tfvars / TF\_VAR\_, never lab.tfvars. | `string` | `""` | no |
| servicenow\_provisioning\_app\_display\_name | Display name of the ServiceNow provisioning app (Enterprise applications, provisioning logs). Hidden from My Apps. | `string` | `"ServiceNow - Provisioning"` | no |
| servicenow\_provisioning\_credentials | The ServiceNow integration user the connector signs in as (Basic auth;<br/>keys UserName / Password). SOURCE: Key Vault secrets<br/>servicenow-provisioning-username / servicenow-provisioning-password,<br/>exported as TF\_VAR\_ only in the run that CREATES (or deliberately<br/>replaces) the credential - README "ServiceNow provisioning". Never<br/>committed, never in lab.tfvars, never available to PR plans or CI.<br/>null (default) = not supplied; once the credential exists Terraform<br/>ignores it (ignore\_changes). | <pre>object({<br/>    user_name = string # the ServiceNow integration user (admin role, web-service access only)<br/>    password  = string<br/>  })</pre> | `null` | no |
| servicenow\_provisioning\_job\_enabled | Start the ServiceNow provisioning job (Entra's ~40-minute cycle). false<br/>(default) = created STOPPED: Test Connection and one provision-on-demand<br/>first, then flip this in its own PR (the AWS order). | `bool` | `false` | no |
| servicenow\_saml\_claims\_policy\_enabled | Assign a claims-mapping policy to the ServiceNow app pinning NameID to<br/>userPrincipalName (ServiceNow's User Field = user\_name holds the UPN).<br/>As for the AWS app, it makes the claim reviewed code and turns the<br/>portal's "Attributes & Claims" blade read-only. false = the non-gallery<br/>app's default claims (the fallback if the first sign-in shows a NameID<br/>problem). | `bool` | `true` | no |
| servicenow\_saml\_signing\_cert\_end\_date | Expiry of the ServiceNow SAML token-signing certificate (RFC 3339). null<br/>= Entra's default of 3 years. Separate from saml\_signing\_cert\_end\_date<br/>(AWS) so one vendor's rotation never forces the other's. Changing it<br/>REPLACES the certificate: ServiceNow's IdP record needs the new metadata<br/>(or certificate) in the same window, or every ServiceNow sign-in fails. | `string` | `null` | no |
| servicenow\_sso\_sys\_id | sys\_id of the SAML identity provider record in ServiceNow (Multi-Provider<br/>SSO -> Identity Providers -> the record -> Copy sys\_id). Makes the Sign-on<br/>URL <instance>/login\_with\_sso.do?glide\_sso\_id=<sys\_id>, so the My Apps<br/>tile signs in through THIS IdP. Empty (default) = Sign-on URL<br/><instance>/navpage.do: the record does not exist until its metadata has<br/>been imported, so this is set in a second, staged apply. | `string` | `""` | no |
| servicenow\_users\_group\_object\_id | Object id of App-ServiceNow-Users (modules/groups output<br/>app\_access\_group\_object\_ids["servicenow"]) - the ONLY principal assigned<br/>to the ServiceNow app, and the ONLY principal assigned to the ServiceNow<br/>provisioning app (the provisioning scope). Required when<br/>enable\_servicenow\_sso or enable\_servicenow\_provisioning is true. | `string` | `""` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| aws\_admins\_assigned\_group\_object\_id | The PIM admin group assigned to the AWS app (PIM-AWS-Lab-Admins; null unless enable\_aws\_admins\_assignment). ADR 0025. |
| aws\_application\_object\_id | Object id of the AWS IAM Identity Center app registration. |
| aws\_assigned\_group\_object\_id | The staff principal assigned to the AWS app (App-AWS-IdentityCenter-Users; part of the SCIM scope). |
| aws\_claims\_mapping\_policy\_id | Claims-mapping policy on the AWS app (null when aws\_saml\_claims\_policy\_enabled = false). |
| aws\_client\_id | Client (application) id of the AWS IAM Identity Center app. |
| aws\_federation\_metadata\_url | Entra IdP metadata for this app - upload to AWS (Change identity source -> IdP SAML metadata). Re-upload after every signing-certificate change. |
| aws\_saml\_signing\_cert\_activation\_command | POST-APPLY (tenant time): make the new certificate the active SAML signing key. azuread 3.10 cannot set preferredTokenSigningKeyThumbprint. Needs Connect-MgGraph -Scopes Application.ReadWrite.All. |
| aws\_saml\_signing\_cert\_end\_date | When the SAML signing certificate expires - the date a rotation (and AWS metadata re-upload) must happen before. |
| aws\_saml\_signing\_cert\_thumbprint | Thumbprint of the Entra-minted SAML signing certificate (must be made the preferred signing key - see the activation command). |
| aws\_scim\_job\_enabled | Whether the ~40-minute provisioning cycle is started (null when SCIM is off). |
| aws\_scim\_job\_id | Provisioning job resource id (null until enable\_scim\_provisioning). Provision-on-demand and the leaver script operate on this job. |
| aws\_scim\_template\_lookup\_command | TENANT TIME, after the first SSO apply: prints the synchronization template id to put in aws\_scim\_template\_id. |
| aws\_service\_principal\_object\_id | Object id of the AWS IAM Identity Center enterprise app (04-Leaver.ps1 finds it by display name; this is the id behind it). |
| claims\_viewer\_client\_id | Client id of the Claims Viewer app (lab/adfs/claims-viewer/fetch-metadata.sh entra needs it as CLIENT\_ID). |
| claims\_viewer\_role\_assignments | Group object id -> app role value on the Claims Viewer (the converted AD FS rules 3a/3b). |
| claims\_viewer\_saml\_signing\_cert\_activation\_command | POST-APPLY: make the new certificate the active Claims Viewer signing key (azuread 3.10 cannot set preferredTokenSigningKeyThumbprint). Run it BEFORE fetch-metadata.sh entra, so the metadata carries the active key. |
| claims\_viewer\_service\_principal\_object\_id | Object id of the Claims Viewer enterprise app. |
| clinic\_results\_api\_client\_id | Client id of Clinic Lab Results API, the resource CA061 targets (Conditional Access cannot target the public client). Null while off. |
| clinic\_results\_client\_id | Client id of Clinic Lab Results (null while off). CA061 targets it; lab/okta-migration/cutover.mjs reads it from Graph by display name. |
| clinic\_results\_users\_group\_object\_id | Object id of App-ClinicResults-Users, the ONE principal on Clinic Lab Results and CA061's user scope (null while off). Pilot members are added post-apply. |
| clinical\_portal\_app\_role\_ids | App role value => fixed role id (Clinician / Pharmacist / Auditor). Known at plan - the ids never change. |
| clinical\_portal\_application\_object\_id | Object id of the Contoso Clinical Portal app registration. |
| clinical\_portal\_client\_id | Client id of Contoso Clinical Portal. |
| clinical\_portal\_identifier\_uri | App ID URI (api://<client-id>); scopes are <this>/Clinical.Read. |
| clinical\_portal\_role\_assignments | Static key => { role, principal } actually granted on the portal. |
| clinical\_portal\_service\_principal\_object\_id | Object id of the Contoso Clinical Portal enterprise app. |
| guacamole\_psm\_client\_id | Client id of guacamole-psm = OIDC\_CLIENT\_ID in lab/pam/.env (null while enable\_guacamole\_psm\_app is off). |
| nhi\_inventory | One row per application this module owns: what it is, who owns it, what credential it holds and when that expires. Input for the NHI inventory/evidence pack (OWASP NHI: ownership, credential lifetime). Sensitive: owners carries app\_owner\_object\_ids (named people). |
| okta\_idp\_application\_object\_id | Object id of the okta-clinic-idp app registration (the -ApplicationId of the secret-minting command). |
| okta\_idp\_assigned\_group\_object\_id | The single principal assigned to okta-clinic-idp (App-Okta-Federation-Users): the allow-list of who may federate into Okta. |
| okta\_idp\_client\_id | Client (application) id of okta-clinic-idp = entra\_client\_id in lab/terraform/okta (the Okta root's Microsoft IdP). |
| okta\_idp\_client\_secret\_command | POST-APPLY (tenant time, a human): mint the client secret Okta needs, bounded to okta\_idp\_secret\_lifetime\_days, and hand the printed value ONCE to the Okta root as TF\_VAR\_entra\_client\_secret. Terraform never creates or stores it (okta.tf header). Needs Connect-MgGraph -Scopes Application.ReadWrite.All (or ownership of the app with Application.ReadWrite.OwnedBy). |
| okta\_idp\_endpoints | The tenant's v1.0 OIDC endpoints for the Okta root's okta\_idp\_oidc (issuer, authorization, token, JWKS; no userinfo). v1.0 because only its ID token carries amr, which Okta's trust claims reads. Copy, do not retype. |
| okta\_idp\_redirect\_uri | The one redirect URI on okta-clinic-idp. Must equal output okta\_callback\_uri of lab/terraform/okta (same org host) - the README's cross-check. |
| okta\_idp\_service\_principal\_object\_id | Object id of the okta-clinic-idp enterprise app (admin consent target, sign-in log filter). |
| pam\_operators\_group\_object\_id | Object id of PAM-Operators, the only principal assigned to guacamole-psm (null while off). Add operators post-apply; add them to CA008-Pilot-PhishingResistant too so PSM sign-in needs a phishing-resistant method. |
| servicenow\_application\_object\_id | Object id of the ServiceNow app registration (non-gallery SAML). |
| servicenow\_assigned\_group\_object\_id | The single principal assigned to the ServiceNow app (App-ServiceNow-Users). |
| servicenow\_client\_id | Client (application) id of the ServiceNow app. |
| servicenow\_federation\_metadata\_url | Entra IdP metadata for the ServiceNow app - ServiceNow Multi-Provider SSO -> Identity Providers -> New -> SAML -> Import Identity Provider Metadata (URL). Re-import after every signing-certificate change. |
| servicenow\_fulfilment | The ServiceNow fulfilment app (null when enable\_servicenow\_fulfilment = false). client\_id goes into ServiceNow property contoso.entra.fulfilment.client\_id (lab/servicenow/apply.py looks it up by display name). |
| servicenow\_provisioning\_assigned\_group\_object\_id | The single principal assigned to the provisioning app - the same App-ServiceNow-Users as the SSO app. |
| servicenow\_provisioning\_job\_enabled | Whether the ServiceNow provisioning cycle is started (false = created stopped; null when off). |
| servicenow\_provisioning\_job\_id | ServiceNow provisioning job id (ServiceNowOutDelta.<tenant>.<app id>): provision-on-demand and validateCredentials operate on it. |
| servicenow\_provisioning\_reply\_url\_import\_id | SEEDING STEP (README "ServiceNow provisioning"): the id to `terraform import` the gallery app's existing Web redirect set under azuread\_application\_redirect\_uris.servicenow\_provisioning before the apply that replaces its wildcard. |
| servicenow\_provisioning\_service\_principal\_object\_id | Object id of the ServiceNow provisioning enterprise app (provision-on-demand, provisioning logs, Test Connection run against it). |
| servicenow\_saml\_signing\_cert\_activation\_command | POST-APPLY (tenant time): make the new certificate the active ServiceNow SAML signing key. azuread 3.10 cannot set preferredTokenSigningKeyThumbprint. Needs Connect-MgGraph -Scopes Application.ReadWrite.All. |
| servicenow\_saml\_signing\_cert\_end\_date | When the ServiceNow SAML signing certificate expires - rotate (and re-import the metadata in ServiceNow) before then. |
| servicenow\_saml\_signing\_cert\_thumbprint | Thumbprint of the Entra-minted ServiceNow SAML signing certificate (make it the preferred signing key - see the activation command). |
| servicenow\_service\_principal\_object\_id | Object id of the ServiceNow enterprise app. |
| servicenow\_sign\_on\_url | Sign-on URL the My Apps tile uses (login\_with\_sso.do with the IdP sys\_id once servicenow\_sso\_sys\_id is set, else navpage.do). |
<!-- END_TF_DOCS -->
