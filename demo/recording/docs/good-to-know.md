# Good to know

[Recording cockpit](../README.md) · page 13 of 14


- **The start screen checks that the blueprints branch still merges into
  main.** If it doesn't, GitHub runs no checks at all on the pull request
  (a rehearsal on 2026-11-05 found exactly this). Rebase the branch first,
  keeping the two uncommitted on-camera files, then rehearse again.
- **Sam's start date is the recording day.** The cockpit reads the Mac's
  local date when it starts and types it into Sam's row (the run sheet's
  Copy button does the same). The automatic access rules only match people
  whose hire date is today or earlier, so a future start date would mean no
  package in piece 4.
- **Waits:** the GitHub plan takes about 3 minutes and the apply about 4.
  The HR feed takes about 1 minute. Cloud Sync runs about every 20 minutes;
  on its fallback line, the cockpit tells you how to use Provision on demand.
  AWS takes up to 40 minutes (or seconds with Provision on demand). Defender
  alarms can take up to an hour, so record piece 7 last.
- **Piece 4's ServiceNow steps** first check three things live: that
  ServiceNow sign-in through Entra is on (SAML), that the ServiceNow
  provisioning job is on, and that Sam has arrived in its log. If any of them
  isn't true yet, the light turns red and shows the reason (for example "ServiceNow
  provisioning is Paused"). Press NEXT to go past it, or use Provision on
  demand. There are two views:
  - **Admin view.** The recording browser shows ServiceNow's user list, filtered to
    the accounts Entra provisioning created, with Sam's row highlighted. Only
    the account-recovery user `acr.breakglass` can still sign in to ServiceNow
    locally, so the cockpit signs it in **itself, as a setup step** (Check
    sign-ins on the start screen). It reads the password and authenticator
    seed from your Keychain (`contoso-lab-servicenow-acr`,
    `contoso-lab-servicenow-acr-totp`) inside its own process. It computes the
    code, fills both boxes directly (the code box is masked) and forgets them.
    Neither one is ever shown or logged. Before it opens any ServiceNow page, the
    cockpit checks whose ServiceNow session the browser has, and refuses
    anyone but `acr.breakglass`. Opening ServiceNow without that session
    would start single sign-on with your own Entra session, so the cockpit
    never does that. Your account is never used for ServiceNow. If the session
    has expired by the time you reach this step, the cockpit pauses OBS, signs
    in again and then resumes recording.
  - **Staff view.** In a separate clean window, slice 1's staff sign-in toolkit
    (`lab/scripts/demo/signin`) signs `test-user-a` in through My Apps, with a
    real Entra sign-in (password and authenticator code from the Keychain).
    The cockpit highlights the ServiceNow tile, clicks it, and shows Test User A
    landing in ServiceNow.
- **Piece 7's optional Teams step (containment approval)** runs only against
  slice 5's throwaway drill account. First arm the drill (a throwaway
  `itdr-drill-…` user plus a drill incident, the way slice 5 does it). The
  cockpit then checks that the only approval card waiting is for an
  `itdr-drill-` cloud-only account. If a card is waiting for anyone real,
  the light goes red and the cockpit doesn't open Teams. It opens the
  Contoso SOC › Identity-SecOps channel and highlights the card. **You**
  press "Contain (revoke + disable)". OBS keeps recording while it waits for
  your press. The light turns green once the drill account is off. Sign in to
  Teams once in the recording browser (it is in the sign-in check).
- **Sign-ins as Sam and Ava** happen in a separate clean Chrome window. The
  cockpit has the lab operator issue a one-time pass (Temporary Access Pass),
  keeps it in memory, types it into Microsoft's box and forgets it. It is
  never shown, logged or put on a command line. The cockpit allows this only
  for Sam (found by employee ID 400104) and for `adm-ava.lin`.
- **Merging** (piece 1) happens only in LIVE mode, and only for the open
  pull request from the blueprints branch.
- **Logs:** `.state/cockpit-<date>.log`. Rehearsal and dry-run pictures are
  saved in `shots/`. The dry-run report marks each step DONE, WOULD (a change
  it didn't make), SIGN-IN (the recording browser needs your one-time
  sign-in), NOT YET (a live condition, such as Sam not hired), or FAILED.
- **Stopping:** Ctrl-C in the terminal. The cockpit stops OBS, so a piece
  being recorded is saved.
