"""The chapter list. The README, the loops and the recording plan are all built from this file.

Each chapter: group, title, summary (table), line (one sentence under the title), clip (file name in
demo/videos, no extension), length (None = no clip yet), needs_trial (the feature stops when the
Entra trials end), show (what the clip must show), evidence (rows in lab/evidence/capture-log.csv).
"""
import re

GROUPS = ["Identity lifecycle", "Sign-in security", "Privileged access", "Governance and audit",
          "Detect and respond", "Platform as code", "Migrations"]

_ROWS = [
    # ---- Identity lifecycle
    (0, "HR hires an employee", "HR adds Sam. No person sets a password.",
     "HR adds Sam Rivera in OrangeHRM. The form has no password field, and no ticket goes to IT.",
     "N02-hired", "2:03", False,
     "The OrangeHRM hire form (name, job, manager), then the connector log that sends the hire.", "E91"),
    (0, "One account in two directories", "Active Directory gets the account first, then Entra ID.",
     "The new account goes to Active Directory first. Cloud Sync then makes the same account in Entra ID.",
     "N03-one-account-two-directories", None, True,
     "Sam in Active Directory, the Cloud Sync log, then Sam in Entra ID. Needs a live sign-in as Sam.", "E52"),
    (0, "Access on day one", "Sam gets access from his job title.",
     "Sam gets access from his job title: an access package, AWS sign-in through Entra, and read-only access to the patient portal.",
     "N04-first-day-doors", "1:40", True,
     "The automatic access package, My Apps, the AWS sign-in through Entra, the patient portal.", "E19, E22, E23"),
    (0, "Request more access", "A nurse asks, her manager approves, Entra gives the access.",
     "A nurse asks for ICU apps in ServiceNow. Her manager approves, and Entra gives the access.",
     "N04b-the-service-desk", "3:12", True,
     "The ServiceNow request, the manager approval, the access package assignment in Entra.", "E92"),
    (0, "The employee changes jobs", "HR moves a nurse to a new department. The access follows.",
     "HR moves a nurse from Nursing to ICU. The account gets the ICU access package from the new department.",
     "N20-the-employee-changes-jobs", None, True,
     "The department change in HR, the provisioning log, the new department in Entra, the ICU package.", "E52"),
    (0, "The employee leaves", "Four systems disable the account with no ticket.",
     "HR ends Sam's job. Active Directory, Entra, ServiceNow, and AWS each disable the account, with no ticket.",
     "N08-leaving", "0:56", True,
     "The termination in HR, then the account disabled in AD, Entra, ServiceNow and AWS, with the times.", "E52, E187"),
    # ---- Sign-in security
    (1, "Conditional Access and MFA", "Eleven sign-in policies as code. Nine are enforced.",
     "Eleven sign-in policies are code. Each policy starts in report-only mode, and nine are enforced.",
     "N18-conditional-access", None, True,
     "The policy list in Entra, one policy in Terraform, one pull request that enforces a policy, a sign-in log entry.", "E12, E30"),
    (1, "Break-glass accounts", "Two emergency accounts, out of all policies, with an alarm.",
     "Two emergency admin accounts are out of all 11 policies. A drill examines them, and a Sentinel rule reports each sign-in.",
     "N19-break-glass", None, True,
     "The two accounts, the exclusion test in Terraform, the drill output, the Sentinel rule.", "E49"),
    # ---- Privileged access
    (2, "Temporary admin rights", "An admin activates a role for a limited time.",
     "An admin has no standing rights. He activates the help-desk role in PIM for a limited time, with a reason.",
     "N05-the-master-key", None, True,
     "The eligible role in PIM, the activation with a reason, the active role. Needs a live admin sign-in as Raj.", "E16, E72"),
    (2, "Admin passwords and recorded sessions", "Secrets in a vault, sessions on record.",
     "Key Vault holds the admin secrets, Terraform reads a secret and keeps no copy, and Azure Bastion records the admin session.",
     "N11-admin-passwords-and-sessions", "3:14", False,
     "The Key Vault secrets, the Terraform state with no password, the Bastion session recording.", "E182, E186"),
    (2, "Harden Active Directory", "Admin tiers on the domain controller.",
     "Admin tiers on the domain controller keep top admins off lower-tier computers. A scan shows the state before and after.",
     "N12-hardening-ad", "1:55", False,
     "The tier groups and the policy on DC01, a refused sign-in, the scan before and after.", ""),
    (2, "Admin access in AWS and Azure", "Temporary server access and a narrow role.",
     "A server shell in AWS opens only through Session Manager, during a temporary admin window. Azure uses a narrow operator role.",
     "N15-aws-server-access-and-azure-least-privilege", "1:35", True,
     "The PIM group for AWS admin, a Session Manager shell, the narrow Azure role and its limits.", ""),
    # ---- Governance and audit
    (3, "Access governance", "Reviews, expiry, and blocked combinations.",
     "Access reviews, access that expires, and blocked combinations of access, each configured as code.",
     "N10-microsoft-features", "2:57", True,
     "An access review, a package with an expiry, a refused request for two packages that conflict.", "E39c, E53, E71"),
    (3, "Service accounts and robots", "An inventory of 19 non-human identities, with findings.",
     "An inventory lists 19 non-human identities and gives 27 findings. Eight identities have no owner.",
     "N21-service-accounts", None, False,
     "The inventory report, the findings by severity, the identities with no owner, the app management policy.", "E21, E70"),
    (3, "Audit evidence", "Seven records go to a write-once store.",
     "One click files seven evidence records in a write-once store. Each record has a SHA-256 hash.",
     "N09-the-logbook", "1:59", False,
     "The evidence workflow run, the seven records with hashes, a delete that the store refuses.", "E06, E56, E74"),
    # ---- Detect and respond
    (4, "Detection in Sentinel", "A rule in code opens an incident.",
     "A detection rule, written as code, finds an admin activation and opens an incident in Microsoft Sentinel.",
     "N06-the-cameras", "3:15", True,
     "The KQL rule file, its test, the rule in Sentinel, the incident.", "E15, E15b"),
    (4, "Detection in Splunk", "The same rules run in a second SIEM.",
     "The same rules, in the Splunk search language, run on the same tenant logs.",
     "N07-the-second-camera", "1:12", False,
     "The SPL search next to its KQL twin, the result in Splunk.", "E59, E61, E113"),
    (4, "Contain a compromised account", "A person approves in Teams. A playbook disables the account.",
     "A Sentinel incident asks a named approver in Teams. After the approval, a playbook revokes the sessions and disables the account.",
     "N22-contain-an-account", None, True,
     "The approval card in Teams, the decision on the card, the playbook code: revoke, mark, disable.", "E40, E41"),
    # ---- Platform as code
    (5, "Change access with code", "A Terraform change goes from commit to pull request to plan.",
     "A Terraform change moves AWS access from nurses to cloud engineers, from commit to pull request to plan.",
     "N01-the-blueprints", "3:27", False,
     "The edit in VS Code, the commit, the pull request, the plan comment.", "E01, E02"),
    (5, "Checks on the code", "Scanners that must fail on a bad file.",
     "A Kubernetes permission check, and scanners that must fail on an unsafe file before the pipeline trusts them.",
     "N16-code-checks", "1:29", False,
     "The RBAC check, the scanner self-test on a bad file, the nightly drift check.", ""),
    (5, "The lab in VS Code and GitHub", "The code, the pipeline, and the approval.",
     "The code in VS Code, the GitHub Actions runs, the pull requests, and the approval before each apply.",
     "N17-close-vscode-github", "1:18", False,
     "The repo in VS Code, the Actions runs, the pull request list, the apply approval.", ""),
    # ---- Migrations
    (6, "Move an app from AD FS", "One app moves to Entra.",
     "One app moves from AD FS, an older sign-in server, to Entra. The build and the tests are complete. The cut-over did not run.",
     "N13-adfs-to-entra", "1:33", False,
     "The AD FS app, the Entra app as code, the test result.", ""),
    (6, "Move the clinic from Okta", "Three Okta apps and their move to Entra.",
     "The hospital bought a clinic with three apps in Okta. A tracker from live reads shows their move to Entra.",
     "N14-okta", "1:48", False,
     "The three apps in Okta, the tracker, the first app that trusts Entra, the rollback time.", "E58, E184"),
]


def _slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


CHAPTERS = [
    dict(n=i, group=GROUPS[g], title=title, summary=summary, line=line, clip=clip, length=length,
         needs_trial=trial, show=show, evidence=evidence, loop=f"{i:02d}-{_slug(title)}",
         anchor=f"{i}-{_slug(title)}")
    for i, (g, title, summary, line, clip, length, trial, show, evidence) in enumerate(_ROWS, 1)
]
