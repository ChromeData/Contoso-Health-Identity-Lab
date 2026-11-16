# What the camera sees, and in what order (after preview review 1)

[Recording cockpit](../README.md) · page 4 of 14


- **One window on stage.** The cockpit never activates a whole app. It brings
  forward exactly one window: the demo VS Code window (found by its title),
  or one of its own Chrome windows (by process). It hides the rest of VS Code
  (including your own VS Code window), and OBS.
- **Before recording,** `Sign in / check sign-ins` also tidies up:
  - it closes the cockpit's old rehearsal and preview VS Code windows;
  - if the demo window is on another Space, it reopens it on this one, and
    sizes it;
  - it minimizes every other VS Code window;
  - it leaves each cockpit browser window with exactly one tab.
- **Screen first, then the line.** A step's actions run first; its line (and
  in `--preview` its narration clip) starts when its page is up. If a WAIT
  follows, OBS pauses only once the line has been said. Live reads such as
  the readiness checks happen off camera.
- **Teams is web Teams only,** as test-user-a in the Contoso tenant. It opens
  through the web app's own channel route
  (`teams.cloud.microsoft/_#/l/channel/...`), not a `/l/` link, so Teams'
  launcher page and Chrome's "Open Microsoft Teams?" prompt never appear. The
  desktop app is quit before each Teams step. The window must show Contoso
  SOC › Identity-SecOps, or the step stops. Microsoft Teams links are blocked in
  the cockpit's Chrome profiles too.
- **ServiceNow:**
  - The admin view is the recovery account's user list. The cockpit checks the
    session before it opens any ServiceNow page.
  - Sam's own view goes through My Apps: the ServiceNow tile, then his
    ServiceNow profile page (`/sp?id=user_profile`), which shows his name.
- **AWS admin view (pieces 4 and 9):** before recording, adm-labops borrows
  LabAdministrator. The cockpit waits until AWS Identity Center lists him in
  the group, and until a real sign-in lands on the Users page. Sam's own AWS
  view opens straight into the patient-portal bucket through the access
  portal's shortcut link.
- **Piece 5** opens Sam's sign-in log only once Graph has his sign-in.
- **Piece 6** is Raj (adm-raj.patel, passkey) activating PIM-Tier1-Helpdesk:
  self-service, MFA plus a reason. The cockpit refreshes until his row shows
  under Active assignments. His role is given back at the end, because PIM
  refuses a deactivation in the first five minutes.
- **Piece 7:**
  - It waits for the alarm on Raj's activation (the rule runs on a timer;
    about 15 minutes) and opens that incident directly. The incident list is
    filtered and can look empty.
  - Entra's user page is shown at 100% zoom, so its Properties column (Account
    enabled, On-premises sync) fits on screen.

**After preview review 2 (unattended takes: `--preview` and `--proof`):**
- **The cockpit's VS Code copy opens on this screen.** A new VS Code window
  opens on the Space of VS Code's active window, and a full-screen window
  has a Space of its own. So the cockpit brings the demo window forward first.
  Then it opens its copy here. If the copy sits on another Space, it closes
  the copy and opens it again here. The preview refuses to start until the
  copy's window is on this screen. Preview 2's piece 1 showed the demo
  window's `pim-activation.kql` instead of the copy's diff.
- **Silent footage is 10 s or less.** A piece starts paused and the camera
  rolls once the first page is up, so it never opens on an empty window. A
  wait pauses as soon as the line ends: unattended there is nobody acting on
  camera, so "hold" does not apply. The camera rolls again only when the next
  page (the result) is up. Any step whose actions (page loads, sign-ins) run
  past 6 s pauses until its page is up. Typing (HR rows, commit messages) is
  never cut.

**After preview review 2, pieces 4 to 8:**
- **A failed step is never left on camera.** In `--preview`, a step that logs
  FAILED stops its line at once. The piece is then retaken in the same lab
  state (automatically, once, for the view-only pieces 3, 4, 5 and 8).
  Otherwise the autopilot stops with a BLOCKED line in progress.log before
  anything changes the lab. `--skip <step-id>` leaves a blocked step out of
  a run.
- **Fresh sessions before every piece,** with the camera off. Each site the
  piece opens is checked and signed in again through the sign-in toolkit
  if it shows a login page: Entra, ServiceNow (recovery account), the staff
  window, and Splunk (its session ends after about an hour).
- **AWS:** provisioning a user on demand doesn't carry their groups. The
  cockpit therefore also provisions the GROUP on demand with that one
  member: App-AWS-IdentityCenter-Users for Sam, PIM-AWS-Lab-Admins for
  adm-labops. It waits until Identity Center lists the membership. A
  LabAdministrator activation that ends within 50 minutes is given back and
  borrowed again. AWS's console tour ("Service menu ... Next") is stepped
  through before any highlight.
- **ServiceNow, Sam's own view:** the cockpit waits for the sign-on hand-off
  to finish before it opens his profile. It closes My Apps' feedback survey
  and answers "Stay signed in?" after the one-time pass. It stops on any
  Entra prompt. This needs the ServiceNow identity provider to NOT request
  an AuthnContextClass (createrequestedauthncontext = false, set by the lead
  on 2026-11-06). Otherwise a passwordless hire gets AADSTS75011.
- **Piece 5** opens Sam's one-time-pass sign-in by its own date and time
  (taken from Graph). It checks that Authentication Details shows "Temporary
  Access Pass", then shows CA001 Require MFA: Success.
- **Piece 7:** the Contain button is found inside the card for this
  incident, tagged, scrolled into view (Teams at 80% if it still doesn't
  fit) and clicked. Then the cockpit waits for the card to say "Decision
  recorded". 7-contained speaks only after Graph shows the drill account is
  off and the card shows the decision.
- **Personal mailboxes are blurred** on every cockpit page (gmail, outlook
  and so on), like ids and IPs: the AWS access portal shows the account's
  root email.
- **The reset** also deletes Sam's ServiceNow record, because Entra's
  leaver only switches it off. It does this as the ServiceNow admin
  (Keychain `contoso-lab-servicenow-admin`, account `admin`), because the
  recovery account can't see inactive users. It matches the exact user_name
  `sam.rivera@contosohealthlab.com`, deletes only records created by
  `svc-entra-provisioning`, and reads back afterwards. The next take then
  shows a clean create.
