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

The recorder signs in as `adm-presenter` only. That account can read. It cannot change the lab.
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

## Limits

- Parts that use the staff window, the AWS window, Teams, Splunk or OrangeHRM do not record yet.
- Steps that need a live check of the lab (`require`) are not checked.
- The clip shows no browser tabs and no address bar. A hidden browser has none.

## Stop the hidden VS Code

The VS Code server stays up after a recording, so the next one starts faster. To stop it:

```
node -e "import('./win/vscode-web.mjs').then((m) => m.stopServer())"
```
