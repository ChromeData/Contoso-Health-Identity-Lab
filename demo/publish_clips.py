"""Put clips from the hidden recorder into the repo.

    python demo/publish_clips.py <run folder> [<run folder> ...]

A run folder is the output of `npm run win:clips` (demo/recording/win). For each part in it:
1. The part is used only if each step passed (its timeline file says so).
2. The captions are added (demo/recording/tools/caption.py).
3. The captioned clip goes to demo/videos/<clip>.mp4.
4. demo/recorded.json gets the date, the length and the number of steps.

If a part is in more than one folder, the last folder is used. Then run demo/make_loops.py and
demo/build_pages.py. Look at each loop before you push.
"""
import datetime
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEOS = os.path.join(HERE, "videos")
CAPTION = os.path.join(HERE, "recording", "tools", "caption.py")
RECORDED = os.path.join(HERE, "recorded.json")


def seconds(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def main(folders):
    if not folders:
        sys.exit(__doc__)
    good, bad = {}, {}
    for d in folders:
        for tl in sorted(glob.glob(os.path.join(d, "*.timeline.json"))):
            t = json.load(open(tl, encoding="utf-8"))
            clip = os.path.join(d, t["part"] + ".mp4")
            failed = [s["id"] for s in t["steps"] if not s["ok"]]
            if failed or not os.path.exists(clip):
                bad[t["part"]] = failed or ["no clip"]
                good.pop(t["part"], None)
            else:
                good[t["part"]] = (clip, t)
                bad.pop(t["part"], None)
    recorded = json.load(open(RECORDED, encoding="utf-8")) if os.path.exists(RECORDED) else {}
    os.makedirs(VIDEOS, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="publish-") as work:
        lines = []
        for part, (clip, t) in good.items():
            shutil.copy(clip, os.path.join(work, part + ".mp4"))
            lines += [{"piece": s["piece"], "at": s["at"], "end": s.get("end"), "text": " ".join(s["say"])} for s in t["steps"]]
        json.dump(lines, open(os.path.join(work, "watch-lines.json"), "w", encoding="utf-8"))
        subprocess.check_call([sys.executable, CAPTION, work])
        for part, (clip, t) in sorted(good.items()):
            out = os.path.join(VIDEOS, part + ".mp4")
            shutil.copy(os.path.join(work, "captioned", part + ".mp4"), out)
            sec = round(seconds(out))
            recorded[part] = {"date": t["recorded"][:10], "length": "%d:%02d" % divmod(sec, 60), "steps": len(t["steps"])}
            print("published %-52s %s  %d steps" % (part, recorded[part]["length"], len(t["steps"])))
    json.dump(dict(sorted(recorded.items())), open(RECORDED, "w", encoding="utf-8"), indent=1)
    for part, why in sorted(bad.items()):
        print("NOT published %-48s failed: %s" % (part, ", ".join(why)))


if __name__ == "__main__":
    main(sys.argv[1:])
