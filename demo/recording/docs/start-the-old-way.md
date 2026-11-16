# Start it (the old way)

[Recording cockpit](../README.md) · page 2 of 14


```bash
cd ~/contoso-demo/cockpit && node cockpit.mjs
```

That is LIVE mode: everything happens for real, and OBS records one file per
piece. The other modes:

| Command | What it does |
|---|---|
| `node cockpit.mjs --dry` | Dry run. It does every step against the lab as it is now, but changes nothing: no typing into files, no commits, pushes, pull requests, merges, sign-ins or workflow runs. For each of those it says what it *would* do. It records nothing. You get a report in `shots/dry-run-report.json` and one picture per step in `shots/`. |
| `node cockpit.mjs --preview` | The whole demo on autopilot, recorded and narrated, then the lab is put back (see "Preview video" below). `--preview --dry` runs the same flow as a dry run. |
| `node cockpit.mjs --rehearse` | Piece 1 for real, on a throwaway branch. The cockpit makes a separate copy of the blueprints folder (`rehearsal/blueprints`), commits, pushes, opens the pull request, waits for GitHub's plan and shows it. Then it closes the pull request without merging and deletes the branch. It never approves and never merges. Your real "1 · The blueprints" folder is not touched. |
| `--record` / `--no-record` | Turns recording on or off (by default it is on only in LIVE). |
| `--display "DELL"` | Records a display other than the main one (any part of its name). |
| `--port 4747`, `--no-open` | The teleprompter port. `--no-open` stops the cockpit opening it on the Mac. |
| `node cockpit.mjs --watch --v2 --part 16,17 --out <dir>` | Hands-free show: a dry autopilot (changes nothing) that records with OBS, plays each line aloud and shows the script in a card OBS cannot see. The camera follows the preview rules: paused while pages load and while a long check runs (n17-check), started and resumed only when the stage window is in front, and a watchdog pauses it the moment anything else comes forward. At the start it lists other apps' visible windows by name (it never touches them: close them yourself) and minimizes every VS Code window that is not a demo window, taking a full-screen one out of full screen first (2026-11-10: the lead's full-screen window was on camera); that window goes back to full screen when the run ends. `--watch --no-record` is the same run with OBS left alone (proves the pointer path). |
| Tabs (2026-11-10) | With the real pointer, the recording browser changes site as a person does: the lab map (`map/lab-map.html`, served at `http://localhost:4747/map`) stays open in a tab; a step that opens a site the map links to goes map tab → the stop's bubble → the card's link (new tab). Otherwise an open tab is clicked in the tab strip, or Cmd+T / Cmd+L and the address is typed. Local pages (the map, files) are never typed. Unattended, the camera rolls through it. `COCKPIT_TABS=0` turns it off. App switches (Chrome and VS Code) stay cuts with the camera paused: a Cmd-Tab or Dock move would show every app on this Mac. |
| `--ring` | The yellow cursor ring (off by default since 2026-11-10; **C** toggles it). |

The cockpit prints two links: one for this Mac and one for your phone. Its
start screen runs `lab/scripts/demo/preflight.sh --check` and shows **READY**
or **NOT READY**, with one line per check. Fix anything red before you start.
