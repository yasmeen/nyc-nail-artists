#!/usr/bin/env python3
"""Bundle photos/*.jpg into photos.json as data URIs.

The GitHub push path is text-only, so binary JPEGs can't be committed
directly. This script packs them into a single JSON file the dashboard
loads at runtime (with graceful fallback to letter avatars).

  python3 tools/build_photos_json.py [--dir photos] [--out photos.json]
"""
import argparse
import base64
import json
import os

ap = argparse.ArgumentParser()
ap.add_argument("--dir", default="photos")
ap.add_argument("--out", default="photos.json")
a = ap.parse_args()

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdir = a.dir if os.path.isabs(a.dir) else os.path.join(base, a.dir)
out = a.out if os.path.isabs(a.out) else os.path.join(base, a.out)

mapping, skipped = {}, 0
for fn in sorted(os.listdir(pdir)):
    if not fn.lower().endswith(".jpg"):
        skipped += 1
        continue
    handle = fn[:-4].lower()
    with open(os.path.join(pdir, fn), "rb") as f:
        raw = f.read()
    if raw[:2] != b"\xff\xd8":
        print(f"  ! {fn}: not a JPEG, skipped")
        skipped += 1
        continue
    mapping[handle] = "data:image/jpeg;base64," + base64.b64encode(raw).decode()

with open(out, "w") as f:
    json.dump(mapping, f)
size = os.path.getsize(out)
print(f"wrote {out}: {len(mapping)} photos, {size/1024:.0f} KB, {skipped} skipped")
