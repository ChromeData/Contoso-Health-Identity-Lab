# Security notes

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 11 of 11


- **Break-glass exclusion** is wired on every CA policy via the group object
  id — the one invariant that prevents a CA lockout.
- **Least privilege:** every privileged role is reached through one
  just-in-time PIM-for-Groups activation, tiered by what the role can reach
  (Global Administrator only through named, expiring eligibility; break-glass
  is the one standing holder); the Key Vault UAMI gets *Secrets
  User* ABAC-limited to its own secret name(s) only; the CI **plan** identity is
  read-only (it can read, never write, Terraform state - which holds
  generated initial passwords, so any same-repo PR run can read them), the **apply**
  identity is gated to the `prod` GitHub environment, can only delegate the two
  Key Vault data roles and *Virtual Machine Administrator Login* (for the
  Intune VM), and cannot change its own app, federation or RBAC through a PR
  (those live in human-applied `envs/bootstrap`). That is change control, not
  a privilege boundary: `RoleManagement.ReadWrite.Directory` makes APPLY
  effectively Tier 0, and subscription Contributor lets it delete or cap
  `loga-idlab`. The ABAC condition limits
  *which* role, not the scope or the principal, so a compromised APPLY
  identity could grant admin sign-in to any Entra-joined VM in the
  subscription (today only the Intune VM); accepted for the lab and documented
  in `envs/bootstrap/main.tf`. CI never holds AWS
  credentials: `aws/` is applied by a human from a short-lived SSO session.
- **CA005 is pilot-scoped.** It targets `CA005-Pilot-CompliantDevice`, never
  all admins, so enforcing it does not lock out an operator who administers
  from an unmanaged Mac (keep your own admin account out of the pilot group).
- **Report-only first:** every CA policy ships report-only; enforcement is a
  one-line `lab.tfvars` PR per policy.
- **No secrets in code.** Passwords are generated (`random_password`) and land
  only in state; state lives in the locked, versioned remote backend (the
  `aws/` root keeps a local, gitignored state with no secrets in it);
  `terraform.tfvars` / `*.auto.tfvars` are gitignored; `lab.tfvars` (policy
  knobs only) is committed.
- **No invented resources.** Where a provider resource was uncertain it is left
  as a commented stub tagged *“verify against provider docs,”* never guessed.
