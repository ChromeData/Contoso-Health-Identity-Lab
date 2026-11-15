"""Build the README loops from the walkthrough clips.

    python demo/make_loops.py            # all clips
    python demo/make_loops.py N08        # one clip

Each loop is a silent animated WebP: the clip at a higher speed, 800 px wide, with the chapter number
and title on a bar at the top. Output: demo/loops/<NN>-<name>.webp. Needs ffmpeg on the path.
The chapter list is demo/chapters.py.
"""
import glob
import os
import shutil
import subprocess
import sys

from chapters import CHAPTERS

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEOS = os.path.join(HERE, "videos")
LOOPS = os.path.join(HERE, "loops")
FF = shutil.which("ffmpeg") or "ffmpeg"
FP = shutil.which("ffprobe") or "ffprobe"
FONT = "C\\:/Windows/Fonts/segoeuib.ttf" if os.name == "nt" else "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
W, FPS, BAR, TARGET = 800, 6, 44, 18.0        # width, frames per second, title bar height, loop length in seconds


def duration(path):
    out = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def main():
    want = sys.argv[1:]
    os.makedirs(LOOPS, exist_ok=True)
    if not want:                                  # a full build: no loop from an old chapter list stays
        for old in glob.glob(os.path.join(LOOPS, "*.webp")):
            os.remove(old)
    for c in CHAPTERS:
        if want and not any(c["clip"].startswith(w) for w in want):
            continue
        src = os.path.join(VIDEOS, c["clip"] + ".mp4")
        if not os.path.exists(src):
            print(f"{c['n']:>2} {c['title']:<40} no clip yet")
            continue
        dur = duration(src)
        speed = min(12.0, max(4.0, dur / TARGET))
        out = os.path.join(LOOPS, c["loop"] + ".webp")
        label = f"{c['n']}  {c['title']}".replace(":", "\\:").replace("'", "")
        vf = ",".join([
            f"setpts=PTS/{speed:.3f}", f"fps={FPS}", f"scale={W}:-2:flags=lanczos",
            f"pad={W}:ih+{BAR}:0:{BAR}:color=0x1f2328",
            f"drawtext=fontfile='{FONT}':text='{label}':fontcolor=white:fontsize=22:x=16:y=({BAR}-text_h)/2",
            "tpad=stop_mode=clone:stop_duration=1.5",
        ])
        p = subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", src, "-vf", vf, "-an",
                            "-c:v", "libwebp_anim", "-loop", "0", "-quality", "50", "-compression_level", "5", out],
                           capture_output=True, text=True)
        if p.returncode:
            sys.exit(p.stderr[-1200:])
        print(f"{c['n']:>2} {c['title']:<40} {dur:4.0f}s x{speed:4.1f} -> {dur / speed + 1.5:4.1f}s  {os.path.getsize(out) / 1e6:4.1f} MB")


if __name__ == "__main__":
    main()
