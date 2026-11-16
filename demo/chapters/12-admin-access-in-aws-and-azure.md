# 12. Admin access in AWS and Azure

Privileged access · [Contoso Health Identity Lab](../../README.md)

**A server shell in AWS opens only through Session Manager, during a temporary admin window. Azure uses a narrow operator role.**

![Admin access in AWS and Azure](../loops/12-admin-access-in-aws-and-azure.webp)

[Full clip, 1:07](../videos/N15-aws-server-access-and-azure-least-privilege.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The AWS side (Terraform)](../../lab/terraform/aws/README.md) · [Session Manager](../../lab/terraform/aws/session-manager.tf) · [Least privilege in Azure](../../lab/terraform/envs/bootstrap/least-privilege.tf) |
| **Test** | [AWS tests](../../lab/terraform/aws/tests) · [Bootstrap tests](../../lab/terraform/envs/bootstrap/tests) |
| **Evidence** | [The Session Manager run](../../lab/evidence/aws-session-manager/20261107T0113Z) · [The Azure role run](../../lab/evidence/azure-least-privilege/20261107T0230Z) |
| **Decision** | [ADR 0025: AWS admin through Entra, just in time](../../lab/docs/adr/0025-aws-admin-just-in-time-through-entra.md) |

---

[← 11. Harden Active Directory](11-harden-active-directory.md) · [All chapters](../../README.md) · [13. Access governance →](13-access-governance.md)
