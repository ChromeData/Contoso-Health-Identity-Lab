"""Package the cockpit-bridge extension as a .vsix on Windows (no zip tool, no npm).

    python -I win/build_vsix.py <output folder>

The same package vscode-ext/build-vsix.sh makes on the Mac: it reads the two
XML parts from that script, so there is one copy of them. Prints the path.
"""
import json
import os
import re
import sys
import zipfile

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vscode-ext")
pkg = json.load(open(os.path.join(here, "package.json"), encoding="utf-8"))
sh = open(os.path.join(here, "build-vsix.sh"), encoding="utf-8").read()
types = re.search(r"\[Content_Types\]\.xml\" <<'XML'\n(.*?)\nXML", sh, re.S).group(1)
manifest = re.search(r"extension\.vsixmanifest\" <<XML\n(.*?)\nXML", sh, re.S).group(1)
manifest = manifest.replace("$name", pkg["name"]).replace("$ver", pkg["version"]).replace("$pub", pkg["publisher"])
out = os.path.join(sys.argv[1], "%s-%s.vsix" % (pkg["name"], pkg["version"]))
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", types + "\n")
    z.writestr("extension.vsixmanifest", manifest + "\n")
    z.write(os.path.join(here, "package.json"), "extension/package.json")
    z.write(os.path.join(here, "extension.js"), "extension/extension.js")
print(out)
