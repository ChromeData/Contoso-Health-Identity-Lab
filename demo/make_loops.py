"""Build the README loops from the walkthrough clips.

    python demo/make_loops.py            # all clips
    python demo/make_loops.py N08        # one clip

Each loop is a silent animated WebP: the clip at a higher speed, 800 px wide, with the chapter number
and title on a bar at the top. Output: demo/loops/<NN>-<name>.webp. Needs ffmpeg on the path.
"""
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEOS = os.path.join(HERE, "videos")
LOOPS = os.path.join(HERE, "loops")
FF = shutil.which("ffmpeg") or "ffmpeg"
FP = shutil.which("ffprobe") or "ffprobe"
FONT = "C\\:/Windows/Fonts/segoeuib.ttf" if os.name == "nt" else "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
W, FPS, BAR, TARGET = 800, 6, 44, 18.0        # width, frames per second, title bar height, loop length in seconds

# clip file -> (chapter number, loop name, title on the bar)
CHAPTERS = {
    "N01-the-blueprints": (1, "change-access-with-code", "Change access with code"),
    "N02-hired": (2, "hr-hires-an-employee", "HR hires an employee"),
    "N04-first-day-doors": (4, "access-on-day-one", "Access on day one"),
    "N04b-the-service-desk": (5, "request-more-access", "Request more access"),
    "N06-the-cameras": (7, "detection-in-sentinel", "Detection in Sentinel"),
    "N07-the-second-camera": (8, "detection-in-splunk", "Detection in Splunk"),
    "N08-leaving": (9, "the-employee-leaves", "The employee leaves"),
    "N09-the-logbook": (10, "audit-evidence", "Audit evidence"),
    "N10-microsoft-features": (11, "access-governance", "Access governance"),
    "N11-admin-passwords-and-sessions": (12, "admin-passwords-and-sessions", "Admin passwords and recorded sessions"),
    "N12-hardening-ad": (13, "harden-active-directory", "Harden Active Directory"),
    "N13-adfs-to-entra": (14, "move-an-app-from-ad-fs", "Move an app from AD FS"),
    "N14-okta": (15, "move-the-clinic-from-okta", "Move the clinic from Okta"),
    "N15-aws-server-access-and-azure-least-privilege": (16, "aws-and-azure-admin-access", "Admin access in AWS and Azure"),
    "N16-code-checks": (17, "checks-on-the-code", "Checks on the code"),
    "N17-close-vscode-github": (18, "the-lab-in-vs-code-and-github", "The lab in VS Code and GitHub"),
}


def duration(path):
    out = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def main():
    want = [a for a in sys.argv[1:]]
    os.makedirs(LOOPS, exist_ok=True)
    for clip, (num, name, title) in CHAPTERS.items():
        if want and not any(clip.startswith(w) for w in want):
            continue
        src = os.path.join(VIDEOS, clip + ".mp4")
        if not os.path.exists(src):
            print(f"skip {clip}: no clip")
            continue
        dur = duration(src)
        speed = min(12.0, max(4.0, dur / TARGET))
        out = os.path.join(LOOPS, f"{num:02d}-{name}.webp")
        label = f"{num}  {title}".replace(":", "\\:")
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
        print(f"{num:>2} {name:<34} {dur:4.0f}s x{speed:4.1f} -> {dur / speed + 1.5:4.1f}s  {os.path.getsize(out) / 1e6:4.1f} MB")


if __name__ == "__main__":
    main()
