# Changelog

The notable changes of the lab, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/) from 1.0.0.

The full history is the list of [merged pull requests](https://github.com/ChromeData/contoso-health-identity-lab/pulls?q=is%3Apr+is%3Amerged).
Changes that did not go through the pipeline gate are in [`lab/docs/change-record-outside-the-gate.md`](lab/docs/change-record-outside-the-gate.md).

## [1.0.0] - 2026-11-16

The first tagged version. It is the lab as the walkthrough shows it: 23 chapters, each with a clip and with links to its code, test, evidence and decision.

### Added

- Terraform examples: three small examples in [`lab/terraform/examples/`](lab/terraform/examples/README.md), each with a mocked test that runs with no sign-in.
- Checks on each commit: [`.pre-commit-config.yaml`](.pre-commit-config.yaml) runs `terraform fmt`, `terraform validate`, `tflint` and `terraform-docs`.
- This changelog.
- A README for each Terraform module, with lists of inputs, outputs and resources from `terraform-docs`. The tests fail when a list is old (#298).
- Index pages for `lab/` and `lab/docs/`, and a "Where it lives" table on each chapter page (#298).
- The lab guide, a plain document that the clips show in place of the lab map, with hidden speaker notes (#297).
- The walkthrough: 23 chapters with clips, and the hidden recorder for Windows (#295).

### Changed

- The front page is the intro and the chapter table only. Each chapter has its own page (#297).
- Three long pages (`lab/terraform`, `lab/pipelines`, `demo/recording`) are a short index plus pages in `docs/` (#298).

### Upgrade notes

None. This is the first version.

## Before 1.0.0: how the lab was built

| Date | What landed | Pull requests |
|---|---|---|
| 2026-10-27 | The first three days: premium features, Conditional Access in report-only mode, PIM tiers, governance, Sentinel, the domain controller, the first approval gate | #9, #12, #15, #17, #19, #25 |
| 2026-10-28 | Conditional Access policies enforced one at a time; sign-on for AWS, ServiceNow and Okta; access reviews; SCIM provisioning | #46, #50, #61, #63, #65, #70, #78 |
| 2026-10-29 | Scorecards and the evidence pack, the first configuration baseline, the second set of detections, the managed Windows 11 VM | #87, #98, #99, #107 |
| 2026-11-05 | The lab operator identity, AWS admin through PIM, ServiceNow provisioning, the playbooks in the tenant, passkeys and the first break-glass drill, the Splunk live feed | #110, #132, #134, #138, #147, #149, #192 |
| 2026-11-06 | The scanner self-test, two more detections, the AWS audit trail, the Azure Policy guardrails | #215, #214, #211, #212 |
| 2026-11-07 | AWS Session Manager behind PIM, the Okta app estate and migration tracker, the AD FS exercise, the scale test with 20,000 mocked users | #234, #222, #221, #244 |
| 2026-11-08 | The apply gate approves the exact saved plan; the bot identity; no stored secrets in GitHub; Microsoft products for PAM; AD hardening; OrangeHRM as the HR system; ServiceNow self-service; the domain controller with no public IP | #228, #241, #240, #220, #225, #255, #254, #272 |
| 2026-11-09 | Okta to Entra cut-over of the first app, with a timed rollback; the leaver closes with no hand step | #283, #281 |
| 2026-11-10 | Change control: a code owner review on each pull request | #294 |

[1.0.0]: https://github.com/ChromeData/contoso-health-identity-lab/releases/tag/v1.0.0
