# 13. Access governance

Governance and audit · [Contoso Health Identity Lab](../../README.md)

**Access reviews, access that expires, and blocked combinations of access, each configured as code.**

![Access governance](../loops/13-access-governance.webp)

[Full clip, 1:49](../videos/N10-microsoft-features.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [Access packages and reviews (Terraform)](../../lab/terraform/modules/entitlement/README.md) · [Separation-of-duties rules](../../lab/iga/sod-rules.json) · [The separation-of-duties report](../../lab/scripts/powershell/09-SoD-Report.ps1) |
| **Test** | [Report tests](../../lab/scripts/powershell/tests/09-SoD-Report.Tests.ps1) · [Entitlement tests](../../lab/terraform/modules/entitlement/tests) |
| **Evidence** | [The review definitions](../../lab/evidence/access-reviews) · [The separation-of-duties run](../../lab/evidence/sod/20261105T101506Z) · [Capture log, rows E39c, E53, E71](../../lab/evidence/capture-log.csv) |
| **Decision** | [ADR 0012: reviews with no response, and clinical lockout](../../lab/docs/adr/0012-access-review-no-response-and-clinical-lockout.md) |

---

[← 12. Admin access in AWS and Azure](12-admin-access-in-aws-and-azure.md) · [All chapters](../../README.md) · [14. Service accounts and robots →](14-service-accounts-and-robots.md)
