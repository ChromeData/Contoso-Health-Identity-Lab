# 6. The employee leaves

Identity lifecycle · [Contoso Health Identity Lab](../../README.md)

**HR ends Sam's job. Active Directory, Entra, ServiceNow, and AWS each disable the account, with no ticket.**

![The employee leaves](../loops/06-the-employee-leaves.webp)

[Full clip, 1:05](../videos/N08-leaving.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The leaver script](../../lab/scripts/powershell/04-Leaver.ps1) · [The leaver Logic App (Terraform)](../../lab/terraform/modules/leaver-extension/README.md) |
| **Test** | [Leaver tests](../../lab/scripts/powershell/tests/04-Leaver.Tests.ps1) · [Logic App tests](../../lab/terraform/modules/leaver-extension/tests) |
| **Evidence** | [Capture log, rows E52, E187](../../lab/evidence/capture-log.csv) |
| **Decision** | [ADR 0029: the leaver removes automatic packages through a Logic App](../../lab/docs/adr/0029-leaver-removes-birthright-packages-through-a-logic-app.md) |

---

[← 5. The employee changes jobs](05-the-employee-changes-jobs.md) · [All chapters](../../README.md) · [7. Conditional Access and MFA →](07-conditional-access-and-mfa.md)
