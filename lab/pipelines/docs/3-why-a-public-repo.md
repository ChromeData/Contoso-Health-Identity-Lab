# 3. Why a public repo

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 3 of 7


The repo is **public on purpose**, and the pipeline depends on it:

- **Environments + required reviewers are free on public repos.** On private
  repos they need GitHub Enterprise. The apply gate is the Environment
  `prod` reviewer (below). The old private-repo gate, an "Approve:
  apply" issue (`.github/scripts/apply-approval-gate.sh`), remains in that
  script as a fallback; the workflow runs it only in `GATE_MODE=check`.

  | Role | GitHub login | Notes |
  |---|---|---|
  | Owner: reads the plan, clicks Review deployments -> Approve and deploy | `ChromeData` | Required reviewer of `prod` |
  | AI coding agents: push branches, open PRs, merge | `<slug>[bot]` via `bot-gh` once the owner creates the App; `ChromeData` until then | "Prevent self-review" stops the merger approving its own run |
  | Apply identity | APPLY app over OIDC (`environment:prod`) | Runs only after the approval |

  **History, 2026-11-07 (UTC).** While the repo was private, GitHub refused
  the reviewer rule (HTTP 422, billing plan) and rulesets (HTTP 403, account
  on GitHub Free). The owner made the repo public again at 02:31Z. Since then:

  - **The gate is GitHub's own.** Environment `prod`: required reviewer
    ChromeData, "Prevent self-review" on, "Allow administrators to bypass"
    off, deployment branches `main` only. `terraform-apply.yml` runs two
    jobs: `plan` (no environment, read-only PLAN app: plan for review +
    checks, summary in the job), then `terraform-apply` (environment `prod`:
    the run pauses on **Review deployments** before the job starts; after the
    approval it signs in as APPLY, plans again and refuses unless
    `plan-fingerprint.py` gives the same fingerprint as the reviewed plan:
    resources, actions and values; and the review plan is under 60 minutes
    old). The issue gate is kept only as `GATE_MODE=check` for its checks.
  - **Only `prod` holds the write identity.** The APPLY OIDC subject is
    `environment:prod`, so the APPLY app is reachable only after the `prod`
    reviewer approves. Keep the reviewer on `prod`. An earlier draft of this
    change moved it to a second Environment `production` and planned in
    `prod` as APPLY before the approval; that left Contributor reachable
    without an approval (Greptile, PR #241), so the draft was dropped.
  - **Ruleset `main-protection`** (active again): PR required (0 approvals:
    the owner's approval is the deployment, not the PR), the five checks in
    5F required, no force-push, no deletion, no bypass.
  - **Who is who.** "Prevent self-review" blocks the account that started the
    run, which for a push is the merger. AI agents push, open PRs and merge as
    the lab's GitHub App bot (`lab/scripts/operator/github-bot/`): the owner
    runs `new-bot-app.sh` once, agents use `bot-gh`, and the owner sets
    `APPLY_BOT_LOGIN` to `<slug>[bot]` at a PR merge (the plan job then
    refuses a change the bot did not author and merge). A run that ChromeData
    started cannot be approved by ChromeData. The recovery depends on the
    stage:
    1. **Bot exists, `APPLY_BOT_LOGIN` not set yet** (the transition). The
       gate does not check author or merger. Start a new run as the bot with
       a repository dispatch,
       `bot-gh gh api repos/ChromeData/contoso-health-identity-lab/dispatches -f event_type=apply-main`;
       ChromeData then approves it.
    2. **`APPLY_BOT_LOGIN` set.** The plan job refuses any run whose commit
       came from a PR that the bot did not author AND merge, whoever starts
       the run. That is on purpose: a dispatch must not launder an
       owner-merged change past the separation check. So a dispatch does not
       help here. Recovery: the bot lands the change again through its own PR
       (`bot-gh` branch, PR and merge, for example a revert and a re-apply
       PR), and that merge starts a run the owner can approve. Rule: once
       `APPLY_BOT_LOGIN` is set, the owner never merges.
    Set `APPLY_BOT_LOGIN` at a merge that the bot itself makes, so the first
    gated run already passes the check.
    **Status (2026-11-08): stage 2.** `APPLY_BOT_LOGIN` is
    `contoso-health-lab-bot[bot]`, set at the #241 merge. Each catch-up run
    is a dispatch on a commit whose PR the bot authored and merged (for
    example #259, #271).
    Why not `gh workflow run`: that needs the App permission Actions: write,
    and the bot has Actions: read. A repository dispatch needs only Contents:
    write, which the bot already has (GitHub docs, "Permissions required for
    GitHub Apps"). Actions: write would also let the bot delete workflow run
    logs (the apply audit trail) and disable workflows, so it stays read.
    The dispatched run uses `main`'s copy of the workflow on `main`'s last
    commit, and waits for the same `prod` approval.
  - **What stays procedure.** GitHub tells accounts apart, not people. While
    the owner's own `gh` login is on the machine the agents use, an agent
    could approve with it. The owner's fix: once `bot-gh` works, sign the
    agents' machine out of his `gh` login and approve only in his browser.
- **Branch protection / rulesets** (require PR, require status checks, require
  review) are free on public repos.
- **Code scanning (SARIF upload)** — the Checkov results under the *Security &
  quality* tab (labelled *Security* before 2026-04-02) —
  is free for public repos; on private repos it needs GitHub Advanced Security.
- It doubles as a **portfolio artifact**: hiring managers can read the actual
  OIDC wiring. Because there are no secrets in the repo, public is safe — the
  worst an attacker can do with the config is read how good it is.

---
