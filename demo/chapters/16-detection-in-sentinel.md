# 16. Detection in Sentinel

Detect and respond · [Contoso Health Identity Lab](../../README.md)

**A detection rule, written as code, finds an admin activation and opens an incident in Microsoft Sentinel.**

![Detection in Sentinel](../loops/16-detection-in-sentinel.webp)

[Full clip, 1:03](../videos/N06-the-cameras.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The rule](../../lab/kql/pim-activation.kql) · [All the rules](../../lab/kql/README.md) · [Rules to Sentinel (Terraform)](../../lab/terraform/modules/monitoring/README.md) |
| **Test** | [The KQL test harness](../../lab/monitoring/kusto-harness/README.md) · [Monitoring tests](../../lab/terraform/modules/monitoring/tests) |
| **Evidence** | [The rules on the live workspace](../../lab/evidence/kusto/20261107T015206Z-workspace) · [Capture log, rows E15, E15b](../../lab/evidence/capture-log.csv) |

---

[← 15. Audit evidence](15-audit-evidence.md) · [All chapters](../../README.md) · [17. Detection in Splunk →](17-detection-in-splunk.md)
