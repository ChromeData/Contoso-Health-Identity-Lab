# Recording plan

One clip for each chapter of the README. The Entra trials end on 2026-11-26. Record the chapters
with **Yes** in the trial column before that date. Those features stop when the trials end.

| # | Chapter | Clip file in `demo/videos/` | Status | Trial | The clip must show | Evidence |
|---|---|---|---|---|---|---|
| 1 | HR hires an employee | `N02-hired.mp4` | Recorded 2026-11-15 | No | The OrangeHRM hire form (name, job, manager), then the connector log that sends the hire. | E91 |
| 2 | One account in two directories | `N03-one-account-two-directories.mp4` | Recorded 2026-11-15 | Yes | Sam in Active Directory, the Cloud Sync log, then Sam in Entra ID. Needs a live sign-in as Sam. | E52 |
| 3 | Access on day one | `N04-first-day-doors.mp4` | Recorded 2026-11-15 | Yes | The automatic access package, My Apps, the AWS sign-in through Entra, the patient portal. | E19, E22, E23 |
| 4 | Request more access | `N04b-the-service-desk.mp4` | Recorded 2026-11-15 | Yes | The ServiceNow request, the manager approval, the access package assignment in Entra. | E92 |
| 5 | The employee changes jobs | `N20-the-employee-changes-jobs.mp4` | Recorded 2026-11-15 | Yes | The department change in HR, the provisioning log, the new department in Entra, the ICU package. | E52 |
| 6 | The employee leaves | `N08-leaving.mp4` | Recorded 2026-11-15 | Yes | The termination in HR, then the account disabled in AD, Entra, ServiceNow and AWS, with the times. | E52, E187 |
| 7 | Conditional Access and MFA | `N18-conditional-access.mp4` | Recorded 2026-11-15 | Yes | The policy list in Entra, one policy in Terraform, one pull request that enforces a policy, a sign-in log entry. | E12, E30 |
| 8 | Break-glass accounts | `N19-break-glass.mp4` | Recorded 2026-11-15 | Yes | The two accounts, the exclusion test in Terraform, the drill output, the Sentinel rule. | E49 |
| 9 | Temporary admin rights | `N05-the-master-key.mp4` | Recorded 2026-11-15 | Yes | The eligible role in PIM, the activation with a reason, the active role. Needs a live admin sign-in as Raj. | E16, E72 |
| 10 | Admin passwords and recorded sessions | `N11-admin-passwords-and-sessions.mp4` | Recorded 2026-11-15 | No | The Key Vault secrets, the Terraform state with no password, the Bastion session recording. | E182, E186 |
| 11 | Harden Active Directory | `N12-hardening-ad.mp4` | Recorded 2026-11-15 | No | The tier groups and the policy on DC01, a refused sign-in, the scan before and after. | - |
| 12 | Admin access in AWS and Azure | `N15-aws-server-access-and-azure-least-privilege.mp4` | Recorded 2026-11-15 | Yes | The PIM group for AWS admin, a Session Manager shell, the narrow Azure role and its limits. | - |
| 13 | Access governance | `N10-microsoft-features.mp4` | Recorded 2026-11-15 | Yes | An access review, a package with an expiry, a refused request for two packages that conflict. | E39c, E53, E71 |
| 14 | Service accounts and robots | `N21-service-accounts.mp4` | Recorded 2026-11-15 | No | The inventory report, the findings by severity, the identities with no owner, the app management policy. | E21, E70 |
| 15 | Audit evidence | `N09-the-logbook.mp4` | Record again | No | The evidence workflow run, the seven records with hashes, a delete that the store refuses. | E06, E56, E74 |
| 16 | Detection in Sentinel | `N06-the-cameras.mp4` | Recorded 2026-11-15 | Yes | The KQL rule file, its test, the rule in Sentinel, the incident. | E15, E15b |
| 17 | Detection in Splunk | `N07-the-second-camera.mp4` | Recorded 2026-11-15 | No | The SPL search next to its KQL twin, the result in Splunk. | E59, E61, E113 |
| 18 | Contain a compromised account | `N22-contain-an-account.mp4` | Recorded 2026-11-15 | Yes | The approval card in Teams, the decision on the card, the playbook code: revoke, mark, disable. | E40, E41 |
| 19 | Change access with code | `N01-the-blueprints.mp4` | Record again | No | The edit in VS Code, the commit, the pull request, the plan comment. | E01, E02 |
| 20 | Checks on the code | `N16-code-checks.mp4` | Recorded 2026-11-15 | No | The RBAC check, the scanner self-test on a bad file, the nightly drift check. | - |
| 21 | The lab in VS Code and GitHub | `N17-close-vscode-github.mp4` | Recorded 2026-11-15 | No | The repo in VS Code, the Actions runs, the pull request list, the apply approval. | - |
| 22 | Move an app from AD FS | `N13-adfs-to-entra.mp4` | Recorded 2026-11-15 | No | The AD FS app, the Entra app as code, the test result. | - |
| 23 | Move the clinic from Okta | `N14-okta.mp4` | Recorded 2026-11-15 | No | The three apps in Okta, the tracker, the first app that trusts Entra, the rollback time. | E58, E184 |

## Record these first

These 12 chapters use features that stop on 2026-11-26. Record them before the others.

- 2. One account in two directories (`N03-one-account-two-directories`)
- 3. Access on day one (`N04-first-day-doors`)
- 4. Request more access (`N04b-the-service-desk`)
- 5. The employee changes jobs (`N20-the-employee-changes-jobs`)
- 6. The employee leaves (`N08-leaving`)
- 7. Conditional Access and MFA (`N18-conditional-access`)
- 8. Break-glass accounts (`N19-break-glass`)
- 9. Temporary admin rights (`N05-the-master-key`)
- 12. Admin access in AWS and Azure (`N15-aws-server-access-and-azure-least-privilege`)
- 13. Access governance (`N10-microsoft-features`)
- 16. Detection in Sentinel (`N06-the-cameras`)
- 18. Contain a compromised account (`N22-contain-an-account`)

## Rename the repo before you record

The new name is `Contoso-Health-Identity-Lab`. The clips show the repo name, so rename first.
The pipeline signs in to Azure with the repo name in its identity. A rename with no other change
stops the plan, apply, drift, evidence and HR workflows. Do these steps in one session on the Mac.

1. In `lab/terraform/envs/bootstrap/terraform.tfvars`, set `github_repo = "Contoso-Health-Identity-Lab"`.
2. Rename the repo: `gh repo rename Contoso-Health-Identity-Lab -R ChromeData/contoso-health-identity-lab`.
3. Apply the bootstrap at once: `terraform -chdir=lab/terraform/envs/bootstrap apply`. This gives the pipeline identities the new name.
4. Do the same for an AWS role that trusts GitHub, if `lab/terraform/aws` has one.
5. Start the plan workflow. Make sure it signs in.
6. Change the name in the code and the docs with one pull request. 51 files contain it.
7. Keep the folder name `~/contoso-health-identity-lab` on the Mac. The recorder uses that path.

If a workflow cannot sign in, rename the repo back. The old name works again at once.

## Sequence of work

All commands run in `recording/` on the Mac.

1. Get the branch: `git pull`, then `npm install`.
2. Check the steps: `npm test`.
3. Test each new part with no recording: `node cockpit.mjs --check N18`. Do the same for N19, N20, N21, N22.
4. Correct a step that fails. The web steps of N18 are the most probable to fail: they find text on Entra pages.
5. Build the speech points for the new lines: `npm run points`.
6. Record the clips: `npm run clips`. The run stops with an error and names each part that has a failed step.
7. Record N03 and N05 live. They need a person to sign in.
8. Add the captions: `npm run captions -- <dir>`.
9. Copy the clips to `demo/videos/` with the file names in the table.
10. Build the loops: `python demo/make_loops.py`.
11. Build the pages: `python demo/build_pages.py`.
12. Look at each loop before you push.

## The five new parts

N18 to N22 were written on a Windows PC from the files in the lab. The step checker passes:
each file exists and each highlight is on the correct lines. They did not run in the tenant.
N19, N20 and N21 show files only. N18 opens two web pages. N22 uses the drill steps that came from N06,
so N06 now stops at the incident.

## Rules for each clip

- Show one topic only. Stop when the chapter line is proven.
- Keep each clip shorter than 3 minutes.
- Use the neutral lab accounts. Show no personal mailbox, no public IP address, and no tenant ID.
- A step that changes the lab shows its captured screen, with a label.

The chapter list is `demo/chapters.py`. Change a title or a line there, then build the pages again.
