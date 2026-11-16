# The keys

[Recording cockpit](../README.md) · page 8 of 14


| Key | What it does |
|---|---|
| **Space**, **→**, **PageDown**, **Enter**, or the big **NEXT** button | Does the next step and shows its line. If the light is still yellow (the screen isn't ready yet), the first press only warns you. Press it again within 6 seconds to go anyway. |
| **←**, **PageUp**, or **BACK** | Goes back one step and shows that screen again. Steps that changed something (commit, push and so on) are not done a second time. |
| **R** | Redo this step (for example, if a page loaded slowly). If the step changes something, press R twice. |
| **T** | **Retake this piece.** Press T twice. The cockpit stops OBS and throws away this piece's file, runs the piece's reset (see below), and goes back to the piece's first step. Press NEXT when you're ready. |
| **L** | Listening on or off (the speech-aware teleprompter, below). |
| **A** | Auto-advance on or off. |
| **M** | The pointer: human, then guide, then dom (the button shows which). |

A presentation clicker sends PageDown and PageUp. **Pair it with the phone or
iPad that shows the teleprompter, not with the Mac.** The cockpit brings
VS Code and Chrome to the front for the camera. On the Mac, a key only reaches
the teleprompter while the teleprompter's window has focus.

**Light:**
- grey: nothing to wait for.
- blue: the cockpit is working.
- yellow: waiting on GitHub or Microsoft. OBS is paused.
- green: the next screen is ready. OBS is recording again.
- red: the cockpit needs your hand. The reason and the fallback appear under
  your line.

**"You:"** lines in orange are the things you do with your own hands. Typing
`approve` on the approval issue is always yours. The cockpit opens the issue
and puts the cursor in the comment box.
