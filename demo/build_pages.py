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
            status = "New part: steps written, not tested"
        o.append(f"| {c['n']} | {c['title']} | `{c['clip']}.mp4` | {status} | {'Yes' if c['needs_trial'] else 'No'} "
                 f"| {c['show']} | {c['evidence'] or '-'} |")
    first = [c for c in CHAPTERS if c["needs_trial"]]
    o += [
        "", "## Record these first", "",
        f"These {len(first)} chapters use features that stop on {TRIAL_END}. Record them before the others.", "",
    ]
    o += [f"- {c['n']}. {c['title']} (`{c['clip']}`)" for c in first]
    o += [
        "", "## Sequence of work", "",
        "All commands run in `recording/` on the Mac.", "",
        "1. Get the branch: `git pull`, then `npm install`.",
        "2. Check the steps: `npm test`.",
        "3. Test each new part with no recording: `node cockpit.mjs --check N18`. Do the same for N19, N20, N21, N22.",
        "4. Correct a step that fails. The web steps of N18 are the most probable to fail: they find text on Entra pages.",
        "5. Build the speech points for the new lines: `npm run points`.",
        "6. Record the clips: `npm run clips`. The run stops with an error and names each part that has a failed step.",
        "7. Record N03 and N05 live. They need a person to sign in.",
        "8. Add the captions: `npm run captions -- <dir>`.",
        "9. Copy the clips to `demo/videos/` with the file names in the table.",
        "10. Build the loops: `python demo/make_loops.py`.",
        "11. Build the pages: `python demo/build_pages.py`.",
        "12. Look at each loop before you push.", "",
        "## The five new parts", "",
        "N18 to N22 were written on a Windows PC from the files in the lab. The step checker passes:",
        "each file exists and each highlight is on the correct lines. They did not run in the tenant.",
        "N19, N20 and N21 show files only. N18 opens two web pages. N22 uses the drill steps that came from N06,",
        "so N06 now stops at the incident.", "",
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
