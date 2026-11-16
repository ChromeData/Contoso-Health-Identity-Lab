# License requirements per resource

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 3 of 11


“Minimum SKU for the feature to **function**.” Creating the Terraform object
may succeed on a lower tier, but the capability needs the tier shown.

| Resource | Minimum license |
|----------|-----------------|
| `azuread_user` | **Free** |
| `azuread_group` (static, security) | **Free** |
| `azuread_group` with `dynamic_membership` (All-Nurses) | **Entra ID P1** |
| `azuread_group` with `assignable_to_role = true` (Break-Glass, Priv-IAM) | **Entra ID P1** |
| `azuread_conditional_access_policy` (CA001-CA005, CA008-CA010, CA020, CA022, CA060) and the script-written CA011 / CA021 / CA023 | **Entra ID P1** (per in-scope user); CA005's *compliant device* grant also needs **Intune** to judge the device; CA011 Token Protection licensing is *verify:* |
| `azuread_named_location` | **Entra ID P1** |
| `azuread_authentication_strength_policy` (custom) | **Entra ID P1** |
| CA sign-in / user **risk** conditions (CA006, CA007; `enable_identity_protection_ca`) | **Entra ID P2** (per in-scope user; in the M365 E5 trial) |
| Workforce authentication strength + CA008, dynamic All-Workforce group | **Entra ID P1** |
| `azurerm_pim_eligible_role_assignment` / `azurerm_role_management_policy` (PIM for Azure resources) | **Entra ID P2** |
| B2B package for connected-org guests (`enable_b2b_governance`) | **Entra ID Governance**; guests billed by B2B monthly active users (verify) |
| Standalone privileged / inactive-user access reviews (post-apply) | **Entra ID Governance** (verify) |
| `modules/apps`: gallery SAML app, app registrations | **Free**; *group* assignment to an enterprise app needs **Entra ID P1**; outbound SCIM: P1 (verify) |
| `azurerm_storage_account` (evidence store), DCE/DCR, custom table, AMA | **No Entra SKU** — Azure storage / ingestion cost |
| `azurerm_user_assigned_identity` (agent runtime) | **No Entra SKU**; Entra Agent ID itself is preview and may need Agent 365 (verify) |
| `azuread_directory_role_assignment` (break-glass GA, group → role) | **Free** (role-assignable group target needs **P1**) |
| `azuread_group_role_management_policy` (PIM for Groups) | **Entra ID P2** |
| `azuread_access_package*` + `azuread_access_package_assignment_policy` | **Entra ID Governance** (per assigned user) |
| Access reviews (`assignment_review_settings`, `enable_access_reviews`) | **Entra ID Governance** |
| `azuread_application` / `service_principal` / `federated_identity_credential` | **Free** |
| `azuread_app_role_assignment` (Graph app roles) | **Free** (consent rights still required) |
| `azurerm_key_vault`, `private_endpoint`, `private_dns_zone`, `user_assigned_identity`, `role_assignment`, `log_analytics_workspace` | **No Entra SKU** — standard Azure resource cost |
| `azurerm_windows_virtual_machine` + disks/IP (DC) | **No Entra SKU** — Azure compute (auto-shutdown keeps it ~$6/mo deallocated) |
| `azurerm_windows_virtual_machine` + `AADLoginForWindows` (Intune VM) | Azure compute (~$0.04/hr running, ~$10/mo deallocated). `Windows_Client` relies on Windows 11 multitenant hosting rights from **M365 E3/E5** (here the E5 *trial*: dev/test only, *verify*). Intune auto-enrollment needs **Entra ID P1 + Intune** (both in M365 E5) |
| `azurerm_monitor_aad_diagnostic_setting` | **Entra ID P1/P2** for sign-in logs (AuditLogs export works on Free) |
| `azurerm_sentinel_*` | **Sentinel** (31-day free trial on a new workspace, then per-GB) |
| `azurerm_monitor_scheduled_query_rules_alert_v2` | **No Entra SKU** — per-rule Azure Monitor cost (cents) |
| `aws_ssoadmin_*` (separate `aws/` root) | **No Entra SKU, no AWS charge** (IAM Identity Center) — but assigning the *group* to the Entra AWS enterprise app (what SCIM provisions) needs **Entra ID P1** |

**Net:** the lab needs **P1** for groups/CA, **P2** for PIM and risk-based
CA, **Entra ID Governance** for the access-package layer (and its access
reviews, B2B package), and
**Intune** (inside M365 E5) for the CA005 compliant-device demo. Key
Vault/networking/VMs are pure Azure.

---
