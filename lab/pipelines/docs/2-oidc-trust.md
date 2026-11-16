# 2. OIDC trust (workload identity federation)

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 2 of 7


No client secret, no certificate, no PAT. GitHub mints a short-lived OIDC token
per job (`permissions: id-token: write`); Entra trusts it because a **federated
credential** on the app registration matches the token's `sub` (subject) and
`iss` (`https://token.actions.githubusercontent.com`), `aud`
(`api://AzureADTokenExchange`).

These **federated credentials** are created by Terraform in
[`../terraform/envs/bootstrap`](../../terraform/envs/bootstrap) from
`github_owner` / `github_repo` (the public lab repo, default name
`contoso-health-identity-lab`). The subjects must match the repo exactly:

| App | Credential subject (`sub`) | Why |
|---|---|---|
| PLAN app | `repo:OWNER@OWNER_ID/REPO@REPO_ID:pull_request` | same-repo PRs can plan (read-only); fork PRs get no OIDC token |
| PLAN app | `repo:OWNER@OWNER_ID/REPO@REPO_ID:ref:refs/heads/main` | the nightly `config-drift.yml` and the review `plan` job of `terraform-apply.yml` (no environment) run on main; still read-only. Missing = AADSTS700213 |
| APPLY app | `repo:OWNER@OWNER_ID/REPO@REPO_ID:environment:prod` | only the `prod` deploy can apply |
| HR-SYNC app (opt-in) | `repo:OWNER@OWNER_ID/REPO@REPO_ID:ref:refs/heads/hr-feed` | `hr-feed.yml` uploads changed HR rows (SCIM bulkUpload) and reads the provisioning log; nothing else. Protect the branch with a ruleset |
| EVIDENCE app (opt-in) | `repo:OWNER@OWNER_ID/REPO@REPO_ID:ref:refs/heads/main` | `evidence-pack.yml` (manual, main only) reads the evidence pack (six read-only Graph roles) and adds it to the WORM evidence container (create-only ABAC grant); nothing else |

Why the numeric ids: GitHub.com emits this immutable form by default for repos
created (or renamed / transferred) after 2026-07-15, and because the ids are
never reused it also blocks subject recycling (a deleted, re-registered owner
or repo name cannot mint a matching token). verify: confirm both subjects with
GitHub's OIDC subject preview before the first PR.

The main-ref PLAN subject is created by default (config-drift). HR-SYNC
exists only with `enable_hr_sync = true` in envs/bootstrap
(`lab/scripts/mock-hr/README.md`, *HR changes through GitHub Actions*),
EVIDENCE only with `enable_evidence_pack = true`
(`lab/evidence/README.md`, *Evidence pack from GitHub Actions*).

Issuer / audience for all of them:

```
Issuer:   https://token.actions.githubusercontent.com
Audience: api://AzureADTokenExchange
```

The `environment:prod` subject is the keystone: GitHub only puts
`environment:prod` in the token's `sub` when a job declares
`environment: prod`, and every such job waits for the required reviewer. So
the write identity is unreachable without passing the human gate, and `prod`
accepts deployments from `main` only (§5E). That is why the review plan job
declares NO environment and signs in as the read-only PLAN app: if it ran in
`prod`, either it would pause before any plan exists (karen A2) or `prod`
would need its reviewer removed, and then any workflow on `main` could sign
in as APPLY without an approval.

---
