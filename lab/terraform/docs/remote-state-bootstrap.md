# Remote-state bootstrap (one-time, out-of-band)

[Contoso Health — Entra ID IAM / PAM Terraform Lab](../README.md) · page 8 of 11


`backend.tf` expects a **versioned** storage account. Create it once before
`terraform init` with the real backend:

```bash
az group create -n rg-identity-lab-tfstate -l eastus2

# Entra auth only: both backends set use_azuread_auth = true, so nothing in
# the lab needs the account keys.
az storage account create \
  -n stidlabtfstate -g rg-identity-lab-tfstate -l eastus2 \
  --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 --allow-blob-public-access false \
  --allow-shared-key-access false

# Versioning + soft delete + change feed = recoverable, audited state.
az storage account blob-service-properties update \
  --account-name stidlabtfstate -g rg-identity-lab-tfstate \
  --enable-versioning true \
  --enable-delete-retention true --delete-retention-days 30 \
  --enable-container-delete-retention true --container-delete-retention-days 30 \
  --enable-change-feed true

# Your admin needs a data-plane role before --auth-mode login works (Owner
# has no blob data actions); allow a few minutes for it to propagate.
az role assignment create --role "Storage Blob Data Contributor" \
  --assignee-object-id "$(az ad signed-in-user show --query id -o tsv)" \
  --assignee-principal-type User \
  --scope "$(az storage account show -n stidlabtfstate -g rg-identity-lab-tfstate --query id -o tsv)"

az storage container create \
  --account-name stidlabtfstate -n tfstate --auth-mode login

# Separate container for envs/bootstrap: CI gets no role on it (and see the
# lock below for why that holds).
az storage container create \
  --account-name stidlabtfstate -n tfstate-bootstrap --auth-mode login
```

`use_azuread_auth = true` in both `backend.tf` files only sets how Terraform
authenticates; `--allow-shared-key-access false` is what makes the account
refuse key-based requests. The CI identities get container-scoped state roles
on `tfstate` only, via `envs/bootstrap`.

**After the first `envs/bootstrap` apply, lock the account.** That apply
creates CI's container-scoped role assignments, which the lock would block:

```bash
az lock create -n lock-tfstate-readonly --lock-type ReadOnly \
  -g rg-identity-lab-tfstate --resource stidlabtfstate \
  --resource-type Microsoft.Storage/storageAccounts
```

Why: CI's APPLY identity is subscription **Contributor**, which includes
`listKeys` and storage-account writes. Without the lock it could turn Shared
Key back on, list the keys and read or overwrite every container
(`tfstate-bootstrap` and the dev state's secrets included), switch off
versioning and soft delete, or delete the account. Contributor cannot create
or remove locks (`Microsoft.Authorization/*/Write` and `*/Delete` are
NotActions), and the constrained RBAC Administrator grant covers role
assignments only. A ReadOnly lock blocks the `listKeys` POST, account and
blob-service property writes, and deletion. Locks do not apply to data-plane
calls, so Entra-authenticated state reads, writes and blob leases keep
working.

- **Trade-off:** the lock also blocks role assignments scoped to the account
  or a container. Lift it (`az lock delete` with the same name and resource
  arguments) around any `envs/bootstrap` apply that changes those state role
  assignments, then lock again. Other bootstrap applies only read the account
  through the `azurerm_storage_account` data source, whose provider code
  treats a 409 from `listKeys` as a lock and carries on (verify: on the first
  bootstrap plan after locking).
- **Residual risk:** APPLY's Tier-0 Graph rights
  (`RoleManagement.ReadWrite.Directory`, see `lab/pipelines/README.md`),
  mitigated by the `prod` reviewer gate. Production would keep state in a
  subscription where CI has no Azure role at all.
