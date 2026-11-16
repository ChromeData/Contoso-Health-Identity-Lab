# 4. SHA-pinning rationale (supply chain)

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 4 of 7


Every third-party action is pinned to a **full 40-char commit SHA**, with the
human-readable version in a trailing comment:

```yaml
uses: azure/login@a641126d1b8aa4d1fa005f4f92df94a3a4c4c906 # v3.1.0
```

A tag like `@v2` or `@v2.3.0` is a *mutable pointer* the action's owner (or
anyone who compromises them) can re-point at new code. In **2026 the Trivy /
aquasecurity GitHub Actions were compromised** by exactly this — a tag
re-pointed to malicious code that exfiltrated CI secrets: **CVE-2026-33634**
(2026-03-19, 76 of 77 `aquasecurity/trivy-action` tags and all
`aquasecurity/setup-trivy` tags force-pushed to an infostealer; NVD /
GitHub advisory, CVSS-B 9.4, checked 2026-10-20). A commit SHA is
immutable, so a pinned SHA cannot be swapped under you. We pin **everything**,
including GitHub's own `actions/*`, not just vendor actions.

One caveat: a SHA pins the action's own code, not a container image it pulls.
TruffleHog's action runs `ghcr.io/trufflesecurity/trufflehog:<version>`
(default `latest`), so `terraform-plan.yml` pins `version:
"3.97.9@sha256:52e67fef4d054ecff5c2ce4b4ae376626d1ef54aa0898b53cac19c25e92e14db"`
and bumps it by hand with the SHA, because Dependabot does not touch that
input. `checkov-action`'s pinned `action.yml` hard-codes
`ghcr.io/bridgecrewio/checkov:3.4.3`, a tag the workflow cannot override
(verify: accepted residual risk, re-check on each bump).

Pinned set in this pipeline, exactly as in the workflow files (bump
deliberately via Dependabot, never blind-retag):

| Action | Version | Commit SHA |
|---|---|---|
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `azure/login` | v3.1.0 | `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906` |
| `hashicorp/setup-terraform` | v4.0.1 | `dfe3c3f87815947d99a8997f908cb6525fc44e9e` |
| `actions/setup-python` | v7.1.0 | `6d4fd22b20465ccc0f7354476588e8df7c9ca0e0` (`k8s-identity.yml` only: Python 3.12 for Checkov) |
| `actions/github-script` | v9.0.0 | `3a2844b7e9c422d3c10d287c895573f7108da1b3` (`ai-review.yml`, `terraform-plan.yml`); v8.0.0 `ed597411d8f924073f98dfc5c65a23a2325f34cd` (`config-drift.yml`, kept on v8 until its two issue-writing scripts are tested on v9) |
| `bridgecrewio/checkov-action` | v12.3139.0 | `45edc9d8856b664db2ec251f5f8632361f0a67aa` |
| `trufflesecurity/trufflehog` | v3.99.8 | `ea68ca03c865c5f324e86e849ced20ed3cf9dbbb` (scanner image pinned by digest: `version:` input, bumped by hand) |
| `github/codeql-action/upload-sarif` | v4.39.3 | `33d7b85da1a04171e211befe2c739303b9a4c066` |

`setup-terraform` installs **Terraform 1.16.5** in all four Terraform
workflows (`terraform-plan.yml`, `terraform-apply.yml`, `k8s-identity.yml`,
`lab-tests.yml`),
the same CLI that generated the committed `.terraform.lock.hcl` files.
`k8s-identity.yml` installs Checkov from PyPI as `checkov==3.3.20`, on a
`setup-python`-pinned Python 3.12, instead of using the action (§7);
Dependabot has no pip entry, so bump that pin by hand.

> To re-verify a SHA for a tag:
> `curl -s https://api.github.com/repos/<owner>/<repo>/git/refs/tags/<tag>`
> (dereference annotated tags via `.../git/tags/<sha>` → `.object.sha`).

**Dependabot** is configured in [`../../.github/dependabot.yml`](../../../.github/dependabot.yml):
weekly, grouped `github-actions` bumps (SHA and the `# vX.Y.Z` comment
together) plus Terraform provider bumps for `envs/dev`, `envs/bootstrap`,
`aws` and the three `k8s` roots (`platform`, `identity`, `keyvault-trust`). Pin
bumps arrive as reviewable PRs, without reintroducing floating tags. The image
digests in the Kubernetes segment (kind node, busybox, Vault Agent) are bumped
by hand.
Dependabot's own PR runs see only Dependabot secrets, so mirror the two
repository secrets there too (§5 D).

---
