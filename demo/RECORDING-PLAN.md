# Recording plan

One clip for each chapter of the README. The Entra trials end on 2026-11-26. Record the chapters
with **Yes** in the trial column before that date. Those features stop when the trials end.

| # | Chapter | Clip file in `demo/videos/` | Status | Trial | The clip must show | Evidence |
|---|---|---|---|---|---|---|
| 1 | HR hires an employee | `N02-hired.mp4` | Record again | No | The OrangeHRM hire form (name, job, manager), then the connector log that sends the hire. | E91 |
| 2 | One account in two directories | `N03-one-account-two-directories.mp4` | Not recorded (live sign-in) | Yes | Sam in Active Directory, the Cloud Sync log, then Sam in Entra ID. Needs a live sign-in as Sam. | E52 |
| 3 | Access on day one | `N04-first-day-doors.mp4` | Record again | Yes | The automatic access package, My Apps, the AWS sign-in through Entra, the patient portal. | E19, E22, E23 |
| 4 | Request more access | `N04b-the-service-desk.mp4` | Record again | Yes | The ServiceNow request, the manager approval, the access package assignment in Entra. | E92 |
| 5 | The employee changes jobs | `N20-the-employee-changes-jobs.mp4` | New part: write its steps | Yes | The department change in HR, the provisioning log, the new department in Entra, the ICU package. | E52 |
| 6 | The employee leaves | `N08-leaving.mp4` | Record again | Yes | The termination in HR, then the account disabled in AD, Entra, ServiceNow and AWS, with the times. | E52, E187 |
| 7 | Conditional Access and MFA | `N18-conditional-access.mp4` | New part: write its steps | Yes | The policy list in Entra, one policy in Terraform, one pull request that enforces a policy, a sign-in log entry. | E12, E30 |
| 8 | Break-glass accounts | `N19-break-glass.mp4` | New part: write its steps | Yes | The two accounts, the exclusion test in Terraform, the drill output, the Sentinel rule. | E49 |
| 9 | Temporary admin rights | `N05-the-master-key.mp4` | Not recorded (live sign-in) | Yes | The eligible role in PIM, the activation with a reason, the active role. Needs a live admin sign-in as Raj. | E16, E72 |
| 10 | Admin passwords and recorded sessions | `N11-admin-passwords-and-sessions.mp4` | Record again | No | The Key Vault secrets, the Terraform state with no password, the Bastion session recording. | E182, E186 |
| 11 | Harden Active Directory | `N12-hardening-ad.mp4` | Record again | No | The tier groups and the policy on DC01, a refused sign-in, the scan before and after. | - |
| 12 | Admin access in AWS and Azure | `N15-aws-server-access-and-azure-least-privilege.mp4` | Record again | Yes | The PIM group for AWS admin, a Session Manager shell, the narrow Azure role and its limits. | - |
| 13 | Access governance | `N10-microsoft-features.mp4` | Record again | Yes | An access review, a package with an expiry, a refused request for two packages that conflict. | E39c, E53, E71 |
| 14 | Service accounts and robots | `N21-service-accounts.mp4` | New part: write its steps | No | The inventory report, the findings by severity, the identities with no owner, the app management policy. | E21, E70 |
| 15 | Audit evidence | `N09-the-logbook.mp4` | Record again | No | The evidence workflow run, the seven records with hashes, a delete that the store refuses. | E06, E56, E74 |
| 16 | Detection in Sentinel | `N06-the-cameras.mp4` | Record again | Yes | The KQL rule file, its test, the rule in Sentinel, the incident. | E15, E15b |
| 17 | Detection in Splunk | `N07-the-second-camera.mp4` | Record again | No | The SPL search next to its KQL twin, the result in Splunk. | E59, E61, E113 |
| 18 | Contain a compromised account | `N22-contain-an-account.mp4` | New part: write its steps | Yes | The incident, the approval card in Teams, the playbook run, the state of the account. | E40 |
| 19 | Change access with code | `N01-the-blueprints.mp4` | Record again | No | The edit in VS Code, the commit, the pull request, the plan comment. | E01, E02 |
| 20 | Checks on the code | `N16-code-checks.mp4` | Record again | No | The RBAC check, the scanner self-test on a bad file, the nightly drift check. | - |
| 21 | The lab in VS Code and GitHub | `N17-close-vscode-github.mp4` | Record again | No | The repo in VS Code, the Actions runs, the pull request list, the apply approval. | - |
| 22 | Move an app from AD FS | `N13-adfs-to-entra.mp4` | Record again | No | The AD FS app, the Entra app as code, the test result. | - |
| 23 | Move the clinic from Okta | `N14-okta.mp4` | Record again | No | The three apps in Okta, the tracker, the first app that trusts Entra, the rollback time. | E58, E184 |

## Sequence of work

1. Add the five new parts to `recording/steps.mjs`: N18, N19, N20, N21, N22.
2. Record all the clips: `npm run clips` in `recording/`.
3. Record N03 and N05 live. They need a person to sign in.
4. Add the captions: `npm run captions -- <dir>`.
5. Copy the clips to `demo/videos/` with the file names in the table.
6. Build the loops: `python demo/make_loops.py`.
7. Build the pages: `python demo/build_pages.py`.
8. Look at each loop before you push. A clip with a failed step must be recorded again.

## Rules for each clip

- Show one topic only. Stop when the chapter line is proven.
- Keep each clip shorter than 3 minutes.
- Use the neutral lab accounts. Show no personal mailbox, no public IP address, and no tenant ID.
- A step that changes the lab shows its captured screen, with a label.

The chapter list is `demo/chapters.py`. Change a title or a line there, then build the pages again.
