# The pointer: a person's hand, or a guide for yours

[Recording cockpit](../README.md) · page 10 of 14


By default the cockpit moves the **real** macOS pointer (the one OBS records),
not a drawn one, and it moves it the way a hand does (`lib/human.mjs`,
`tools/human-input.swift`, built on first use):

- **Moving:** a slightly curved path (never a straight line or a jump), fast
  in the middle and slow on landing, longer for far or small targets (Fitts'
  law). Far moves overshoot a little and come back; some fall short and correct.
  A faint tremor while moving.
- **Clicking:** a short settle on the target, then press and release about a
  tenth of a second apart. The target is measured again on arrival, so a page
  that moved is followed. The orange box and the click ripple stay.
- **Scrolling:** trackpad flicks that glide to a stop, a beat between flicks,
  not a jump.
- **Typing:** a person's rhythm: uneven keys, a pause between words, longer
  after a comma or before a capital, now and then a short hesitation. No typos.
  Sign-in pages and passwords are never typed with real keys.
- **Changing window:** the hand leaves the page (up toward the tab strip), a
  beat, the window is there, a beat. Opening a page in the same window: the
  hand goes up to the address bar first. No Dock and no Cmd-Tab (both would show
  every app on this Mac); the stage's one-window rule is unchanged.

Safety: a real click happens only if the window under the pointer is the
cockpit's window for that step, and real keys only while that window is in
front. Otherwise that one click or text goes in the old way (Playwright), which
can only reach that page.

| Option | What it does |
|---|---|
| `--mouse human` (default) | The cockpit drives the real pointer and keyboard. |
| `--guide` (= `--mouse guide`) | **You** drive. For each click the cockpit shows where: a pulsing blue ring on the target, a ghost arrow gliding there from your pointer, and a short hint ("Click “Assignments”"). It waits until you click inside it (a click elsewhere is ignored). For typing it says "Click, then type …" and waits until the text is in the box (after 60 s it fills it in). For a scroll it says "Scroll down ↓" (after 20 s it scrolls). The ring, arrow and hint are left out of screen capture, so OBS does not record them. |
| `--old-mouse` (= `--mouse dom`) | The old way: a drawn pointer in the page and Playwright clicks. OBS then hides the system pointer so a take never shows two. Also used by itself when the helper cannot run. |

Live, while the cockpit runs: `POST /api/guide?k=<key>` turns guide mode on and
off; `POST /api/mouse?k=<key>&mode=human|guide|dom` sets the mode. The state
(`mouse: { mode, want, real }`) is in every teleprompter update.

**Needs (once):** System Settings > Privacy & Security > **Accessibility**: the
app you start `node cockpit.mjs` from (Terminal, iTerm or Visual Studio Code),
the same access the stage already uses. Without it the cockpit says so in the
log and uses `--old-mouse`.
