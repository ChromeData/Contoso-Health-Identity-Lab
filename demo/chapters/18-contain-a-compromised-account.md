# 18. Contain a compromised account

Detect and respond · [Contoso Health Identity Lab](../../README.md)

**A Sentinel incident asks a named approver in Teams. After the approval, a playbook revokes the sessions and disables the account.**

![Contain a compromised account](../loops/18-contain-a-compromised-account.webp)

[Full clip, 1:08](../videos/N22-contain-an-account.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The containment playbook](../../lab/monitoring/playbook-contain.json) · [The notify playbook](../../lab/monitoring/playbook-notify.json) |
| **Test** | [Monitoring tests](../../lab/terraform/modules/monitoring/tests) |
| **Evidence** | [The drill record](../../lab/evidence/itdr/20261105T125302Z) · [Capture log, rows E40, E41](../../lab/evidence/capture-log.csv) |
| **Decision** | [ADR 0017: containment only after a person approves](../../lab/docs/adr/0017-approval-gated-identity-containment.md) |
| **Runbook** | [Compromised identity](../../lab/docs/runbooks/compromised-identity.md) |

---

[← 17. Detection in Splunk](17-detection-in-splunk.md) · [All chapters](../../README.md) · [19. Change access with code →](19-change-access-with-code.md)
