# Preview video (autopilot): see the whole take before you record it

[Recording cockpit](../README.md) · page 3 of 14


```bash
cd ~/contoso-demo/cockpit && node cockpit.mjs --preview
```

The cockpit plays the **whole demo by itself, for real**, and OBS records it
with the microphone muted. Afterwards it lays a stand-in narration over the
picture and gives you `~/contoso-demo/recordings/preview/<date>/preview-full.mp4`,
plus one narrated file per piece (`NN-piece.narrated.mp4`). The narration is
every teleprompter line in the lab's narrator voice (Kokoro am_michael,
`tools/narrate.py`, cached in `narration/`).

- **Pacing.** Each step is held for as long as its narration clip lasts (or
  longer, if its action takes longer). WAIT steps work as they do in a real take:
  OBS pauses until the light is green. The cockpit notes where each step starts
  in the *recorded* time, which leaves out the pauses, in `timeline.json`. That
  is where its clip is mixed in (ffmpeg; the video is copied, never re-encoded).
- **Your hand steps, done for you and labelled on screen** ("PREVIEW · …"):
  - It never approves (rule of 2026-11-07). It stops at the apply gate,
    shows it for the line, and skips the merge's apply; only the owner
    approves.
  - It presses **Contain** on the drill card, only after
    `containment-drill.sh arm` and only when the waiting card is for an
    `itdr-drill-` account.
  - It answers Sam's second-check prompt, if Microsoft asks for one.
- **Works on a copy.** The blueprints change runs from
  `preview/blueprints` on a `preview/cockpit-<time>` branch. Your
  `~/contoso-demo/blueprints` folder and its two uncommitted files are never
  touched. The HR folder is the real one: the reset puts it back.
- **Then it puts the lab back**, so your real take starts from today's state:
  1. It opens a **revert pull request** for the AWS change and labels it
     `ready-for-merge`. The owner approves the PR and its apply; the merge captain
     (the bot) merges it. The cockpit never does either.
  2. It runs `reset-demo-hire.sh 400104 --apply`. When Cloud Sync has removed
     Sam from Entra (about 20 minutes), it runs `--apply --purge-entra
     --skip-git --skip-ad`.
  3. It runs `containment-drill.sh disarm`.
  4. It runs `close-build-noise.sh` as a **dry run**, which only lists what is
     open.
  5. It puts the HR folder back to `origin/hr-feed` and removes the preview copy.

  If a preview stops half-way, `node cockpit.mjs --preview-reset` runs only
  this part, from `.state/preview-last.json`. Add `--dry` to see what it would
  do. The scripts run from a detached worktree of `origin/main` at `.lab-main`,
  so they are always the merged versions.
- **It won't start until you're ready.** `--preview` first checks the
  recording browser's sign-ins (GitHub, Entra, Azure, Defender, AWS, Teams,
  ServiceNow and Splunk; the ServiceNow sign-in is done for you) and that OBS
  can see the screen. If anything is missing, it lists it and stops.
- `node cockpit.mjs --preview --dry` runs the same flow as a **dry run**:
  nothing changes and nothing is recorded. It mixes the narration onto a plain
  test picture, as long as each piece took, to prove the timing and the mix:
  `recordings/preview/<date>-dry/`.
