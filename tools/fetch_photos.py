#!/usr/bin/env python3
"""Download Instagram profile pictures for the dashboard's avatar convention.

Reads the "Instagram" column from a CSV (same header format as the sheet),
resolves each handle's profile picture via instagram-cli, and saves it to
photos/<handle>.jpg (handle lowercased, leading @ stripped). Existing files
are skipped. Auth is handled by instagram-cli; no keys live here.

  python3 tools/fetch_photos.py [--csv PATH] [--account-id FBID] [--out DIR]
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
import urllib.request

CLI = "/opt/hatch/bin/instagram-cli"
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.join(os.path.dirname(HERE), "photos")
MAX_LOOKUPS = 50  # Instagram rate-limits per-profile reads after a few dozen


def cli(*args):
    p = subprocess.run([CLI, *args], capture_output=True, text=True, timeout=120)
    if p.returncode != 0:
        raise RuntimeError((p.stderr or p.stdout).strip()[:300] or f"exit {p.returncode}")
    return json.loads(p.stdout)


def pick_account(explicit):
    if explicit:
        return explicit
    accts = cli("accounts").get("accounts") or []
    if len(accts) == 1:
        return accts[0]["user_fbid"]
    names = ", ".join(f"{a['username']}={a['user_fbid']}" for a in accts) or "none linked"
    sys.exit(f"Pass --account-id; linked accounts: {names}")


def handles_from_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        return []
    head = [h.strip().lower() for h in rows[0]]
    col = next((i for i, h in enumerate(head) if h == "instagram"), None)
    if col is None:
        col = next((i for i, h in enumerate(head) if h.startswith("instagram")), None)
    if col is None:
        sys.exit(f"No Instagram column in {path}")
    seen, out = set(), []
    for r in rows[1:]:
        h = (r[col] if col < len(r) else "").strip().lstrip("@").lower()
        # Must match the dashboard's photos/<handle>.jpg convention exactly.
        if h and re.fullmatch(r"[a-z0-9._]+", h) and h not in seen:
            seen.add(h)
            out.append(h)
    return out


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    if not data:
        raise RuntimeError("empty image")
    tmp = dest + ".part"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, dest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="/tmp/nails-v2/test.csv")
    ap.add_argument("--account-id", help="your own linked user_fbid (from `instagram-cli accounts`)")
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args()

    os.makedirs(a.out, exist_ok=True)
    handles = handles_from_csv(a.csv)
    todo = [h for h in handles if not os.path.exists(os.path.join(a.out, h + ".jpg"))]
    skipped = [h for h in handles if h not in todo]
    fetched, failed = [], []
    if todo:
        acct = pick_account(a.account_id)
        for h in todo[:MAX_LOOKUPS]:
            try:
                res = cli("profile", "--account-id", acct, "--username", h)
                prof = next((p for p in res.get("profiles") or []
                             if (p.get("username") or "").lower() == h), None)
                pic = prof and prof.get("profile_pic_url")
                if not pic or str(prof.get("has_anonymous_profile_picture")) == "True":
                    raise RuntimeError("no profile picture")
                download(pic, os.path.join(a.out, h + ".jpg"))
                fetched.append(h)
            except Exception as e:
                msg = str(e)
                failed.append((h, msg))
                if "429" in msg or "Too Many Requests" in msg:
                    failed += [(x, "not attempted (rate limited)") for x in todo[len(fetched) + len(failed):]]
                    break
        failed += [(x, "not attempted (lookup cap)") for x in todo[MAX_LOOKUPS:]]

    print(f"fetched: {len(fetched)}  skipped (exists): {len(skipped)}  failed: {len(failed)}")
    for h in fetched:
        print(f"  + {h}")
    for h, why in failed:
        print(f"  ! {h}: {why}")
    return 1 if failed and not fetched and not skipped else 0


if __name__ == "__main__":
    sys.exit(main())
