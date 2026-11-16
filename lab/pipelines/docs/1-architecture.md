# 1. Architecture

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 1 of 7


```
          Pull request  (feature branch -> main)
          ───────────────────────────────────────────────────────────
          every PR (plan, Checkov + AI review only if lab/terraform/** changed)
                │
    ┌───────────┼───────────────────────────────┬──────────────────────┐
    ▼           ▼                                 ▼                      ▼
 terraform-plan.yml                          ai-review.yml         (branch
   • fmt -check                                • OIDC login          protection
   • init / validate                             (PLAN app)          requires
   • plan  ──► PR comment                       • az get-access-      the 5 checks
   • Checkov  ──► code scanning (SARIF)           token (Entra)       green; 0
   • TruffleHog ──► fail on verified secret      • diff -> Azure       approvals on
        (PLAN app, READ-ONLY, OIDC)               OpenAI -> PR        a solo repo,
                                                  comment (advisory)  see §5 F)
                │
                ▼
          Review + approve, merge to main
                │
                ▼
          Push to main
          ───────────────────────────────────────────────────────────
 terraform-apply.yml
   • environment: prod   ⟵ REQUIRED REVIEWER GATE (run pauses here)
   • OIDC login (APPLY app, WRITE)
   • init / plan -out / apply
   • automatic access rules (Set-AutoAssignmentPolicies.ps1, app-only)
   • step summary
                │
                ▼
          Entra ID + Azure tenant changed
                │
                ▼
          Detections (lab/kql) fire in Log Analytics / Sentinel
          ──► notify Logic App ──► Teams card + ServiceNow ticket
          ──► (High ITDR incident, enable_itdr_containment) containment
              Logic App ──► Teams approval ──► revoke / confirm compromised / disable
```

Not drawn: `lab-tests.yml` runs on every PR and push to `main` with **no
credentials** (fmt, validate and every mocked `terraform test`, the Pester
suites, the shell tests and the Splunk drift check). Its two checks are the
4th and 5th required checks (§5 F).

Also not drawn: `config-drift.yml`, the **nightly reconcile**. The
detections at the bottom of the diagram fire when a change is made; the
reconcile catches what they missed. Every night (and on demand) it signs in
as the read-only PLAN app over OIDC, exports the tenant's Conditional
Access, named locations, authentication strengths and methods, PIM policies,
consent / app-management / cross-tenant policies and break-glass exclusion
facts as one normalised snapshot with every id hashed
(`Export-IdentityConfig.ps1 -Public`), compares it with the committed
baseline (`lab/config-baseline/identity-config.json`) and with the states
declared in `lab.tfvars` (`Compare-IdentityConfig.ps1`), uploads the
snapshot as a run artifact (never commits it), and on High or Medium drift
opens or updates one issue labelled `identity-drift`. Accepted differences
live in `lab/config-baseline/drift-exceptions.json` with an owner and an
expiry (90 days High, 180 Medium / Low): when the exception expires, the
finding comes back by itself. Until the first tenant export is committed the
baseline is a placeholder and the job succeeds with "no baseline yet". The
loop is described in
[`../scripts/powershell/README.md`](../../scripts/powershell/README.md#configuration-drift-export-compare-nightly-reconcile).
BUILT; no workflow has run yet.

The reviewer approves the run before it re-plans. The applied plan is the fresh
one on `main`, not the PR comment's; drift since the PR (portal edits, other
merges) is applied without a second look and is visible in the plan step's log.

**Two identities, two triggers, least privilege:**

| App registration | Permissions | Runs on | Workflow |
|---|---|---|---|
| **PLAN app** | read-only (Graph read, Reader, Storage Blob Data Reader on state: it can read state, which holds the generated passwords) | `pull_request` | `terraform-plan.yml`, `ai-review.yml` |
| **APPLY app** | write (Graph write, Contributor/role mgmt) | `push` to `main` (or manual dispatch of `main`), via `prod` env, which only `main` may deploy to | `terraform-apply.yml` |

Only a same-repo PR can assume the **read-only** PLAN identity. A fork PR gets
a read-only `GITHUB_TOKEN` and no OIDC token at all (GitHub downgrades write
permissions, `id-token: write` included, on fork `pull_request` runs), so it
reaches neither identity: if it touches `lab/terraform/**`, its `terraform
plan` check fails by design until a maintainer pushes the branch to this repo
(verify: on the first fork PR). The APPLY app's federated credential is scoped
to the `prod` environment, which only the `push`/apply job references.

---
