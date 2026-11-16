# 19. Change access with code

Platform as code · [Contoso Health Identity Lab](../../README.md)

**A Terraform change moves AWS access from nurses to cloud engineers, from commit to pull request to plan.**

![Change access with code](../loops/19-change-access-with-code.webp)

[Full clip, 2:23](../videos/N01-the-blueprints.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The changed file](../../lab/terraform/modules/entitlement/variables.tf) · [The plan workflow](../../.github/workflows/terraform-plan.yml) · [The apply workflow](../../.github/workflows/terraform-apply.yml) |
| **Test** | [Pipeline script tests](../../.github/scripts/tests) · [Entitlement tests](../../lab/terraform/modules/entitlement/tests) |
| **Evidence** | [Capture log, rows E01, E02](../../lab/evidence/capture-log.csv) |
| **Decision** | [ADR 0004: the pipeline signs in with no secret](../../lab/docs/adr/0004-pipeline-workload-identity-federation.md) · [ADR 0005: the risk of the apply identity](../../lab/docs/adr/0005-risk-acceptance-apply-identity-tier0.md) |

---

[← 18. Contain a compromised account](18-contain-a-compromised-account.md) · [All chapters](../../README.md) · [20. Checks on the code →](20-checks-on-the-code.md)
