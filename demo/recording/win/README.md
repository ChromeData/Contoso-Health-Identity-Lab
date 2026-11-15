# Hidden recorder for Windows

This folder records the demo clips on a Windows PC. No window opens on the screen.

The Mac cockpit uses the real screen, OBS and the real pointer. This recorder uses none of them.
It runs the same steps (`steps.mjs`) in a hidden browser and writes one clip for each part.

## What it uses

| Part | How |
|---|---|
| Web pages | A hidden Chromium with its own profile (`.recording-profile`). |
| VS Code | VS Code's own web server on `127.0.0.1`, shown in a hidden page. Same editor, same theme, same bridge extension. |
| Camera | The frames of the hidden pages, sent to ffmpeg. 1920 x 1080, 15 frames each second. |
| Sign-in | The lab sign-in tool (`lab/scripts/demo/signin`). It reads Windows Credential Manager. |

The recorder signs in as `adm-presenter`. That account can read. It cannot change the lab.
One part also signs in a lab person in a private window, to show that person's page.
A step that changes the lab is not done. The clip shows its captured screen, or the report names the step.

## Before the first recording

1. Install Node.js, Git, Python, ffmpeg, VS Code and the GitHub CLI.
2. Put the lab secrets in Windows Credential Manager. Use the transfer tool for this.
3. Install the packages:

   ```
   cd demo/recording
   npm install
   npx playwright install chromium
   ```

4. Run the setup:

   ```
   npm run win:setup
   ```

The setup makes two folder links in your home folder, the read-only checkouts in `.v2/`, and the hidden VS Code.
You can run it again at any time.

## Record

1. Record one part:

   ```
   npm run win:clips -- --part 18
   ```

2. Record more than one part:

   ```
   npm run win:clips -- --part 18,19,21
   ```

3. Read the last lines. Each part shows the number of steps that passed.
4. Open the output folder. The last line gives its path.

To run the steps with no recording, add `--check`.

## Output

| File | Content |
|---|---|
| `<part>.mp4` | The clip. It has no sound. |
| `<part>.timeline.json` | The time of each step, its line, and the steps that failed. |
| `shots/<step>.jpg` | One picture for each step. Look at these first. |
| `record.log` | The full log. |

## Put the clips in the repo

1. Add the captions and copy the clips to `demo/videos/`:

   ```
   python demo/publish_clips.py <output folder>
   ```

   A part with a failed step is not copied.
2. Build the loops: `python demo/make_loops.py`
3. Build the pages: `python demo/build_pages.py`
4. Look at each loop before you push.

## GitHub sign-in (one time)

GitHub is your own account. The recorder has no login for it.
With no sign-in, GitHub hides the job summaries, the job logs and the **Run workflow** button.
The steps that show them fail (parts N01 and N09).

1. Make sure that no recording runs.
2. Run `npm run win:github`.
3. Sign in to GitHub in the small window that opens.
4. Wait. The window closes when you are signed in. It waits 10 minutes. For a longer wait, run `node win/github-signin.mjs --wait 45`.

## Splunk (part N07)

Part N07 shows the local Splunk. On a PC, Splunk runs in WSL (Ubuntu). No window opens.
These steps ran on a PC on 2026-11-15.

1. Install Docker in WSL: `sudo apt-get install -y docker.io docker-compose-v2`
2. Clone the lab in WSL. A clone in WSL has Unix line ends, which the shell scripts need:

   ```
   sudo git clone --depth 1 https://github.com/ChromeData/contoso-health-identity-lab.git /opt/contoso-health-identity-lab
   ```

3. Link the Splunk settings file to the Windows repo. The sign-in tool reads the password there:

   ```
   sudo ln -sfn /mnt/c/Users/<you>/labs/contoso-health-identity-lab/lab/splunk/.env /opt/contoso-health-identity-lab/lab/splunk/.env
   ```

4. In WSL, go to `/opt/contoso-health-identity-lab/lab/splunk` and run `sudo ./splunk-up.sh`. It stops at the license step.
5. Read the Splunk General Terms. If you accept them, set the two license lines in `lab/splunk/.env`. This is your decision. No script does it.
6. Run `sudo ./splunk-up.sh` again. The first start takes some minutes.
7. Copy the tenant's audit log into Splunk. Run the first command in Windows and the second in WSL:

   ```
   node lab/splunk/query-as-operator.mjs AuditLogs P14D lab/splunk/.state/AuditLogs.json
   sudo ./ingest-from-loganalytics.sh -T AuditLogs --input-json /mnt/c/Users/<you>/labs/contoso-health-identity-lab/lab/splunk/.state/AuditLogs.json
   ```

8. Delete `lab/splunk/.state/AuditLogs.json`. It holds real log rows.
9. Record: `npm run win:clips -- --part 7`

The Splunk rule looks back one hour. A recording session activates the read-only presenter role, and that activation is a row the rule finds.
The row gets to Log Analytics 5 to 15 minutes after the activation. Do step 7 after that, then record part N07 in the same hour.
If the role is active already, a session writes no new row, and the search shows 0 events.

## Limits

- The staff window, the AWS window, Teams and OrangeHRM are not in the recorder. A step that has a captured screen shows that screen.
- Each run is a preview. A step that has a preview line (`previewSay` in `steps.mjs`) shows that line, because the screen is from an earlier run.
- The private window signs in one lab person (part N05: `adm-raj.patel`, with the passkey). It shows the page. It does not activate a role.
- Steps that need a live check of the lab (`require`) are not checked.
- The clip shows no browser tabs and no address bar. A hidden browser has none.
- The check results in `tour/out` come from the last run of `tools/tour-extra-checks.sh` on the Mac. That script does not run on Windows.
- The browser profile can have only one user at a time. To record while the profile is in use, add `--profile <other folder>`. The other profile has no GitHub sign-in.

## The hidden VS Code

The VS Code server starts with a recording and stops when the recording ends. It opens no window.
If a recording was stopped by force, the server can stay up. To stop it:

```
node -e "import('./win/vscode-web.mjs').then((m) => m.stopServer())"
```
