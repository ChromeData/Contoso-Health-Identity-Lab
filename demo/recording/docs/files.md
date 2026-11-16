# Files

[Recording cockpit](../README.md) · page 14 of 14


| Path | What |
|---|---|
| `cockpit.mjs` | The server and the command line |
| `steps.mjs` | Every on-camera step: the line, the actions, the wait, the fallback |
| `lib/engine.mjs` | Moving through the steps, the modes, the waits, retakes and resets |
| `lib/browser.mjs` | The recording Chrome window and the on-screen highlight |
| `lib/human.mjs`, `tools/human-input.swift` | The real pointer and keyboard, moved like a person; guide mode |
| `lib/vscode.mjs`, `vscode-ext/` | The VS Code bridge (client and extension) |
| `lib/obs.mjs`, `lib/recorder.mjs` | OBS remote control and the `screencapture` fallback |
| `lib/live.mjs` | Read-only lookups: `gh`, plus Graph and AWS through the lab operator |
| `lib/rehearsal.mjs` | The throwaway copy and branch used by rehearse mode (and the preview copy) |
| `lib/narration.mjs`, `tools/narrate.py` | Stand-in narration clips for the preview (Kokoro am_michael) |
| `lib/mix.mjs` | Lays each clip over its step's start; produces one file per piece and `preview-full.mp4` |
| `lib/teardown.mjs` | Puts the lab back after a preview: revert PR, Sam reset and purge, drill disarm, noise list |
| `lib/snow.mjs` | ServiceNow: the recovery-account setup sign-in and the provisioned-users list |
| `ui/index.html` | The teleprompter |
| `lib/speech.mjs`, `lib/listen.mjs`, `lib/points.mjs` | The speech-aware teleprompter: tracking and auto-advance, microphone to text, meaning matcher |
| `steps.points.json`, `tools/build-points.mjs` | Each step's key points (precomputed) |
| `tests/points-testset.json`, `tools/points-eval.mjs`, `tests/speech.test.mjs` | The matcher's test set, its precision / recall, and the end-to-end speech test |
| `tools/obs-setup.sh` | The one-time OBS setup |
| `tools/check-steps.mjs` | A quick check to run after editing `steps.mjs`: known actions, waits, files and line numbers |
