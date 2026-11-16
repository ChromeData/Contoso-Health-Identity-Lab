# v2: the 18 parts (N00 to N17), 2026-11-07

[Recording cockpit](../README.md) · page 6 of 14


`node cockpit.mjs --v2` walks the v2 scripts (`segments/V2-RUNNING-ORDER.md`,
each part's `script-v2.md`) instead of the 11 pieces. The steps are
`stepsV2` and `PIECES_V2` in `steps.mjs`; `node tools/check-steps.mjs --v2`
checks them.

| Command | What it does |
|---|---|
| `node cockpit.mjs --v2` | LIVE, every built part. |
| `node cockpit.mjs --v2 --part 2,3,4,8` | Only those parts (numbers or `N02`). |
| `node cockpit.mjs --v2 --preview --part 0 --out ~/contoso-demo/recordings/preview/2026-11-07` | Preview of a part, recorded into that folder, narrated per part (`N00-intro.narrated.mp4`). |
| `node cockpit.mjs --v2 --dry --auto --piece 4 --no-preflight` | Dry run of one part (`--no-preflight` skips the 4-minute lab check). |
| `node cockpit.mjs --v2 --preview-reset` | Removes a v2 preview's test hire (`.state/v2-hire.json`) if a preview stopped half-way. |
| `--include-pending` | Also loads the PENDING BUILD parts and steps; they stop on their TODO. |
| `--raj-ticket INC00xxxxx` | N05, live: the real ServiceNow incident in Raj's reason (Karen A4). Without it, N05's activation step stops with a red light. |

**What stays the same:** the frontmost-window guard (one stage window;
Claude windows are hidden and never count as the stage), a session check
before each part, FAILED means retake (view-only parts retake once by
themselves), the VS Code bridge with the activity bar and status bar
hidden while recording, and each line starting when its screen is up.

**The cockpit never approves.** It never types an approval, in any mode.
Only the owner approves an apply. A preview stops at the approval screen,
holds it for the line, and skips the apply.

**What a v2 preview changes in the lab: only the HR test hire.** Every step
marked `cloud` (commit, push, pull request, merge, approval, apply, PIM
activation, drill, evidence run, the AWS admin role) is not done; its
`standIn` runs instead: a read-only screen of an earlier real run, labelled
"PREVIEW · ..." on screen (part one: PR #204, its gate and its apply run).
N02 to N08 hire a test nurse ("Test Preview") through the HR form and make
her a leaver. At the end the cockpit removes her the way
`readiness/hr-flow.md` says (reset-demo-hire.sh, Entra purge, ServiceNow
record deleted as the admin, AWS gone after its SCIM cycle) and reads every
place back (`teardown.json`). DC01 is started for the hire if it is off and
deallocated again at the end.

**New screens:**
- `ui/card.html`: title cards, the setup and lab maps (tiles from the lab
  guide's `stops.json`), strips, count and framework cards, the 24-rule
  table. The card is in the URL's hash; nothing is fetched.
- VS Code parts open their lab guide stop with the bridge's `openStop`, so
  VS Code shows that stop's tabs (N01 stop 2, N06 and N07 stop 12).
- N12 and N14 use `v2/contoso-demo-v2.code-workspace`: read-only checkouts
  of PR #225 and PR #222 in `.v2/` (made by `v2Worktrees`).
- The HR form (PR #224) is started from `.v2/hr` (or `COCKPIT_HR_FORM_DIR`)
  when nothing answers on 127.0.0.1:8484. For Sam as Cloud Engineer, run it
  from a checkout whose rules list that job.
- N17's terminal check: bridge 0.1.16 `runCheck` (only
  `lab/scripts/demo/preflight.sh --check`, read only).

**N11, N13 and N15 (2026-11-07)** are built from the real evidence in
read-only copies of their PR branches (`.v2/pam`, `k8skv`, `kvleak`,
`bastion`, `adfs`, `azlp`, and main as `.v2/ssm`) and the Bastion capture in
`captures/bastion/2026-11-07/` (cards can show a picture or a video:
`img`, `video`). EPM is said as built and waiting (24 h per approval); AD FS's
readiness report as not registered; N15 says its gaps. N14's cut-over and
rollback are said as built, not run (no Entra-side result exists).

**Tightening a preview:** `python3 -I tools/tighten.py <part>.narrated.mp4`
cuts every silence over 1.6 s down to 1.6 s (picture and sound together;
the original is kept as `*.untightened.mp4`). N00 uses `--keep-before 16`
so the owner's own opening lines keep their hold. N12's DC01 console screens (Users and Computers, Group
Policy Management) have no cockpit driver: the run's own evidence logs are
shown instead. N14's Okta admin console has no cockpit sign-in: the
Terraform that built those screens is shown instead.

## HR is OrangeHRM (2026-11-07, PR #255, ADR 0028)

The HR form is retired. HR works in **OrangeHRM** (open-source edition 5.9, http://127.0.0.1:8585). Read `readiness/hr-flow.md` for the clicks, the true lines and the measured timings.

- **Before any Sam Rivera take: "Cloud Engineer" must be an OrangeHRM job** (Admin > Job > Job Titles > + Add). Done on this Mac on 2026-11-07 for the screen recapture; check it is still listed (a `hris.sh destroy` loses it). IT's rules must also know the title (the demo branch's rules file), or Sam gets no access package.
- Sam's employee number is **400104** (the next IT number). Manager: Joan Ferris. Nothing leaves OrangeHRM until the Job tab and the Report-to supervisor are both saved.
- Start before recording: `lab/hris/orangehrm/hris.sh up`, then `node lab/hris/connector/sync.mjs --watch 60`. DC01 must be running. Sign in to OrangeHRM as Admin before recording (never on camera) and zoom to 110%.
- Say "within about two minutes the account is in Active Directory; Entra picks it up on its next sync cycle". Never "about four minutes", never "instantly". Leaver: "within a minute of HR's save, the account is switched off in Active Directory".
- N02 and N08 in the cockpit: HR's clicks are **hand steps** (the presenter clicks in OrangeHRM). `--v2 --preview` hires nobody: it shows the captured OrangeHRM run (`captures/E170-E173-orangehrm/`), the connector log, the real hr-feed GitHub run and the watch logs. The old form actions (`hr.open`, `hr.fill`, `hr.hire`, `hr.leave`) and the form's test-hire preview are no longer used by N02/N08.
- Retake reset, in this order: OrangeHRM Terminate Employment, then Maintenance > Purge Records; `lab/hris/orangehrm/hris.sh free-id <number>`; then `lab/scripts/demo/reset-demo-hire.sh <number> --apply` as the operator; then delete the inactive ServiceNow record as admin. Not yet automated in the cockpit for OrangeHRM.
