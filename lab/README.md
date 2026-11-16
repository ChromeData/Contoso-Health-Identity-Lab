# The lab: what is in each folder

This page is the index of `lab/`. The [walkthrough](../README.md) shows the lab in operation, one chapter at a time.
Each chapter page has links to the code, the test, the evidence and the decision behind it.

## Platform code

The code that makes the tenant, and the pipeline that applies it.

| Folder | What it holds |
|---|---|
| [`terraform/`](terraform/README.md) | The identity platform as Terraform: 14 modules, 3 environments, mocked tests. |
| [`pipelines/`](pipelines/README.md) | How GitHub Actions plans, gates and applies each change, with no stored secret. The workflows are in [`.github/workflows/`](../.github/workflows/). |
| [`scripts/`](scripts/README.md) | PowerShell and shell scripts: joiner, mover and leaver, the domain controller, the monitoring feeds and the evidence pack. |
| [`config-baseline/`](config-baseline/README.md) | The committed baseline of the tenant, and the permitted exceptions. The nightly drift check reads it. |
| [`setup/`](setup/SIGNUP-KIT.md) | The sign-ups that a person does one time, and the scripts that follow them. |

## Detect and respond

| Folder | What it holds |
|---|---|
| [`kql/`](kql/README.md) | The detections, one `.kql` file each. Terraform deploys them to Microsoft Sentinel. |
| [`monitoring/`](monitoring/) | The two playbooks (notify, contain) and the [test harness](monitoring/kusto-harness/README.md) for the KQL rules. |
| [`splunk/`](splunk/README.md) | The second SIEM: the same rules in SPL, in a local container. |

## Systems around Entra

Each folder is one system or one exercise. Each has its own status line.

| Folder | What it holds |
|---|---|
| [`hris/`](hris/README.md) | OrangeHRM, the HR system, and its connector to Entra inbound provisioning. |
| [`servicenow/`](servicenow/README.md) | The help desk: access requests, the IAM queue and the leaver task. |
| [`iga/`](iga/README.md) | Birthright rules, separation-of-duties rules and the review numbers. |
| [`pam/`](pam/README.md) | Open-source stand-ins for PAM and IGA products, in Docker. |
| [`bastion/`](bastion/README.md) | Recorded admin sessions with Azure Bastion. |
| [`secrets/state-leak/`](secrets/state-leak/README.md) | The test that shows a password in the Terraform state, and the read that leaves none. |
| [`k8s/`](k8s/README.md) | A Kubernetes workload that gets its secret with no stored secret. |
| [`adfs/`](adfs/README.md) | The move of one app from AD FS to Entra. |
| [`okta-migration/`](okta-migration/README.md) | The move of the clinic's apps from Okta to Entra. |

## Proof and decisions

| Folder | What it holds |
|---|---|
| [`evidence/`](evidence/README.md) | Hashed run records: what each run did, with a SHA-256 list. This is the largest folder. |
| [`docs/`](docs/README.md) | The decision records, the runbooks, the standards, the threat model and the risk register. |

## Where to start

- To see results and limits: [`docs/platform-details.md`](docs/platform-details.md).
- To read the Terraform: [`terraform/README.md`](terraform/README.md), then one module, for example [`modules/keyvault`](terraform/modules/keyvault/README.md).
- To see why a design was chosen: [`docs/adr/README.md`](docs/adr/README.md).
- To see what stands in for a production system: [`docs/STAND-INS.md`](docs/STAND-INS.md).
