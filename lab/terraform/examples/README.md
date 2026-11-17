# Examples

Each folder is one small example of a module. Each one has a test that plans the example with mocked providers, so it runs with no sign-in.
The real use of all the modules together is [`envs/dev/main.tf`](../envs/dev/main.tf).

| Example | Module | What it makes |
|---|---|---|
| [`keyvault/`](keyvault/README.md) | [`modules/keyvault`](../modules/keyvault/README.md) | A hardened Key Vault with a private endpoint. |
| [`evidence-store/`](evidence-store/README.md) | [`modules/evidence-store`](../modules/evidence-store/README.md) | A write-once store for audit evidence. |
| [`groups/`](groups/README.md) | [`modules/groups`](../modules/groups/README.md) | The groups and the two break-glass accounts. |

To examine an example with no sign-in:

```
cd keyvault
terraform init -backend=false
terraform test
```

`lab-tests.yml` runs `validate` and `test` on each example for each pull request.
