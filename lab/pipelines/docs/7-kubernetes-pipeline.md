# 7. Kubernetes workload identity pipeline (`k8s-identity.yml`)

[CI/CD pipeline — Contoso Health Identity Platform](../README.md) · page 7 of 7


A separate, self-contained workflow for the Kubernetes segment
([`../k8s/README.md`](../../k8s/README.md)). It holds **no identity at all**:
`contents: read`, no `id-token: write`, no secrets, no variables. The job
installs pinned Terraform and Checkov and runs
[`../k8s/ci/pipeline.sh`](../../k8s/ci/pipeline.sh), the same script a human
runs locally. The script builds a kind cluster on the runner (the AKS
stand-in, see [`../docs/STAND-INS.md`](../../docs/STAND-INS.md)), applies the
`platform` and `identity` roots under `lab/terraform/k8s`, seeds one secret
into Vault, deploys the workload, runs the end-to-end tests and tears
everything down. Every stage prints PASS/FAIL with its timing, and a summary
table ends the run (stage list: [`../k8s/README.md`](../../k8s/README.md) §5).
Two of the checks guard the cluster's configuration rather than the workload.
**Admission:** a ValidatingAdmissionPolicy in the `identity` root
(`clinical-apps-workload-identity`) denies images not pinned by digest,
unapproved images under the `nightly-report` service account, token
automount, and any creation of or change to a `nightly-report` workload by
anyone but the pipeline's identity; server-side dry runs prove each denial. **Drift detection:** a
stage edits the deployers' RoleBinding out of band as the kind admin (it adds
a user, `mallory`). `terraform plan -detailed-exitcode` must then exit 2
(`DRIFT DETECTED`), an apply heals the change, and the next plan must exit 0.

- **Not a required check.** It is path-filtered (`lab/k8s/**`,
  `lab/terraform/k8s/**`, the workflow itself), and a path-filtered required
  check stays *Pending* on PRs it skips (§5 F). So the ruleset on `main`
  keeps its three required checks. To require it, drop
  `paths:` and add job-level change detection as `terraform-plan.yml` does.
- **Fork PRs** run this workflow in full: with no credentials in the job,
  there is nothing to exfiltrate. (A fork PR that also touches
  `lab/terraform/k8s/**` is still blocked by the required `terraform plan`
  check, as any `lab/terraform` change from a fork is: see the next bullet.)
- **Checkov** is the PyPI package pinned to `3.3.20` in its own venv on
  Python 3.12 (`actions/setup-python`, so the ubuntu-latest move to 26.04 and
  its Python 3.14 does not change the interpreter), not `checkov-action`. The pipeline hard-fails on any failed check without an
  inline skip justification. `terraform-plan.yml`'s Checkov job also
  hard-fails (`soft_fail: false`, every accepted finding skipped inline with
  a reason) and also scans `lab/terraform/k8s` (it covers all of
  `lab/terraform/**`).
- **The Entra workflows and the k8s roots.** A PR touching
  `lab/terraform/k8s/**` also counts as a Terraform change for
  `terraform-plan.yml`'s `changes` job (its regex matches all of
  `lab/terraform/`), so its fmt check, Checkov and the `envs/dev` plan run.
  From a same-repo branch that costs one OIDC Entra plan that shows no
  changes. From a fork it fails the required `terraform plan` check by design
  (fork PRs get no OIDC token), so a fork PR touching the k8s roots cannot
  merge until a maintainer re-pushes it as a same-repo branch, exactly like
  any other `lab/terraform` change. Excluding `lab/terraform/k8s/` from that
  regex would avoid both, at the price of also skipping the required Checkov
  job for those files; it is left as is. `terraform-apply.yml` excludes
  `lab/terraform/k8s/**`, so merging k8s-only changes does not start a
  reviewer-gated no-op apply.
- **`keyvault-trust` is applied only by the operator's local pipeline run.**
  The third root under `lab/terraform/k8s` holds the Entra Workload ID
  federated credential and the one-secret Key Vault grant (ADR 0036). No
  workflow applies it: `k8s-identity.yml` runs the static stages only, and
  `terraform-apply.yml`'s `!lab/terraform/k8s/**` keeps it out of the Entra
  apply. CI holds no identity that could create an app registration.
