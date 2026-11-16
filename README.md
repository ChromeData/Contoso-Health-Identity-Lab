# Contoso Health Identity Lab

**IAM and PAM lab · Microsoft Entra ID · identity as code**

Michael Williams · Microsoft SC-300 · CyberArk Guardian, Sentry, Defender

I built an identity platform for a fictional hospital with 5,000 employees. It runs in a real
Microsoft Entra tenant, and all of it is code. The clips follow one new employee, Sam Rivera, from
hire to departure. **In the first measured leaver run, for nurse Dana Okafor, Active Directory
disabled the account in 7 seconds and Entra in less than 3 minutes.**

The 23 chapters show the lab in operation. Each chapter has its own page: a short clip, and links
to the code, the test, the evidence and the decision behind it.

| Part | Chapter | Summary |
|---|---|---|
| Identity lifecycle | [1. HR hires an employee](demo/chapters/01-hr-hires-an-employee.md) | HR adds Sam. No person sets a password. |
| Identity lifecycle | [2. One account in two directories](demo/chapters/02-one-account-in-two-directories.md) | Active Directory gets the account first, then Entra ID. |
| Identity lifecycle | [3. Access on day one](demo/chapters/03-access-on-day-one.md) | Sam gets access from his job title. |
| Identity lifecycle | [4. Request more access](demo/chapters/04-request-more-access.md) | A nurse asks, her manager approves, Entra gives the access. |
| Identity lifecycle | [5. The employee changes jobs](demo/chapters/05-the-employee-changes-jobs.md) | HR moves a nurse to a new department. The access follows. |
| Identity lifecycle | [6. The employee leaves](demo/chapters/06-the-employee-leaves.md) | Four systems disable the account with no ticket. |
| Sign-in security | [7. Conditional Access and MFA](demo/chapters/07-conditional-access-and-mfa.md) | Eleven sign-in policies as code. Nine are enforced. |
| Sign-in security | [8. Break-glass accounts](demo/chapters/08-break-glass-accounts.md) | Two emergency accounts, out of all policies, with an alarm. |
| Privileged access | [9. Temporary admin rights](demo/chapters/09-temporary-admin-rights.md) | An admin activates a role for a limited time. |
| Privileged access | [10. Admin passwords and recorded sessions](demo/chapters/10-admin-passwords-and-recorded-sessions.md) | Secrets in a vault, sessions on record. |
| Privileged access | [11. Harden Active Directory](demo/chapters/11-harden-active-directory.md) | Admin tiers on the domain controller. |
| Privileged access | [12. Admin access in AWS and Azure](demo/chapters/12-admin-access-in-aws-and-azure.md) | Temporary server access and a narrow role. |
| Governance and audit | [13. Access governance](demo/chapters/13-access-governance.md) | Reviews, expiry, and blocked combinations. |
| Governance and audit | [14. Service accounts and robots](demo/chapters/14-service-accounts-and-robots.md) | An inventory of 19 non-human identities, with findings. |
| Governance and audit | [15. Audit evidence](demo/chapters/15-audit-evidence.md) | Seven records go to a write-once store. |
| Detect and respond | [16. Detection in Sentinel](demo/chapters/16-detection-in-sentinel.md) | A rule in code opens an incident. |
| Detect and respond | [17. Detection in Splunk](demo/chapters/17-detection-in-splunk.md) | The same rules run in a second SIEM. |
| Detect and respond | [18. Contain a compromised account](demo/chapters/18-contain-a-compromised-account.md) | A person approves in Teams. A playbook disables the account. |
| Platform as code | [19. Change access with code](demo/chapters/19-change-access-with-code.md) | A Terraform change goes from commit to pull request to plan. |
| Platform as code | [20. Checks on the code](demo/chapters/20-checks-on-the-code.md) | Scanners that must fail on a bad file. |
| Platform as code | [21. The lab in VS Code and GitHub](demo/chapters/21-the-lab-in-vs-code-and-github.md) | The code, the pipeline, and the approval. |
| Migrations | [22. Move an app from AD FS](demo/chapters/22-move-an-app-from-ad-fs.md) | One app moves to Entra. |
| Migrations | [23. Move the clinic from Okta](demo/chapters/23-move-the-clinic-from-okta.md) | Three Okta apps and their move to Entra. |

Design decisions and risks: [36 decision records](lab/docs/adr/README.md) · [threat model](lab/docs/threat-model.md) · [risk register](lab/docs/risk-register.md) · [field notes](lab/docs/field-notes.md)

---

What is in each folder: [`lab/README.md`](lab/README.md).
Results, limits, and evidence: [`lab/docs/platform-details.md`](lab/docs/platform-details.md).
How the clips are made: [`demo/README.md`](demo/README.md).
