# CI/CD pipeline — Contoso Health Identity Platform

Identity-as-code for Entra ID, delivered through GitHub Actions with **no stored
credentials**. Every change to the tenant is planned, scanned, AI-reviewed, and
human-approved before it applies. This folder documents how the pipeline is
wired and exactly what a human must configure for it to run.

> Terraform lives in [`../terraform/envs/dev`](../terraform/envs/dev)
> (`azuread ~> 3.10`, `azurerm ~> 4.0`). Detections live in
> [`../kql`](../kql). The workflows live in
> [`../../.github/workflows`](../../.github/workflows).

Protagonist of the walkthrough: **Dana Okafor** (joiner → mover → leaver). This
pipeline is the "change control" layer behind everything Dana's story touches —
Conditional Access, access packages, PIM, the lot.

---

## Contents

| Page | What it holds |
|---|---|
| [1. Architecture](docs/1-architecture.md) | The workflows, the two identities (PLAN and APPLY), and the approval gate. |
| [2. OIDC trust (workload identity federation)](docs/2-oidc-trust.md) | How GitHub signs in to Entra with no stored secret. |
| [3. Why a public repo](docs/3-why-a-public-repo.md) | Why the repo is public, and what the pipeline needs from that. |
| [4. SHA-pinning rationale (supply chain)](docs/4-sha-pinning.md) | Why each third-party action is pinned to a full commit SHA. |
| [5. Setup checklist (what a human must configure)](docs/5-setup-checklist.md) | The settings that a person must make one time, in GitHub and in Entra. |
| [6. Files in / driving this pipeline](docs/6-files.md) | The files that make or drive the pipeline. |
| [7. Kubernetes workload identity pipeline (`k8s-identity.yml`)](docs/7-kubernetes-pipeline.md) | The separate workflow for the Kubernetes part (`k8s-identity.yml`). |
