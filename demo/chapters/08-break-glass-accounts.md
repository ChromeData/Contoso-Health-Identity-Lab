# 8. Break-glass accounts

Sign-in security · [Contoso Health Identity Lab](../../README.md)

**Two emergency admin accounts are out of all 12 policies. A drill examines them, and a Sentinel rule reports each sign-in.**

![Break-glass accounts](../loops/08-break-glass-accounts.webp)

[Full clip, 0:56](../videos/N19-break-glass.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The accounts and the group (Terraform)](../../lab/terraform/modules/groups/README.md) · [The drill script](../../lab/scripts/powershell/Invoke-BreakGlassDrill.ps1) · [The alarm rule](../../lab/kql/break-glass-signin.kql) |
| **Test** | [Drill tests](../../lab/scripts/powershell/tests/Invoke-BreakGlassDrill.Tests.ps1) · [Break-glass script tests](../../lab/scripts/break-glass/tests) |
| **Evidence** | [The drill record](../../lab/evidence/drills/2026-11-05T1041Z-break-glass-drill.json) · [Capture log, row E49](../../lab/evidence/capture-log.csv) |
| **Decision** | [ADR 0003: exclusions and break-glass](../../lab/docs/adr/0003-ca-exclusions-and-break-glass.md) |
| **Runbook** | [Break-glass drill](../../lab/docs/runbooks/break-glass-drill.md) |

---

[← 7. Conditional Access and MFA](07-conditional-access-and-mfa.md) · [All chapters](../../README.md) · [9. Temporary admin rights →](09-temporary-admin-rights.md)
