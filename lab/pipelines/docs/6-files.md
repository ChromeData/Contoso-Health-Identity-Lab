# 6. Files in / driving this pipeline

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 6 of 7


| Path | Purpose |
|---|---|
| `../../.github/workflows/terraform-plan.yml` | every PR: TruffleHog; if `lab/terraform/**` changed, also fmt/init/validate/plan + Checkov |
| `../../.github/workflows/terraform-apply.yml` | main: reviewer-gated OIDC apply (a push that touches only `lab/terraform/aws/**` or `lab/terraform/k8s/**` doesn't start it); after a successful apply, the same job (fresh APPLY sign-in, app-only Graph token) writes the birthright automatic assignment policies with `Set-AutoAssignmentPolicies.ps1`, and the Apply summary says in plain English who each changed package now goes to. Not `continue-on-error`: a refused or failed rule turns the run red, the summary says the Terraform part is live |
| `../../.github/workflows/ai-review.yml` | same-repo PR touching `lab/terraform/**`: Azure OpenAI (Entra-auth) security review |
| `./ai-review/review.py` | stdlib script that calls Azure OpenAI with the Entra bearer token |
| `../../.github/workflows/k8s-identity.yml` | PR touching `lab/k8s/**` or `lab/terraform/k8s/**` (or manual): runs `../k8s/ci/pipeline.sh` on an ephemeral kind cluster, no cloud credentials (§7) |
| `../../.github/workflows/lab-tests.yml` | every PR and main, **no credentials**: `terraform fmt`, `init -backend=false` + `validate` in every root and module, every mocked `terraform test`; PSScriptAnalyzer + the Pester suites (`lab/scripts/powershell/tests`, ITDR, PAM dependency scan) with pinned modules; the vault-ingest shell test and the Splunk savedsearches drift check; and the **scanner positive control** (job `scanner-positive-control`, below) |
| `./scanner-selftest/` | Positive control for the merge gate ([ADR 0026](../../docs/adr/0026-positive-controls-every-check-seen-to-fail.md)). `selftest.sh` runs the gate's own Checkov 3.3.3 and TruffleHog 3.97.9 images (digest-pinned, `--network none`) on `fixtures/bad` (RDP and SSH open to the internet, plus a private key generated at run time, never committed) and `fixtures/good`. It fails if either scanner finds 0 on bad, flags good, crashes or scans nothing. It counts findings from each tool's JSON and never trusts the exit code alone. `tests/selftest.test.sh` (stub scanners, in the shell-test step) proves the self-test itself fails on each of those. Honest limit: the gate's TruffleHog fails only on **verified** (live) secrets, which no planted key can be, so the self-test proves the detector, not the verified-only block. RAN · harness locally 2026-11-06 (L09); the CI job runs first on its own PR |
| `../../.github/workflows/pam-harness.yml` | manual and nightly, **no credentials**: `lab/pam/test/run-all.sh` (default suites) from a fresh clone on a fresh runner: no `.env`, no `.secrets/`, no Docker volumes. Its console output and per-suite job summary are the third-party-timestamped run of the PAM harness. BUILT, not run (no workflow has run yet) |
| `../../.github/workflows/hr-feed.yml` | push to the `hr-feed` branch changing `lab/scripts/mock-hr/hr_feed.csv` (or manual, dry run by default): **HR-SYNC app (OIDC), no secrets**: sends only the changed rows to Entra API-driven inbound provisioning (mass-change guard first), waits up to 3 min for the provisioning log, writes a plain-English job summary (names, title, department only). `actions: read` finds the last successful send (the diff base). Concurrency group `hr-feed`, never cancelled |
| `../../.github/workflows/evidence-pack.yml` | manual, **main only**, **EVIDENCE app (OIDC), no secrets**: `Export-EvidencePack.ps1 -UseAzureCliToken` (seven read-only Graph collections, SHA-256 manifest), then `Publish-EvidencePack.ps1` files every file as a new blob in the WORM evidence container under `evidence-packs/<UTC date>/<time>-run<id>-<attempt>/` (overwrite refused, each file read back and re-hashed, the store's retention lock read per file), then a plain-English job summary (counts only) with a portal link. The pack never goes to GitHub artifacts. Concurrency group `evidence-pack`, never cancelled. BUILT, not run |
| `../../.github/workflows/config-drift.yml` | nightly and manual, **PLAN app (read-only, OIDC), no secrets**: `Export-IdentityConfig.ps1 -Public` then `Compare-IdentityConfig.ps1` against `lab/config-baseline/`; snapshot + findings as a run artifact, Markdown in the job summary, one `identity-drift` issue on drift (closed by the next clean run). Needs `issues: write` on the job. Succeeds with a notice while the baseline is the placeholder. BUILT, not run |

**Not planned or applied by CI: `lab/terraform/aws/`.** The AWS IAM Identity
Center root is applied by a human from a short-lived `aws sso login` session.
CI still runs `fmt -check -recursive` and Checkov over it, because both cover
all of `lab/terraform/**`. The GitHub OIDC → AWS IAM role pattern for a team
setup is built but off (`enable_github_oidc = false`, human-applied, plan
runs only) in `../terraform/aws/github-oidc.tf`; see `../terraform/aws/README.md`.

**AI review provider note:** GitHub Models was retired **2026-07-30**, so the
review model runs on **Azure OpenAI**, authenticated with the same Entra OIDC
identity (no api-key). An **Anthropic-API fallback** is included as commented
config in `ai-review.yml` — it is key-based, so it is left disabled to preserve
the "no stored credentials" property.

---
