# 23. Move the clinic from Okta

Migrations · [Contoso Health Identity Lab](../../README.md)

**The hospital bought a clinic with three apps in Okta. A tracker from live reads shows their move to Entra.**

![Move the clinic from Okta](../loops/23-move-the-clinic-from-okta.webp)

[Full clip, 1:21](../videos/N14-okta.mp4)

## Where it lives

| | |
|---|---|
| **Code** | [The Okta apps (Terraform)](../../lab/terraform/okta/clinic-apps.tf) · [The migration code](../../lab/okta-migration/README.md) · [The tracker](../../lab/okta-migration/tracker.md) |
| **Test** | [Okta Terraform tests](../../lab/terraform/okta/tests) · [Migration tests](../../lab/okta-migration/tests) |
| **Evidence** | [The first run](../../lab/evidence/okta-migration/20261107T010713Z) · [Capture log, rows E58, E184](../../lab/evidence/capture-log.csv) |
| **Decision** | [ADR 0022: Okta and Entra together, as code](../../lab/docs/adr/0022-okta-coexistence-as-code.md) |
| **Runbook** | [Okta to Entra migration](../../lab/docs/okta-migration-runbook.md) |

---

[← 22. Move an app from AD FS](22-move-an-app-from-ad-fs.md) · [All chapters](../../README.md)
