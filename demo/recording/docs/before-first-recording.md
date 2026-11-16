# Once, before your first recording

[Recording cockpit](../README.md) · page 7 of 14


1. **The VS Code bridge.** Run `vscode-ext/build-vsix.sh`. It packages and
   installs a small extension, "Contoso cockpit bridge". The extension only
   switches on in a window whose workspace file is under `~/contoso-demo` (the
   demo window and the rehearsal window), and it only listens on this Mac.
   The cockpit uses it to open files, show the diff, type, commit and push.
   If you rebuild it while the demo window is open, the cockpit reloads that
   window once so it picks up the new version.
   **The cockpit sizes the VS Code demo window itself**, to the same size as
   the recording browser, through macOS System Events. The first time, macOS
   may ask to let Terminal (or whatever app runs the cockpit) control your
   computer: allow it in System Settings → Privacy & Security →
   Accessibility. If it can't, the log says "could not size it" and the start
   screen tells you the window is too small. On camera, the cockpit hides the
   side bar so the code gets the whole window, and it closes leftover tabs
   at the start of each piece.
2. **OBS.** OBS is installed (`brew install --cask obs`) and has both
   permissions. The cockpit picks the display by its CoreGraphics UUID, read
   with `tools/displays.swift` and cached in `.state/config.json`. It never asks
   OBS for its display list, because OBS 33.0.1 crashes on that request. If OBS
   comes back after a crash in its Safe-Mode prompt, the cockpit clicks "Run in
   Normal Mode". `--display "DELL"` picks another display by name. Run
   `tools/obs-setup.sh` once while OBS is closed. It turns on OBS's remote
   control (port 4455). The password for it is kept in your Keychain as
   `contoso-lab-obs-ws`. The script also skips OBS's first-run wizard. Then,
   in **System Settings → Privacy & Security**:
   - **Screen & System Audio Recording**: turn on **OBS**.
   - **Microphone**: turn on **OBS**.

   Quit OBS and reopen it. The cockpit starts OBS by itself, builds the
   "Contoso demo" scene (your main display plus your microphone) and records
   with Apple's hardware encoder. Until macOS has given OBS permission, the
   start screen says that OBS "cannot see the screen yet".
3. **Sign-ins: the cockpit does them, except GitHub.** Press **Sign in /
   check sign-ins** on the start screen. The cockpit uses the lab's sign-in tool
   (`lab/scripts/demo/signin/identity.mjs`, PR #196) to sign in every lab
   account itself. Secrets stay in your Keychain; the tool reads them there.
   - The **recording window** (`.recording-profile`) is signed in as
     **adm-presenter** (read-only presenter account, passkey) for Entra, Azure,
     Defender and Sentinel. The cockpit activates its PIM group
     **PIM-Demo-Readers** for 8 hours and keeps it signed in. The same window
     also holds **acr.breakglass** for ServiceNow and **splunk-admin** for
     Splunk.
   - The **staff window** (`.staff-profile`) is signed in as **test-user-a**
     for My Apps and Teams. She is a listed containment approver.
   - **Raj's admin badge** (adm-raj.patel, passkey) gets a fresh window of its
     own in piece 6. He activates **PIM-Tier1-Helpdesk**, which is
     self-service: MFA plus a reason, with no approver. Ava's groups are Tier 0
     and would wait for an approver. Between piece 6 and piece 7, off camera,
     the cockpit gives the help-desk power back. **Sam** gets one-time passes
     in his own window.
   - The **AWS admin view** (pieces 4 and 9) is in **adm-labops**'s own window.
     When a live take or a preview starts, he borrows **LabAdministrator** for
     two hours through PIM-AWS-Lab-Admins (ADR 0025). He is provisioned into
     AWS on demand, and gives the role back at the end of a preview.
   - **GitHub is your only sign-in.** It is already signed in as ChromeData in
     the recording window. If it ever isn't, the start screen says "Sign in to
     GitHub once".

   Each window holds exactly one Entra account (the tool refuses to mix them).
   Your own Microsoft account is never used. Page zoom is 125%, and there is no
   bookmarks bar and no automation banner.
4. **Connect your phone or iPad.** It has to be on the same Wi-Fi as the Mac.
   Open the "phone / iPad" link that the cockpit printed (it looks like
   `http://192.168.x.x:4747/?k=…`) and add it to your home screen. The `k=`
   part is the pairing key. Without it, the page doesn't open.
   The key is saved in `.state/ui-key`, so the same link works every time.
   The phone stays awake while the page is open.
