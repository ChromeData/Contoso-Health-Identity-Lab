"""Where each chapter lives in the repo: the code, the test, the evidence, the decision (and a runbook, if there is one).

Key = the clip name in demo/chapters.py. Each value: kind -> list of (label, path from the repo root).
demo/build_pages.py puts these on the chapter page and stops with an error if a path does not exist.
"""
ADR = "lab/docs/adr/"
PS = "lab/scripts/powershell/"
TF = "lab/terraform/"
EV = "lab/evidence/"
LOG = EV + "capture-log.csv"


def log(rows):
    return (f"Capture log, {'rows' if ',' in rows or ' ' in rows else 'row'} {rows}", LOG)


LINKS = {
    # ---- Identity lifecycle
    "N02-hired": {
        "code": [("The HR system and its connector", "lab/hris/README.md"), ("The connector", "lab/hris/connector/sync.mjs"),
                 ("The inbound provisioning app", "lab/scripts/mock-hr/New-InboundProvisioningApp.ps1")],
        "test": [("Connector tests", "lab/hris/connector/tests")],
        "evidence": [log("E91")],
        "decision": [("ADR 0028: OrangeHRM as the HR system", ADR + "0028-orangehrm-as-the-hris.md"),
                     ("ADR 0006: API-driven inbound provisioning", ADR + "0006-api-driven-inbound-provisioning-vs-workday-connector.md")],
    },
    "N03-one-account-two-directories": {
        "code": [("Cloud Sync agent install", "lab/scripts/dc/04-Install-CloudSyncAgent.ps1"), ("Sync configuration", "lab/scripts/dc/configure-sync.py"),
                 ("The domain controller scripts", "lab/scripts/dc/README.md")],
        "test": [("Domain controller script tests", "lab/scripts/dc/tests")],
        "evidence": [log("E52")],
        "decision": [("ADR 0001: Cloud Sync, not Connect Sync", ADR + "0001-cloud-sync-vs-connect-sync.md")],
    },
    "N04-first-day-doors": {
        "code": [("Access packages (Terraform)", TF + "modules/entitlement/README.md"), ("Birthright rules", "lab/iga/birthright-rules.json"),
                 ("Sign-on and provisioning for the apps", TF + "modules/apps/README.md")],
        "test": [("Entitlement tests", TF + "modules/entitlement/tests"), ("Apps tests", TF + "modules/apps/tests")],
        "evidence": [log("E19, E22, E23")],
        "decision": [("ADR 0008: Entra ID Governance for access", ADR + "0008-iga-entra-id-governance-midpoint-vs-sailpoint-saviynt.md")],
    },
    "N04b-the-service-desk": {
        "code": [("The ServiceNow build", "lab/servicenow/README.md"), ("The apply script", "lab/servicenow/apply.py")],
        "test": [("ServiceNow tests", "lab/servicenow/tests")],
        "evidence": [("The read-back of the live run", EV + "servicenow/20261107T182703Z"), log("E92")],
        "decision": [("ADR 0008: Entra ID Governance for access", ADR + "0008-iga-entra-id-governance-midpoint-vs-sailpoint-saviynt.md")],
    },
    "N20-the-employee-changes-jobs": {
        "code": [("The mover script", PS + "03-Mover.ps1"), ("Birthright rules", "lab/iga/birthright-rules.json")],
        "test": [("Mover tests", PS + "tests/03-Mover.Tests.ps1")],
        "evidence": [log("E52")],
        "decision": [("ADR 0006: API-driven inbound provisioning", ADR + "0006-api-driven-inbound-provisioning-vs-workday-connector.md")],
    },
    "N08-leaving": {
        "code": [("The leaver script", PS + "04-Leaver.ps1"), ("The leaver Logic App (Terraform)", TF + "modules/leaver-extension/README.md")],
        "test": [("Leaver tests", PS + "tests/04-Leaver.Tests.ps1"), ("Logic App tests", TF + "modules/leaver-extension/tests")],
        "evidence": [log("E52, E187")],
        "decision": [("ADR 0029: the leaver removes automatic packages through a Logic App", ADR + "0029-leaver-removes-birthright-packages-through-a-logic-app.md")],
    },
    # ---- Sign-in security
    "N18-conditional-access": {
        "code": [("The Conditional Access module", TF + "modules/conditional-access/README.md"), ("The staging flags of the lab", TF + "envs/dev/lab.tfvars")],
        "test": [("Policy tests", TF + "modules/conditional-access/tests")],
        "evidence": [log("E12, E30")],
        "decision": [("ADR 0003: exclusions and break-glass", ADR + "0003-ca-exclusions-and-break-glass.md"),
                     ("ADR 0015: risk thresholds", ADR + "0015-risk-based-conditional-access-thresholds.md"),
                     ("Design principles", "lab/docs/standards/conditional-access-design-principles.md")],
        "runbook": [("Graduate a policy", "lab/docs/runbooks/graduate-a-ca-policy.md")],
    },
    "N19-break-glass": {
        "code": [("The accounts and the group (Terraform)", TF + "modules/groups/README.md"), ("The drill script", PS + "Invoke-BreakGlassDrill.ps1"),
                 ("The alarm rule", "lab/kql/break-glass-signin.kql")],
        "test": [("Drill tests", PS + "tests/Invoke-BreakGlassDrill.Tests.ps1"), ("Break-glass script tests", "lab/scripts/break-glass/tests")],
        "evidence": [("The drill record", EV + "drills/2026-11-05T1041Z-break-glass-drill.json"), log("E49")],
        "decision": [("ADR 0003: exclusions and break-glass", ADR + "0003-ca-exclusions-and-break-glass.md")],
        "runbook": [("Break-glass drill", "lab/docs/runbooks/break-glass-drill.md")],
    },
    # ---- Privileged access
    "N05-the-master-key": {
        "code": [("The PIM module", TF + "modules/pim/README.md")],
        "test": [("PIM tests", TF + "modules/pim/tests")],
        "evidence": [log("E16")],
        "decision": [("ADR 0002: PIM for Groups", ADR + "0002-pim-for-groups-vs-direct-role-eligibility.md"),
                     ("ADR 0020: activation design", ADR + "0020-pim-activation-design.md")],
        "runbook": [("PIM activation support", "lab/docs/runbooks/pim-activation-support.md")],
    },
    "N11-admin-passwords-and-sessions": {
        "code": [("The Key Vault module", TF + "modules/keyvault/README.md"), ("The state leak test", "lab/secrets/state-leak/README.md"),
                 ("Recorded sessions with Bastion", "lab/bastion/README.md")],
        "test": [("Key Vault tests", TF + "modules/keyvault/tests"), ("State leak tests", "lab/secrets/state-leak/tests")],
        "evidence": [("The state leak run", EV + "keyvault-state-leak/20261107T014803Z"), ("The Bastion recording run", EV + "bastion-session-recording/20261107T021051Z"),
                     log("E186")],
        "decision": [("ADR 0036: Microsoft products for PAM", ADR + "0036-microsoft-native-pam.md")],
    },
    "N12-hardening-ad": {
        "code": [("The hardening scripts", "lab/scripts/dc/hardening/README.md"), ("Admin tiers", "lab/scripts/dc/hardening/Set-AdTiering.ps1"),
                 ("Windows LAPS", "lab/scripts/dc/hardening/Enable-WindowsLaps.ps1")],
        "test": [("The verify script", "lab/scripts/dc/hardening/Test-AdHardening.ps1"), ("Domain controller script tests", "lab/scripts/dc/tests")],
        "evidence": [("The hardening run, before and after", EV + "ad-hardening/20261107T0057Z")],
        "decision": [("ADR 0013: exposure of the domain controller", ADR + "0013-tier0-domain-controller-exposure.md"),
                     ("Privileged access standard", "lab/docs/standards/privileged-access-standard.md")],
    },
    "N15-aws-server-access-and-azure-least-privilege": {
        "code": [("The AWS side (Terraform)", TF + "aws/README.md"), ("Session Manager", TF + "aws/session-manager.tf"),
                 ("Least privilege in Azure", TF + "envs/bootstrap/least-privilege.tf")],
        "test": [("AWS tests", TF + "aws/tests"), ("Bootstrap tests", TF + "envs/bootstrap/tests")],
        "evidence": [("The Session Manager run", EV + "aws-session-manager/20261107T0113Z"), ("The Azure role run", EV + "azure-least-privilege/20261107T0230Z")],
        "decision": [("ADR 0025: AWS admin through Entra, just in time", ADR + "0025-aws-admin-just-in-time-through-entra.md")],
    },
    # ---- Governance and audit
    "N10-microsoft-features": {
        "code": [("Access packages and reviews (Terraform)", TF + "modules/entitlement/README.md"), ("Separation-of-duties rules", "lab/iga/sod-rules.json"),
                 ("The separation-of-duties report", PS + "09-SoD-Report.ps1")],
        "test": [("Report tests", PS + "tests/09-SoD-Report.Tests.ps1"), ("Entitlement tests", TF + "modules/entitlement/tests")],
        "evidence": [("The review definitions", EV + "access-reviews"), ("The separation-of-duties run", EV + "sod/20261105T101506Z"), log("E39c, E53, E71")],
        "decision": [("ADR 0012: reviews with no response, and clinical lockout", ADR + "0012-access-review-no-response-and-clinical-lockout.md")],
    },
    "N21-service-accounts": {
        "code": [("The inventory script", PS + "06-NHI-Inventory.ps1"), ("The owner list", "lab/iga/nhi-owners.json")],
        "test": [("Inventory tests", PS + "tests/06-NHI-Inventory.Tests.ps1")],
        "evidence": [("The inventory run", EV + "nhi/20261105T101425Z"), log("E21, E70")],
        "decision": [("ADR 0018: owners of non-human identities", ADR + "0018-nhi-ownership-and-agent-identity-sponsorship.md"),
                     ("Non-human identity standard", "lab/docs/standards/nhi-standard.md")],
    },
    "N09-the-logbook": {
        "code": [("The evidence workflow", ".github/workflows/evidence-pack.yml"), ("The export script", PS + "Export-EvidencePack.ps1"),
                 ("The write-once store (Terraform)", TF + "modules/evidence-store/README.md")],
        "test": [("Export tests", PS + "tests/Export-EvidencePack.Tests.ps1"), ("Store tests", TF + "modules/evidence-store/tests")],
        "evidence": [("How the evidence folder works", EV + "README.md"), log("E06, E56, E74")],
        "decision": [],
    },
    # ---- Detect and respond
    "N06-the-cameras": {
        "code": [("The rule", "lab/kql/pim-activation.kql"), ("All the rules", "lab/kql/README.md"), ("Rules to Sentinel (Terraform)", TF + "modules/monitoring/README.md")],
        "test": [("The KQL test harness", "lab/monitoring/kusto-harness/README.md"), ("Monitoring tests", TF + "modules/monitoring/tests")],
        "evidence": [("The rules on the live workspace", EV + "kusto/20261107T015206Z-workspace"), log("E15, E15b")],
        "decision": [],
    },
    "N07-the-second-camera": {
        "code": [("The same rule in SPL", "lab/splunk/detections/pim-activation.spl"), ("The Splunk stack", "lab/splunk/README.md")],
        "test": [("The replay of test events", "lab/splunk/replay-synthetic.py")],
        "evidence": [("The live run", EV + "splunk/20261105T164502Z-live"), log("E59, E61, E113")],
        "decision": [],
    },
    "N22-contain-an-account": {
        "code": [("The containment playbook", "lab/monitoring/playbook-contain.json"), ("The notify playbook", "lab/monitoring/playbook-notify.json")],
        "test": [("Monitoring tests", TF + "modules/monitoring/tests")],
        "evidence": [("The drill record", EV + "itdr/20261105T125302Z"), log("E40, E41")],
        "decision": [("ADR 0017: containment only after a person approves", ADR + "0017-approval-gated-identity-containment.md")],
        "runbook": [("Compromised identity", "lab/docs/runbooks/compromised-identity.md")],
    },
    # ---- Platform as code
    "N01-the-blueprints": {
        "code": [("The changed file", TF + "modules/entitlement/variables.tf"), ("The plan workflow", ".github/workflows/terraform-plan.yml"),
                 ("The apply workflow", ".github/workflows/terraform-apply.yml")],
        "test": [("Pipeline script tests", ".github/scripts/tests"), ("Entitlement tests", TF + "modules/entitlement/tests")],
        "evidence": [log("E01, E02")],
        "decision": [("ADR 0004: the pipeline signs in with no secret", ADR + "0004-pipeline-workload-identity-federation.md"),
                     ("ADR 0005: the risk of the apply identity", ADR + "0005-risk-acceptance-apply-identity-tier0.md")],
    },
    "N16-code-checks": {
        "code": [("The scanner self-test", "lab/pipelines/scanner-selftest/selftest.sh"), ("The test workflow", ".github/workflows/lab-tests.yml"),
                 ("The nightly drift check", ".github/workflows/config-drift.yml")],
        "test": [("Self-test tests", "lab/pipelines/scanner-selftest/tests")],
        "evidence": [("The Kubernetes role check run", EV + "k8s-rbac-lint/20261106T071006Z")],
        "decision": [("ADR 0026: each check is seen to fail", ADR + "0026-positive-controls-every-check-seen-to-fail.md"),
                     ("ADR 0021: drift detection", ADR + "0021-configuration-drift-detection.md")],
    },
    "N17-close-vscode-github": {
        "code": [("The Terraform", TF + "README.md"), ("Small examples", TF + "examples/README.md"), ("The workflows", ".github/workflows"),
                 ("How the pipeline works", "lab/pipelines/README.md")],
        "test": [("The Terraform tests", TF + "docs/tests.md")],
        "evidence": [("How the evidence folder works", EV + "README.md")],
        "decision": [("ADR 0004: the pipeline signs in with no secret", ADR + "0004-pipeline-workload-identity-federation.md")],
    },
    # ---- Migrations
    "N13-adfs-to-entra": {
        "code": [("The AD FS exercise", "lab/adfs/README.md"), ("The Entra app (Terraform)", TF + "modules/apps/claims_viewer.tf")],
        "test": [("AD FS tests", "lab/adfs/tests")],
        "evidence": [("The sign-ins before the move", EV + "adfs-migration/20261107T0131Z")],
        "decision": [("ADR 0009: how AD FS is retired", ADR + "0009-adfs-to-entra-id-retirement-path.md")],
    },
    "N14-okta": {
        "code": [("The Okta apps (Terraform)", TF + "okta/clinic-apps.tf"), ("The migration code", "lab/okta-migration/README.md"), ("The tracker", "lab/okta-migration/tracker.md")],
        "test": [("Okta Terraform tests", TF + "okta/tests"), ("Migration tests", "lab/okta-migration/tests")],
        "evidence": [("The first run", EV + "okta-migration/20261107T010713Z"), log("E58, E184")],
        "decision": [("ADR 0022: Okta and Entra together, as code", ADR + "0022-okta-coexistence-as-code.md")],
        "runbook": [("Okta to Entra migration", "lab/docs/okta-migration-runbook.md")],
    },
}
