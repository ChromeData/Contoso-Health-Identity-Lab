# Demo: the clips and how they are made

The [README](../README.md) shows the lab in 23 chapters. Each chapter has one line, one silent loop,
and a link to the full clip.

| File | Purpose |
|---|---|
| [`chapters.py`](chapters.py) | The chapter list: title, line, clip file, and what the clip must show. |
| [`RECORDING-PLAN.md`](RECORDING-PLAN.md) | The status of each clip and the sequence of work. |
| [`make_loops.py`](make_loops.py) | Builds the loops in `loops/` from the clips in `videos/`. |
| [`build_pages.py`](build_pages.py) | Writes the README and the recording plan from the chapter list. |
| [`shot-list.md`](shot-list.md) | What Michael says on camera: the main intro, one short take for each part, and the close. The recording comes later. |
| [`intro-script.md`](intro-script.md) | The long version of the intro, one line for each stop of the lab guide. |
| [`recording/`](recording/) | The tool that drives the lab and records the clips. |

After a new recording:

```
python demo/make_loops.py
python demo/build_pages.py
```

## How it was made

- **The guide leads.** Every part starts from a stop in the lab guide, a plain
  document. The tool scrolls the guide to that stop and marks it, then opens
  the real page behind it.
- **A real pointer.** The tool moves the actual mouse pointer and types with
  real key presses in the browser and in VS Code, so what you see is what a
  person would do. It never types a password; sign-ins are done by hand,
  off camera, before recording.
- **Read-only dry runs.** The clips were recorded against the live tenant in
  a dry mode that only reads. Where a step would change something (a hire, an
  approval, an apply), it shows a stand-in instead: a captured screen from an
  earlier real run, labelled as such.
- **OBS pauses while pages load.** OBS is the screen recorder. The tool
  controls it through its websocket and pauses it while a page loads or a
  long check runs, so the clips do not show waiting.
- **Captions come from the checked lines.** Each step's line lives in
  [`recording/steps.mjs`](recording/steps.mjs). A checker
  (`tools/check-steps.mjs`) makes sure every step has a line, a known action
  and real files to point at. The same lines are burned into the clips
  afterwards by [`recording/tools/caption.py`](recording/tools/caption.py),
  in a band under the picture so they never cover the screen.
- **Built with an AI coding assistant.** As the main README says, the
  assistant wrote most of this tool. Michael set the goals, made the design
  calls and reviewed the result.

## Run it yourself

The tool is in [`recording/`](recording/). Its own
[`README.md`](recording/README.md) has the full detail. It was built for one
Mac and one lab, so expect to adapt paths and sign-ins: it looks for the lab
at `~/contoso-health-identity-lab` and its working files at `~/contoso-demo`.

Prerequisites:

- macOS (the pointer, window and display helpers are Swift and AppleScript)
- OBS Studio with the websocket server turned on (`npm run obs-setup` sets it up)
- Node.js
- ffmpeg
- Python 3 with Pillow (for the captions)

Commands, run inside `recording/` after `npm install`:

| Command | What it does |
|---|---|
| `npm start` | Start the cockpit: the teleprompter and driver |
| `npm run dry` | Dry run: steps through the show and changes nothing |
| `npm run rehearse` | Rehearsal on a throwaway copy |
| `npm run record` | Live recording with OBS |
| `npm run watch` | Hands-free dry run, recorded with OBS |
| `npm run clips` | Hands-free dry run, recorded as silent clips |
| `npm run captions -- <dir>` | Burn captions into the clips in `<dir>` |
| `npm run obs-setup` | Turn on the OBS websocket and store its password in the Keychain |
| `npm run bridge` | Build the small VS Code extension the tool drives VS Code through |
| `npm run overlay` | Build the script overlay that OBS cannot see |
| `npm run points` | Build the speech-matching points from the lines |
| `npm test` | Unit tests and the step checker |
| `npm run test:speech` | Check the speech matcher against a test set |

## What is not in this folder

`recording/` is a copy of the tool's tracked files, with these left out:

- `vscode-ext/*.vsix`: built copies of the VS Code extension. `npm run bridge`
  builds one from `vscode-ext/extension.js`.
- `.state/`: run logs, local settings and the teleprompter's access key.
- `tools/github-from-brave.mjs`: a one-time helper that copied the owner's
  own GitHub sign-in from his browser into the recording browser. It is not
  needed to run the tool.
- Untracked files: `node_modules`, speech models, narration audio, takes,
  recordings and captures.

The videos go in [`videos/`](videos/).
