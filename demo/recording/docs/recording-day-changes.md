# Recording day: what changed after preview 2 (read before you record)

[Recording cockpit](../README.md) · page 5 of 14


These fixes are in the cockpit. Unless noted, they apply to the live take
too, not only to `--preview`:

1. **Only the stage is on screen.**
   - VS Code is never activated as an app. The demo window is raised by its
     title, then VS Code is activated without "all windows", so your own VS
     Code windows (with their chat) stay behind.
   - Every other VS Code window is minimized again before each piece.
   - VS Code's toasts are cleared each time it comes on stage.
   - Unattended takes also check the front window before the camera rolls,
     and every 0.4 s while a line plays. Anything else in front pauses the
     camera until the stage is back. A piece's recording starts only when
     its first page is up.
2. **Sessions are checked before every piece, off camera.** Entra
   (adm-presenter), ServiceNow (recovery account), the staff window, Teams
   (test-user-a in Contoso) and Splunk (its session ends after about an
   hour) are each re-signed by the toolkit if needed.
3. **Personal mailboxes are blurred** on every cockpit page. The AWS access
   portal shows the account's root email.
4. **Piece 4:**
   - AWS needs the GROUP provisioned with Sam, not only Sam (see the
     fallback on the teleprompter).
   - ServiceNow single sign-on needs the identity provider's "Create an
     AuthnContextClass request" turned OFF (done 2026-11-06). Otherwise a
     passwordless hire gets AADSTS75011.
   - Sam's leftover ServiceNow record from an earlier take is deleted by
     the reset as the ServiceNow admin (exact user_name, read back), so
     piece 4 shows a clean create.
5. **Piece 5** opens Sam's one-time-pass sign-in by its date and time, then
   checks Authentication Details before the line.
6. **Pieces 6, 7 and 8 go back to back.**
   - Raj's alarm lands about 10-15 minutes after his activation (AuditLogs
     ingestion about 8 minutes, then a rule that runs every 5 minutes).
     7-incident takes only an incident whose entities include adm-raj.patel,
     and shows Raj in its Assets > Users list.
   - Splunk's rule looks back one hour, so piece 8 must run within the
     hour of Raj's activation. 8-run fails unless the count is above 0 and
     a row shows adm-raj.patel.
   - The cockpit's own AWS-admin activation (adm-labops) also raises PIM
     alarms. They are never shown as Raj's.
7. **Piece 7's card:**
   - The Contain button is in view and highlighted while "nothing happens
     until an approver says yes" plays.
   - Press it on camera. 7-contained then checks Graph (drill account off)
     and the card ("Decision recorded").
   - It tags the NEWEST decided card: the one just pressed, marked before
     the press, or else the last one in the channel. It never tags an older
     card.
8. **Piece 10:**
   - The lines say "write-once store ... the lock stays in its trial
     setting; production locks it for good". The evidence container's
     immutability policy is unlocked in the lab.
   - 10-summary waits until the run's summary says "Evidence pack filed".

9. **Piece 11, the tour** (eight read-only stops, about 2.5 minutes):
   - **Stops 1-2 (vault, recorded sessions)** run on the local PAM harness,
     not the tenant: HashiCorp Vault and Apache Guacamole, named as themselves
     on camera. Start it camera off, on the Splunk Colima VM
     (the default VM holds an older stopped `contoso-pam` stack; leave it):
     a worktree of the lab at origin/main in `cockpit/.pam-tour`, then
     `lab/pam/pam-up.sh` and `test/e2e.sh --skip-ha` (about 5 min; it
     proves check-in rotates the password), then one dual-approved
     check-out: `itsm-ticket.sh add <next> --operator ops-alice --approver
     ops-carol --approver ops-dana` and `psm-session.sh checkout`. The lease
     lasts one hour. The cockpit signs in to Vault (token) and Guacamole
     (guacadmin) itself, typing into masked fields. Afterwards: `checkin`,
     `test/e2e.sh --cleanup`, `docker compose down -v`, and remove the
     worktree.
   - **Stops 3-7** are Entra pages as adm-presenter: PIM-Demo-Readers must
     be active (it lasts 8 hours; the 2026-11-06 run found it expired).
   - **Stop 8, Okta:** test-user-b signs in through Okta's Entra identity
     provider route (`/sso/idps/<id>`; Okta's page itself shows only a
     username box). The window bypasses Okta's CSP so the cockpit's tag
     renders. Every highlight now checks that the overlay really rendered,
     and fails the step otherwise.

   - **Stops 9-12 (added 2026-11-06, about 75 s):** the merged PRs #209,
     #210, #211, #212, #214 and #215 (not #213), read only, in their own
     "Contoso Demo" window (`tour/contoso-demo-tour.code-workspace`): the lab
     at origin/main in the detached worktree `.tour-main`, plus the live
     read-only checks that `tools/tour-extra-checks.sh` writes to `tour/out`
     (RBAC linter run, today's CI scanner self-test, operator reads of Azure
     Policy, CloudTrail, Access Analyzer and Sentinel rules; it refuses if
     anything said to be off is on). Run the script, then
     `node cockpit.mjs --tour-extra`: it records only these four
     stops as `11-tour-extra-raw` and narrates `11-tour-extra.narrated.mp4`.
   - The recorder now restarts OBS's display capture before each session:
     on 2026-11-06 a take recorded a frozen 12:50 AM frame of another window.

10. **VS Code view (owner's request, 2026-11-06):**
    - The demo workspace runs at `window.zoomLevel` 0 and font size 15, with no
      activity bar, status bar, minimap, side bar or panel, and no current-line
      box. The window title stays visible.
    - Piece 1 shows the FINISHED files, not a red/green diff. The bridge
      action `changes` (bridge 0.1.8) reads `git diff -U0 HEAD` and softly
      tints only the changed lines, part by part as each line is spoken
      (`code.changes` with `from`/`to`).
    - New step 1-files opens the pull request's "Files changed" tab on
      GitHub for the clean before and after.
    - Every other VS Code step (pieces 2, 7, 8, 9) gets the same view, and
      their highlights use the same soft tint.
11. **Cursor ring:** `tools/cursor-ring.swift` (built by the cockpit on first
    use) draws a yellow, half-transparent 40 px ring around the pointer.
    - It is click-through, above every window, on every Space, and OBS
      display capture sees it.
    - It follows the real pointer, so it works when you move the mouse
      yourself. Playwright's page clicks don't move the system pointer, and
      those keep their own in-page cursor.
    - **Off by default since 2026-11-10** (owner: no yellow ring in
      recordings). `--ring` starts it with the cockpit, **C** on the
      teleprompter toggles it, and it stops when the cockpit stops.
    - **If OBS shows an old picture without the ring or the orange box**
      (2026-11-10): macOS had stopped OBS's screen capture (display slept,
      error -3805) and OBS never restarts it by itself. The ring and the
      overlays are captured fine while the stream runs. The recorder now
      watches OBS's log and restarts the capture as soon as it stops, pausing
      a take in progress meanwhile. A dry run or rehearsal also refreshes OBS
      when OBS is open, so its preview stays live.
    - Two pointers: OBS records the system pointer (with the ring around it)
      and the in-page pointer separately. `Recorder({ cursor: false })` or
      `obs.setCursor(false)` leaves the system pointer out of the capture.

12. **VS Code profile "Contoso Demo"** (the owner's, 2026-11-06):
    - The cockpit opens the demo workspace and its preview/rehearsal copies
      only with `--profile "Contoso Demo"` (`COCKPIT_VSCODE_PROFILE` to
      change it). A demo window it finds in another profile is closed and
      reopened in this one.
    - The bridge is installed into that profile by `vscode-ext/build-vsix.sh`.
      VS Code adds " — Contoso Demo" to the window title, and the cockpit
      matches on that.
    - Profile settings: GitHub Dark Default, Material icons, Error Lens on,
      zoom 0, font 15, no minimap, and no Copilot or AI chat UI
      (`chat.disableAIFeatures`). The demo workspace file says the same,
      because workspace settings win.
    - The activity bar and status bar stay VISIBLE for the owner. Bridge
      0.1.10+ (`chrome` op) hides both in the window's workspace file when the
      cockpit puts VS Code on stage (`recordingLook` in lib/engine.mjs), and
      `close()` removes them again. A cockpit killed mid-run leaves them
      hidden: the next cockpit run's close() puts them back, or delete the
      two lines from the workspace file.
    - On camera, hr_feed.csv in piece 2 shows in Rainbow CSV's column
      colours.
    - The GitHub Actions side panel is NOT used: VS Code has no GitHub
      sign-in, and the cockpit never signs an extension in with the owner's
      accounts. The run, the PR and the approval gate stay on GitHub's web
      pages. Entra, AWS and ServiceNow stay in the browser.
**Proof clip of piece 1's VS Code part:** `node cockpit.mjs --proof 1`. It
plays diff, nurse, cloud, rule, then types the commit message, on a
throwaway copy, and stops there: nothing is committed, pushed or opened on
GitHub. It is recorded silently and narrated into the preview's folder as
`01-vscode-proof.mp4`. Then the copy's window, worktree and branch are
removed. It needs bridge 0.1.7 (`vscode-ext/build-vsix.sh`).

**Single-piece dry runs:** `node cockpit.mjs --dry --auto --piece 7` runs just
that piece (the Teams step was proven this way, as were piece 4's ServiceNow
steps, with read-only stand-ins).

**Preview retakes:** `node cockpit.mjs --preview --resume-from 7 --only 7
--no-teardown` retakes one piece. It joins `preview-full.mp4` again, and it
disarms any drill it armed.

**Before a preview's revert PR** (the merge captain's spec, in
`lib/teardown.mjs` `clearAutoAssignment`; `npm test` runs its tests):
1. Check that only the preview's automatic policy and its test hire are on
   *IT - Cloud Engineering Apps*. A deleted assignee is identified through the
   audit log; the owner, or anyone unknown, stops it.
2. Switch the policy off (read back to check).
3. Remove the assignments.
4. Wait for 0 assignments on two reads in a row.
5. Delete the policy.

Only then does the revert PR open.
