"""Write the root README and demo/RECORDING-PLAN.md from demo/chapters.py.

    python demo/build_pages.py

A chapter shows its loop only when demo/loops/<loop>.webp exists, and its full clip only when
demo/videos/<clip>.mp4 exists. Run demo/make_loops.py first, then this.
"""
import os

from chapters import CHAPTERS, GROUPS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
TRIAL_END = "2026-11-26"


def has(rel):
    return os.path.exists(os.path.join(ROOT, rel))


def readme():
    clips = sum(1 for c in CHAPTERS if has(f"demo/videos/{c['clip']}.mp4"))
    o = [
        "# Contoso Health Identity Lab", "",
        "**IAM and PAM lab · Microsoft Entra ID · identity as code**", "",
        "Michael Williams · Microsoft SC-300 · CyberArk Guardian, Sentry, Defender", "",
        "I built an identity platform for a fictional hospital with 5,000 employees. It runs in a real",
        "Microsoft Entra tenant, and all of it is code. The clips follow one new employee, Sam Rivera, from",
        "hire to departure. **In the first measured leaver run, for nurse Dana Okafor, Active Directory",
        "disabled the account in 7 seconds and Entra in less than 3 minutes.**", "",
        f"The {len(CHAPTERS)} chapters below show the lab in operation. Each loop is a silent clip at a higher speed.",
        "", "| Part | Chapter | Summary |", "|---|---|---|",
    ]
    for c in CHAPTERS:
        o.append(f"| {c['group']} | [{c['n']}. {c['title']}](#{c['anchor']}) | {c['summary']} |")
    o += ["", "Design decisions and risks: [36 decision records](lab/docs/adr/README.md) · "
          "[threat model](lab/docs/threat-model.md) · [risk register](lab/docs/risk-register.md) · "
          "[field notes](lab/docs/field-notes.md)"]
    for g in GROUPS:
        o += ["", f"## {g}"]
        for c in (x for x in CHAPTERS if x["group"] == g):
            o += ["", f"### {c['n']}. {c['title']}", "", f"**{c['line']}**", ""]
            loop, clip = f"demo/loops/{c['loop']}.webp", f"demo/videos/{c['clip']}.mp4"
            if has(loop):
                o += [f"![{c['title']}]({loop})"]
                if has(clip) and c["length"]:
                    o += ["", f"[Full clip, {c['length']}]({clip})"]
            else:
                o += ["The clip for this chapter comes later."]
    o += ["", "---", "",
          "Results, limits, and evidence: [`lab/docs/platform-details.md`](lab/docs/platform-details.md).",
          "How the clips are made: [`demo/README.md`](demo/README.md).", ""]
    with open(os.path.join(ROOT, "README.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(o))
    return clips


def plan():
    o = [
        "# Recording plan", "",
        f"One clip for each chapter of the README. The Entra trials end on {TRIAL_END}. Record the chapters",
        "with **Yes** in the trial column before that date. Those features stop when the trials end.", "",
        "| # | Chapter | Clip file in `demo/videos/` | Status | Trial | The clip must show | Evidence |",
        "|---|---|---|---|---|---|---|",
    ]
    for c in CHAPTERS:
        if has(f"demo/videos/{c['clip']}.mp4"):
            status = "Record again"
        elif c["clip"] in ("N03-one-account-two-directories", "N05-the-master-key"):
            status = "Not recorded (live sign-in)"
        else:
            status = "New part: write its steps"
        o.append(f"| {c['n']} | {c['title']} | `{c['clip']}.mp4` | {status} | {'Yes' if c['needs_trial'] else 'No'} "
                 f"| {c['show']} | {c['evidence'] or '-'} |")
    o += [
        "", "## Sequence of work", "",
        "1. Add the five new parts to `recording/steps.mjs`: N18, N19, N20, N21, N22.",
        "2. Record all the clips: `npm run clips` in `recording/`.",
        "3. Record N03 and N05 live. They need a person to sign in.",
        "4. Add the captions: `npm run captions -- <dir>`.",
        "5. Copy the clips to `demo/videos/` with the file names in the table.",
        "6. Build the loops: `python demo/make_loops.py`.",
        "7. Build the pages: `python demo/build_pages.py`.",
        "8. Look at each loop before you push. A clip with a failed step must be recorded again.", "",
        "## Rules for each clip", "",
        "- Show one topic only. Stop when the chapter line is proven.",
        "- Keep each clip shorter than 3 minutes.",
        "- Use the neutral lab accounts. Show no personal mailbox, no public IP address, and no tenant ID.",
        "- A step that changes the lab shows its captured screen, with a label.", "",
        "The chapter list is `demo/chapters.py`. Change a title or a line there, then build the pages again.", "",
    ]
    with open(os.path.join(HERE, "RECORDING-PLAN.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(o))


if __name__ == "__main__":
    n = readme()
    plan()
    print(f"README.md: {len(CHAPTERS)} chapters, {n} with a clip. demo/RECORDING-PLAN.md written.")
