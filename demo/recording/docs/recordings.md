# Recordings

[Recording cockpit](../README.md) · page 11 of 14


The cockpit saves one file per piece in `~/contoso-demo/recordings/<date>/`:
`01-the-blueprints.mkv`, `02-hired.mkv`, and so on. When a piece ends, the
file is converted to `.mp4` (by remuxing, which takes seconds). The `.mkv` is
kept too. A retake replaces that piece's file. Takes from rehearsal or dry runs (when
recorded with `--record`) go to `~/contoso-demo/recordings/practice/<date>/`
instead, so they are never mixed up with the real ones.

**If OBS can't be controlled** (it isn't installed, or its remote control is
off), the cockpit falls back to macOS's built-in `screencapture` (main
display plus the default microphone, saved as `.mov`, then `.mp4`).
`screencapture` **cannot pause**, so the waits stay in the file and you have to
cut them out yourself. The top bar says "screencapture, no pause" when this
happens.
