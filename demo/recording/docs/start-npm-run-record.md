# Start it: `npm run record` (2026-11-10 #2)

[Recording cockpit](../README.md) · page 1 of 14


```bash
cd ~/contoso-demo/cockpit && npm run record                        # LIVE, every v2 part
cd ~/contoso-demo/cockpit && npm run record -- --part 5,6          # LIVE, those parts
cd ~/contoso-demo/cockpit && npm run watch -- --part 16,17 --out <dir>   # hands-free dry demo, recorded
```

`record` runs the lab preflight, opens OBS if needed, sets the stage, checks
the sign-ins, opens the map tab and the first page in a background tab, then
lights **READY** on the presenter card. The terminal prints only what you must
do (`--quiet`); everything else is in `.state/cockpit-<date>.log`.

While the lab preflight runs, `record` also runs `tools/tour-extra-checks.sh`
(read only: the RBAC linter here, today's CI scanner job, and list / describe
reads as the lab operator), so N16's "a read-only check just before recording
shows none is on" is true: `tour/out/*.txt` is from this start. If it fails
(something is on, or `.tour-main` is not at origin/main), it is one of the
NOT READY lines.

**The maps on camera** are served by the cockpit itself, read only and without
the pairing key: `http://localhost:4747/map` (the lab map, `map/lab-map.html`)
and `http://localhost:4747/guide/?video` (the lab guide, `guide/index.html`: a
plain document that took the place of the presenter map on 2026-11-15; the
clips show the guide, not a map). The address bar
never shows a `/Users/...` path. Only those two pages are served, and only to
this Mac.

**The presenter card** (`tools/script-overlay.swift`, `lib/presenter.mjs`) sits
at the top centre of the screen, right under the camera, always the same size
(520 x 210 pt; compact 520 x 112: a long line shrinks a step or two, then
scrolls to the point being said with a soft fade, the box never resizes), in every mode (live,
rehearse, dry, watch). OBS never sees it (macOS `sharingType .none`). It shows
the line point by point (a soft ✓ when speech tracking hears a point's
meaning; ↺ and a dotted underline on a point you went past), a faint
preview of the next line, the part's progress, the take's elapsed time and a
light: **green** talk, **amber** the cockpit is busy (loading, waiting on
GitHub or Microsoft), **red** it needs you (failed step, your hand, paused),
with a 2-3 word reason. `--no-card` turns it off; `--compact` starts it on
one line. The phone teleprompter keeps working as before (**P** = pause).

**Keys that work from anywhere** (no window needs focus; Carbon hot keys, no
macOS permission needed):

| Key | What |
|---|---|
| ⌃⌥→ or ⌃⌥Space | NEXT |
| ⌃⌥← | BACK |
| ⌃⌥R | redo this step |
| ⌃⌥P | pause / go on (OBS, auto-advance and the autopilot hold) |
| ⌃⌥C | compact card on / off |
| ⌃⌥H | hide / show the card |
| PageDown / PageUp | NEXT / BACK, with `--clicker` (on in `npm run record`): a presentation clicker paired with the Mac |

**No typing on screen.** No address is typed and Cmd+L/Cmd+T are never used:
a page the cockpit needs is opened in a BACKGROUND tab (Chrome's own
`Target.createTarget`, `background: true`: the tab in front does not change),
and on its step the hand clicks that tab. The map's links are used when the
map is the page in front. VS Code is driven through the bridge (no typed
commands). Typing that stays because it IS the demo: the commit message in
N01 (`n01-commit`, live only) and Raj's reason in PIM (`n05-activate`, live
only). OrangeHRM (N02, N08) is still a hand step.

**Less dead time.** While a line is said, the next step's pages load in
background tabs. A step's line starts with its first quick on-screen action
(a tab click, a highlight, a file in VS Code), so the hand moves as you start
talking; the 2nd, 3rd... highlight of a step waits for the 2nd, 3rd... point
(your words live; the narration clip's clock in `--watch`). Fixed settles
(2.5-5 s) are now "until the page is quiet", capped at 1.5 s. In a live take
OBS also pauses while a page that is not already loaded has to load (amber
light). The hand is brisker (`COCKPIT_HAND_SPEED`, default 1.3) and
auto-advance fires after 0.6 s of quiet (`COCKPIT_ADVANCE_QUIET`). Off
switches: `COCKPIT_PREFETCH=0`, `COCKPIT_LINE_EARLY=0`, `COCKPIT_LIVE_CUTS=0`,
`COCKPIT_SETTLE=full`. A step can say `lineAfter: true` (its line waits for
all its actions) or give an action `atPoint: n` (it waits for point n).

**Measure a take:** `node tools/gaps.mjs <dir>/N16-*.mp4 <dir>/watch-lines.json`
lists every stretch of still picture of 1.5 s or more with no line being said.
