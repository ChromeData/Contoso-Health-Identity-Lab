# Kubernetes workload identity (`k8s/`)

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 10 of 11


A self-contained segment, **not** part of the apply order above. Three
roots under `k8s/`, all applied by
`lab/k8s/ci/pipeline.sh` as the lab operator, per run, against a throwaway
**kind** cluster (the AKS stand-in, see [`../docs/STAND-INS.md`](../../docs/STAND-INS.md))
and throwaway Azure objects, then destroyed. Since ADR 0036 the secret store
is **Azure Key Vault**, reached through **Microsoft Entra Workload ID** and the
**Secrets Store CSI Driver** (the in-cluster HashiCorp Vault is retired).
Design, decisions and how to run it: [`../k8s/README.md`](../../k8s/README.md).

- **`k8s/keyvault-trust`** (azuread + azurerm): the app registration (no
  credential), one federated credential for
  `system:serviceaccount:clinical-apps:nightly-report`, and Key Vault Secrets
  User on ONE secret. `k8s/platform` (helm + kubernetes): namespaces and the
  CSI driver + Azure provider. `k8s/identity` (kubernetes): service accounts,
  the SecretProviderClass, group Roles/RoleBindings and the
  ValidatingAdmissionPolicy `clinical-apps-workload-identity`.
- **Local state, no backend:** each run's state lives as long as the run.
  The secret's value is set in Key Vault by az, never a Terraform argument,
  and no client secret exists, so no state holds a secret (stage 12 counts).
- **Lock files** are committed for `linux_amd64` + `darwin_arm64`;
  `keyvault-trust` locks azuread 3.10.0 and azurerm 4.81.0, the builds the
  rest of the lab locks.
- **Tested:** the three roots' mocked tests (17 runs) run in stage 2 of
  `pipeline.sh` and in `lab-tests.yml`. `terraform-apply.yml`'s
  `!lab/terraform/k8s/**` keeps them out of the Entra apply. The live run is
  RAN · tenant (lab/evidence/k8s-keyvault/20261107T013045Z/, 66/66).

---
