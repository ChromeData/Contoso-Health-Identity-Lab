# Documents: decisions, operations and risk

This page is the index of `lab/docs/`. The folder index for all of `lab/` is [one level up](../README.md).

## Start here

| Document | What it holds |
|---|---|
| [`platform-details.md`](platform-details.md) | Each result of the lab, its evidence, and the known limits. |
| [`architecture.md`](architecture.md) | The architecture diagram and how to read it. |
| [`STAND-INS.md`](STAND-INS.md) | Each system that stands in for a production system, and the line to say about it. |
| [`glossary.md`](glossary.md) | The terms, in plain words. |

## Decisions

| Document | What it holds |
|---|---|
| [`adr/`](adr/README.md) | The architecture decision records: the choice, the options and the result. |
| [`standards/`](standards/) | The standards that the code follows, such as the Conditional Access design principles. |
| [`change-record-outside-the-gate.md`](change-record-outside-the-gate.md) | Each change that did not go through the pipeline gate, and why. |

## Operations

| Document | What it holds |
|---|---|
| [`runbooks/`](runbooks/) | The procedures: break-glass drill, compromised identity, downtime and more. |
| [`okta-migration-runbook.md`](okta-migration-runbook.md) | The phases of the move from Okta to Entra. |
| [`passwordless-rollout-plan.md`](passwordless-rollout-plan.md) | The plan for the passkey rollout, by persona. |
| [`evidence-capture-plan.md`](evidence-capture-plan.md) | Which evidence to capture during the trial window. |

## Risk and compliance

| Document | What it holds |
|---|---|
| [`threat-model.md`](threat-model.md) | Named identity incidents, each mapped to a control of the lab. |
| [`risk-register.md`](risk-register.md) | The identity risks of the scenario. The CISO accepts the risk. |
| [`compliance-crosswalk.md`](compliance-crosswalk.md) | Each control of the lab in one row, mapped to the frameworks that were checked. |
| [`ciso-brief.md`](ciso-brief.md) | A brief for the CISO: the request, the risk and the licensing. |

## Plans and notes

| Document | What it holds |
|---|---|
| [`roadmap.md`](roadmap.md) | The rollout of the platform to 5,000 users, in phases. |
| [`target-state.md`](target-state.md) | The target design of the identity platform. |
| [`vendor-evaluation.md`](vendor-evaluation.md) | The comparison of PAM and IGA products. ADR 0036 replaced the PAM part. |
| [`field-notes.md`](field-notes.md) | Real failures from the build: what broke, how it was found, and the change. |
| [`your-turn/`](your-turn/README.md) | Run sheets to do the lab with your own hands. |
