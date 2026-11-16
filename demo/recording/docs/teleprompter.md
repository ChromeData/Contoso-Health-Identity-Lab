# The speech-aware teleprompter: say it your way, it ticks it off

[Recording cockpit](../README.md) · page 9 of 14


The lines are an outline. Say each one in your own words: the cockpit listens
on this Mac and checks a line off when its **meaning** was said, not its exact
words. "Microsoft Azure is the server hub" is ticked by "Microsoft Azure is
where we hold local cloud servers".

- **On the teleprompter:** each point (one sentence of the lines) has a faint
  ring at its left. It turns into a small green check once you have said it.
  A point you went past (you said a later one, not this one) gets a faint
  amber ring and a dotted underline: say it, or re-record. A small line under
  the light says what it heard and "2 of 3 said". When you leave a step with a
  point not said, the next card shows it in small amber text.
- **Auto-advance (on by default, A turns it off):** once every point of the
  step is said and you pause for about a second, the cockpit presses NEXT for
  you (the same NEXT as the key). It waits while a step is still working or
  the light is yellow, red or blue, and never finishes the last step by itself.
  The NEXT key keeps working as always.
- **The report:** `takes/latest.md` lists every step with points not said
  (its latest take), so you know what to re-record. Each run also writes
  `takes/<date>/<time>-<mode>.json` (every visit: points, what was heard,
  the transcript) and `.md`.
- **Off-topic talk is ignored** ("let me wait for this to load"): it checks
  nothing and does not stop the tracking.
- **How:** ffmpeg reads the microphone; a small voice detector cuts what you
  say at each pause; whisper.cpp (`whisper-server`, model `base.en`, Metal)
  writes it down on this Mac in about 0.1 to 0.3 s; a sentence-meaning model
  (all-mpnet-base-v2 through transformers.js, on this Mac) compares it with
  each point of the step. A sentence counts only for the point it is closest
  to, so saying one point never ticks its neighbour. Nothing leaves the Mac.
- **Settings:** `.state/speech.json` (`listen`, `autoAdvance`, `mic`, the
  ffmpeg avfoundation device: `default`, a name or an index; `model`:
  `base.en` or `small.en`). `--no-listen` turns it off for one run; it is
  always off for `--preview`, `--storyboard` and `--auto`.
- **Microphone permission:** the app that runs the cockpit (VS Code's terminal
  today, which already has it) needs **System Settings > Privacy &
  Security > Microphone**. Without it macOS sends silence; the small line
  says so.
- **Once (already done on this Mac):** the models are in `models/` (not in
  git): `ggml-base.en.bin` and `ggml-small.en.bin` from
  `huggingface.co/ggerganov/whisper.cpp`; the meaning model downloads itself
  into `models/hf/` on first use. `npm install` for `@huggingface/transformers`.
- **After editing lines in `steps.mjs`:** `npm run points` writes each step's
  points into `steps.points.json` (a changed step is derived on the fly anyway).
- **Accuracy:** `node tools/points-eval.mjs` (typed) or `npm run test:speech`
  (each sentence spoken by macOS voices and written down by whisper first) on
  `tests/points-testset.json`: 120 paraphrases of real lines (each also a
  negative for the step's other points) and 34 off-topic sentences (negatives
  for every point of every step). `--tune` re-tunes on split A and reports the
  held-out split B.
