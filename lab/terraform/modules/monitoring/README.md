# modules/monitoring: Detections as code

This module deploys the KQL queries in [`lab/kql`](../../../kql/) as Microsoft Sentinel analytics rules, or as Log Analytics scheduled query alerts.
Only one of the two paths can be on. A precondition refuses a plan with both.
The core rules are always on. The other rule sets are behind flags.

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "monitoring" {
  source = "../../modules/monitoring"

  resource_group_name        = azurerm_resource_group.idlab.name
  location                   = var.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.idlab.id
  enable_sentinel            = var.enable_sentinel
  enable_la_alerts           = var.enable_la_alerts
  alert_email                = var.alert_email
  playbook_logic_app_id      = var.sentinel_playbook_id

  enable_itdr_detections     = var.enable_itdr_detections
  itdr_exclude_rules         = var.itdr_exclude_rules
  enable_itdr_containment    = var.enable_itdr_containment
  containment_playbook_id    = var.containment_playbook_id
  containment_rule_keys      = var.containment_rule_keys
  collect_dc_security_events = var.enable_itdr_detections && var.enable_dc
  dc_vm_id                   = var.enable_dc ? module.dc_vm[0].vm_id : ""
  containment_on_alert_added = var.containment_on_alert_added


  # ... 25 more lines. See the full call in the file.
}
```

## Tests

5 test files in [`tests/`](tests/), with mocked providers. No sign-in is necessary.

```
terraform init -backend=false
terraform test
```

## More detail

The header of [`main.tf`](main.tf) gives the design, the limits and the license notes.
The lists below are made by `terraform-docs`. Do not edit them by hand. Run [`tools/module-docs.sh`](../../tools/module-docs.sh).

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.9.0 |
| azurerm | ~> 4.0 |

### Providers

| Name | Version |
| ---- | ------- |
| azurerm | ~> 4.0 |

### Resources

| Name | Type |
| ---- | ---- |
| [azurerm_log_analytics_workspace_table_custom_log.vault_checkout](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/log_analytics_workspace_table_custom_log) | resource |
| [azurerm_monitor_action_group.identity_secops](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_action_group) | resource |
| [azurerm_monitor_data_collection_endpoint.itdr](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_data_collection_endpoint) | resource |
| [azurerm_monitor_data_collection_rule.dc_security](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_data_collection_rule) | resource |
| [azurerm_monitor_data_collection_rule.vault_checkout](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_data_collection_rule) | resource |
| [azurerm_monitor_data_collection_rule_association.dc_security](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_data_collection_rule_association) | resource |
| [azurerm_monitor_scheduled_query_rules_alert_v2.this](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_scheduled_query_rules_alert_v2) | resource |
| [azurerm_sentinel_alert_rule_nrt.this](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_alert_rule_nrt) | resource |
| [azurerm_sentinel_alert_rule_scheduled.this](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_alert_rule_scheduled) | resource |
| [azurerm_sentinel_automation_rule.contain](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_automation_rule) | resource |
| [azurerm_sentinel_automation_rule.contain_on_alert_added](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_automation_rule) | resource |
| [azurerm_sentinel_automation_rule.label_drill](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_automation_rule) | resource |
| [azurerm_sentinel_automation_rule.notify](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_automation_rule) | resource |
| [azurerm_sentinel_automation_rule.notify_on_alert_added](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_automation_rule) | resource |
| [azurerm_sentinel_data_connector_microsoft_threat_protection.mdi](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_data_connector_microsoft_threat_protection) | resource |
| [azurerm_sentinel_log_analytics_workspace_onboarding.this](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_log_analytics_workspace_onboarding) | resource |
| [azurerm_sentinel_watchlist.operator_ips](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_watchlist) | resource |
| [azurerm_sentinel_watchlist_item.operator_ips](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/sentinel_watchlist_item) | resource |
| [azurerm_virtual_machine_extension.dc_ama](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_machine_extension) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| log\_analytics\_workspace\_id | Resource id of loga-idlab. | `string` | n/a | yes |
| resource\_group\_name | Resource group for the alert rules / action group. | `string` | n/a | yes |
| alert\_email | Email for the Log Analytics alert action group. Empty = alerts fire without notification. | `string` | `""` | no |
| azure\_pim\_group\_ids | Object id(s) of PIM-Azure-RG-Contributors (modules/pim azure.tf), also<br/>listed in privileged\_group\_ids. Its members are STANDING by design: the<br/>GROUP is eligible for Contributor on the lab RG and each member still<br/>activates through Azure PIM with Tier-0 approval, so a direct member add<br/>is the intended operational path, not a bypass.<br/>pim-group-member-added-outside-pim.kql reports it on its own path<br/>(AzurePimEligibleMember, Medium) instead of High "Direct". | `list(string)` | `[]` | no |
| break\_glass\_group\_ids | Object id(s) of Break-Glass-Admins: any member added there is High, even by the IaC identity. | `list(string)` | `[]` | no |
| break\_glass\_grouping\_lookback | How long a break-glass incident keeps absorbing new alerts for the same account (NRT incident grouping, ISO 8601). Default 24 h: one incident, one Teams card and one ServiceNow ticket per account per day; each joined alert is a work note on that ticket (review finding D2). | `string` | `"P1D"` | no |
| break\_glass\_user\_ids | Object ids of the break-glass USER accounts (modules/groups output break\_glass\_user\_object\_ids). break-glass-signin.kql matches a sign-in by these immutable ids, so a renamed account still alerts; the bg-admin-NN naming convention stays as a second match (review finding D3, 2026-11-07). | `list(string)` | `[]` | no |
| collect\_dc\_security\_events | With enable\_itdr\_detections: install the Azure Monitor Agent on DC01 and collect its identity-relevant Security events into SecurityEvent. Pass enable\_dc here (a plan-time boolean; the VM id itself is unknown on the first plan). | `bool` | `false` | no |
| containment\_on\_alert\_added | Also run containment when a High ITDR alert is ADDED to an existing<br/>incident (incident Updated + Alerts added). In the Defender portal the<br/>correlation engine can attach a new alert to an older incident, so the<br/>Created-only trigger would never see it. Off by default: an incident that<br/>gets a second alert then produces a second approval card (noise, never an<br/>unapproved action). verify: turn on after the first Defender-portal<br/>incident shows whether correlation merges ITDR alerts. | `bool` | `false` | no |
| containment\_playbook\_id | Resource id of pb-identity-contain (Deploy-ContainmentPlaybook.ps1 output). Empty = no containment automation rule yet. | `string` | `""` | no |
| containment\_rule\_keys | ITDR rule keys whose High incidents trigger containment. null = every deployed ITDR rule except sod\_violation\_granted, vault\_privileged\_access\_anomaly and keyvault\_bulk\_secret\_read, which never do. | `list(string)` | `null` | no |
| dc\_vm\_id | Resource id of vm-dc01 (module.dc\_vm[0].vm\_id). Used only when collect\_dc\_security\_events is true. | `string` | `""` | no |
| drill\_account\_prefixes | Account-name prefixes of drill-only accounts. An incident whose Account entity starts with one is labelled "drill" at creation, so close-build-noise.sh can close drill noise by label (review finding D2). Empty = no labelling rule. | `list(string)` | <pre>[<br/>  "itdr-drill-"<br/>]</pre> | no |
| enable\_defender\_for\_identity | Wire Microsoft Defender for Identity (MDI) alerts into this workspace via<br/>the Microsoft Defender XDR data connector (there is no standalone MDI<br/>connector any more; MDI flows through Defender XDR into SecurityAlert).<br/>This is the ONLY MDI piece Terraform can express: the sensor on DC01, the<br/>MDI workspace, the directory service account and the Defender licence (free<br/>90-day trial) are human steps in<br/>lab/docs/runbooks/deploy-defender-for-identity-dc01.md. Needs<br/>enable\_sentinel (the connector is a Sentinel feature). Default off: it adds<br/>nothing and starts no trial until a human has run the runbook.<br/>verify: in the unified Defender portal the Defender XDR connection may be<br/>managed for you once Sentinel is onboarded there - if so, this becomes a<br/>portal step and the flag just records intent (mdi.tf header). | `bool` | `false` | no |
| enable\_itdr\_containment | Run the containment playbook (lab/monitoring/playbook-contain.json: Teams<br/>approval card -> revoke sessions + disable / flag for AD disable) on NEW<br/>High-severity incidents from the ITDR rules. Needs enable\_sentinel and<br/>enable\_itdr\_detections; creates nothing until containment\_playbook\_id is<br/>also set (Deploy-ContainmentPlaybook.ps1 output). | `bool` | `false` | no |
| enable\_itdr\_detections | Add the eleven ITDR rules (lab/kql: app-credential-added, app-consent-granted,<br/>ca-policy-changed, role-assigned-outside-pim, pim-group-member-added-outside-pim,<br/>auth-method-changed-by-admin, identity-risk, tier0-logon-without-checkout,<br/>ad-privileged-group-change, kerberoast-rc4-service-ticket,<br/>dcsync-replication-request) to whichever detection path is on<br/>(enable\_sentinel / enable\_la\_alerts), and create their telemetry: the<br/>VaultCheckout\_CL table + DCE + DCR for the PAM check-out feed, and (with<br/>collect\_dc\_security\_events) DC01 Security events via AMA. Starts no trial<br/>by itself; turn it on BEFORE enable\_sentinel so the AuditLogs-based tables<br/>and VaultCheckout\_CL have data when Sentinel validates the rules.<br/>verify: per Microsoft Learn, AMA Security events reach SecurityEvent only<br/>once Sentinel + its "Windows Security Events via AMA" connector are on<br/>(Event otherwise), so the four SecurityEvent rules (tier0\_logon\_without\_checkout,<br/>ad\_privileged\_group\_change, kerberoast\_rc4\_service\_ticket,<br/>dcsync\_replication\_request) stay in itdr\_exclude\_rules until Sentinel is<br/>on and DC01 rows have arrived. | `bool` | `false` | no |
| enable\_itdr\_detections\_v2 | Add the six second-wave ITDR rules (itdr\_v2.tf; lab/kql: device-code-signin,<br/>security-info-registered-risky, dc-logon-outside-operator-allowlist,<br/>vault-privileged-access-anomaly, sod-violation-granted,<br/>pim-activation-without-auth-context) to the active detection path, and on<br/>the Sentinel path the operator\_ips watchlist (from operator\_ip\_ranges).<br/>Needs enable\_itdr\_detections (its telemetry feeds two of the six). Starts<br/>no trial by itself. security\_info\_registered\_risky and<br/>sod\_violation\_granted are Sentinel only (14-day look-back; Log Analytics<br/>alerts stop at 2 days). sod\_violation\_granted and<br/>vault\_privileged\_access\_anomaly never trigger containment. Hold back with<br/>itdr\_exclude\_rules until the data exists: dc\_logon\_outside\_operator\_allowlist<br/>until DC01 SecurityEvent rows arrive (verify: Sentinel + the AMA<br/>connector), pim\_activation\_without\_auth\_context (PREVIEW) until the first<br/>real Tier-0 activation, vault\_privileged\_access\_anomaly until<br/>ingest-vault-audit.sh ships the extended feed (vault\_feed\_v2\_columns). | `bool` | `false` | no |
| enable\_itdr\_detections\_v3 | Add the two third-set ITDR rules (itdr\_v3.tf; lab/kql:<br/>dormant-privileged-account-reactivation, keyvault-bulk-secret-read) to<br/>the active detection path. Needs enable\_itdr\_detections. Starts no trial.<br/>Both are Sentinel only (14-day look-back; Log Analytics alerts stop at 2<br/>days). keyvault\_bulk\_secret\_read never triggers containment. | `bool` | `false` | no |
| enable\_itdr\_detections\_v4 | Fourth ITDR set (itdr\_v4.tf, review findings B1, B2, C5, D1): operator sign-in outside its allowlist, operator permission changes, any auth method added to a break-glass account, HR leaver still enabled in Entra after 15 min, password spray by ASN. Needs enable\_itdr\_detections; the operator rules need operator\_principal\_ids. Off by default: turn on in its own reviewed change. | `bool` | `false` | no |
| enable\_la\_alerts | Deploy the same queries as Log Analytics scheduled query alerts (the post-Sentinel-trial path). | `bool` | `false` | no |
| enable\_sentinel | Onboard Microsoft Sentinel and deploy the analytics rules. STARTS THE<br/>31-DAY SENTINEL TRIAL. Turn on only after Entra diagnostics have streamed<br/>data for a few hours (rule creation fails on never-populated tables). | `bool` | `false` | no |
| iac\_principal\_ids | The CI APPLY identity's service principal object id and application (client) id (envs/bootstrap output iac\_principal\_ids). A change made by these ids is 'IaC' (lower severity); a change by an app that only carries the IaC display name is High (impersonation). | `list(string)` | `[]` | no |
| itdr\_exclude\_rules | ITDR rule keys (v1, v2 and v3) to hold back (e.g. identity\_risk until the RiskyUsers / UserRiskEvents diagnostic categories have data, tier0\_logon\_without\_checkout and dc\_logon\_outside\_operator\_allowlist until DC01 + the Vault feed do). Sentinel rejects a rule whose table has never received data. | `list(string)` | `[]` | no |
| kql\_dir | Directory holding the detection queries. Empty = lab/kql relative to this module. | `string` | `""` | no |
| location | Azure region (contract: eastus2). | `string` | `"eastus2"` | no |
| notify\_on\_alert\_added\_rule\_keys | Rules whose incidents run the notify playbook AGAIN when an alert is added<br/>to an open incident (automation rule: incident Updated + Alerts added,<br/>Microsoft Learn "Automate threat response with automation rules",<br/>incident update trigger). For rules where every hit needs its own card<br/>and ticket even inside the incident grouping window. Default: the<br/>break-glass sign-in rule, a near-real-time rule that judges each ingested<br/>row once (main.tf, local.nrt\_rule\_keys). Only rules that alert once per<br/>event belong here: a rule that re-alerts every run would post a card<br/>every five minutes. | `list(string)` | <pre>[<br/>  "break_glass_signin"<br/>]</pre> | no |
| operator\_ip\_ranges | Operator egress IPs for the operator\_ips Sentinel watchlist: the same single-host /32 entries modules/dc-vm admits to DC01 (envs/dev operator\_ip\_ranges when enable\_dc, else []). Sensitive: never shown in a plan. Used only with enable\_sentinel + enable\_itdr\_detections\_v2. | `list(string)` | `[]` | no |
| operator\_ips\_expires\_on | ExpiresOn (yyyy-mm-dd) of every operator\_ips row: ADR 0013's review date. The KQL ignores an entry past it, so the time box is enforced in the detection too; the plan warns once it has passed. Required when operator\_ip\_ranges is set. | `string` | `null` | no |
| operator\_ips\_owner | Owner column of every operator\_ips watchlist row: a role name, not a person (the watchlist is readable by every Sentinel reader). | `string` | `"lab-operator"` | no |
| operator\_principal\_ids | The lab operator workload identity's immutable ids (service principal object id, application object id, appId; ADR 0024). The fourth ITDR set's operator rules match on them. Required (non-empty) when enable\_itdr\_detections\_v4 is on: an empty list would match nothing. | `list(string)` | `[]` | no |
| pim\_work\_days\_local | Local working days for pim-activation.kql (KQL dayofweek: 0 = Sunday ... 6 = Saturday). Empty = the query's default, Monday-Friday. | `list(number)` | <pre>[<br/>  1,<br/>  2,<br/>  3,<br/>  4,<br/>  5<br/>]</pre> | no |
| pim\_work\_hours\_local | Local working hours (America/New\_York, 0-23) for pim-activation.kql; an activation outside them is 'off-hours'. Empty = the query's default, 7-18. | `list(number)` | <pre>[<br/>  7,<br/>  8,<br/>  9,<br/>  10,<br/>  11,<br/>  12,<br/>  13,<br/>  14,<br/>  15,<br/>  16,<br/>  17,<br/>  18<br/>]</pre> | no |
| playbook\_logic\_app\_id | Resource id of the notify playbook (Deploy-Playbook.ps1 output). Empty = no automation rule yet. | `string` | `""` | no |
| privileged\_group\_ids | Object ids of the role-holding / PIM-governed groups (Break-Glass-Admins, Privileged-IAM-Admins, PIM tier groups, the Azure PIM group). pim-group-member-added-outside-pim.kql alerts on members added to them outside PIM. | `list(string)` | `[]` | no |
| privileged\_user\_ids | Object ids of privileged users (break-glass, members / eligible members of the PIM groups, directory-role holders - Find-ShadowAdmins.ps1 -PrivilegedIdsPath). auth-method-changed-by-admin.kql makes any MFA / TAP change on them High. | `list(string)` | `[]` | no |
| tags | Tags for taggable resources. | `map(string)` | `{}` | no |
| tier0\_group\_ids | Object ids of the Tier-0 PIM groups (PIM-Tier0-*, PIM-AWS-Lab-Admins, the Azure PIM group, Privileged-IAM-Admins). pim-activation.kql marks an activation into one of them HighValue (Tier 0) by id; Medium, or High off-hours / from a new IP (review findings B5, B6). | `list(string)` | `[]` | no |
| trusted\_asns | Autonomous system numbers to ignore in failed-signin-spray-by-asn.kql (the hospital's own ISP). Digits only. Empty in the lab. | `list(string)` | `[]` | no |
| trusted\_egress\_ranges | The hospital's own internet egress ranges (IPv4 CIDR; NAT, VPN). failed-signin-spike.kql drops them from the brute-force shape only (one user's retries behind the NAT are normal); a spray from them still alerts. Empty in the lab (no hospital network). | `list(string)` | `[]` | no |
| vault\_feed\_v2\_columns | Add Ticket, Operator and ErrorText to VaultCheckout\_CL and its DCR stream,<br/>for vault-privileged-access-anomaly.kql. Turn on in the SAME change that<br/>ships the ingest-vault-audit.sh version emitting them (and the cred-read /<br/>rotation-failed / root-token / auth-failed / access-denied rows): once the<br/>Ticket column exists the rule judges every Tier-0 check-out by it, so the<br/>column without the script would make every check-out a High<br/>"Tier0CheckoutWithoutTicket". Needs enable\_itdr\_detections (the table). | `bool` | `false` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| containment\_alert\_added\_rule\_id | Second containment trigger on 'High alert added to an incident' (null unless containment\_on\_alert\_added). |
| containment\_automation\_rule\_id | Sentinel automation rule that runs the containment playbook (null until enable\_itdr\_containment + containment\_playbook\_id). |
| dc\_security\_dcr\_id | DCR collecting DC01 Security events (null unless collect\_dc\_security\_events). |
| defender\_for\_identity\_connector\_id | Microsoft Defender XDR data connector that carries MDI alerts into SecurityAlert (ADR 0023; null unless enable\_sentinel + enable\_defender\_for\_identity). The sensor, MDI workspace and licence are human steps - see the runbook. |
| itdr\_rule\_keys | ITDR rule keys (v1 + v2 + v3) selected for the active detection path (empty until enable\_itdr\_detections). The LA path skips sentinel\_only\_rule\_keys. |
| la\_alert\_rule\_ids | Map of rule key => Log Analytics scheduled query alert id (empty until enable\_la\_alerts). |
| notify\_alert\_added\_rule\_id | Automation rule that runs the notify playbook again when an alert joins an open incident of a rule in notify\_on\_alert\_added\_rule\_keys (null until the notify playbook id is set). |
| operator\_ips\_watchlist\_entry\_count | How many operator\_ips watchlist rows this plan manages (a count only; the rows are sensitive and never output). 0 when the watchlist is off or operator\_ip\_ranges reaches the module empty. |
| operator\_ips\_watchlist\_id | Sentinel watchlist operator\_ips (alias read by dc-logon-outside-operator-allowlist.kql); null unless enable\_sentinel + enable\_itdr\_detections\_v2. Its rows are sensitive and not output. |
| sentinel\_only\_rule\_keys | Selected rules with no Log Analytics alert equivalent (14-day look-back): deployed only while enable\_sentinel is on. |
| sentinel\_rule\_ids | Map of rule key => Sentinel analytics rule id (empty until enable\_sentinel). |
| vault\_ingestion | Logs Ingestion API target for lab/scripts/monitoring/ingest-vault-audit.sh (null until enable\_itdr\_detections). |
<!-- END_TF_DOCS -->
