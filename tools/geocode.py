"""Geocode street addresses from the sheet CSV into geo.json (name -> [lat, lng]).

Only rows whose Address starts with a street number are geocoded; the page
estimates everything else from the neighborhood. Uses OpenStreetMap Nominatim (Manhattan-bounded)
at 1 request/second. Existing entries are kept unless --refresh is passed.

    python3 tools/geocode.py --csv sheet.csv
"""
import argparse, csv, json, re, time, urllib.parse, urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "geo.json"
UA = "nyc-nail-artists/1.0 (github.com/yasmeen/nyc-nail-artists)"
# Bounded to Manhattan: bare street addresses ("130 7th Ave") otherwise resolve to Brooklyn.
MANHATTAN = "-74.03,40.88,-73.90,40.69"


def col(header, prefix):
    h = [x.strip().lower() for x in header]
    return next((i for i, x in enumerate(h) if x == prefix), None) or next(
        (i for i, x in enumerate(h) if x.startswith(prefix)), None)


def geocode(addr):
    q = re.split(r",\s*(?:ny|nyc|new york)\b", addr, flags=re.I)[0] + ", Manhattan, New York, NY"
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "json", "limit": 1, "viewbox": MANHATTAN, "bounded": 1})
    res = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=20))
    if not res:
        return None
    return [round(float(res[0]["lat"]), 5), round(float(res[0]["lon"]), 5)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--refresh", action="store_true")
    a = ap.parse_args()
    rows = list(csv.reader(open(a.csv, newline="", encoding="utf-8")))
    ni, ai = col(rows[0], "name"), col(rows[0], "address")
    geo = {} if a.refresh or not OUT.exists() else json.loads(OUT.read_text())
    for r in rows[1:]:
        name = (r[ni] if ni < len(r) else "").strip()
        addr = (r[ai] if ai < len(r) else "").strip()
        if not name or name in geo or not re.match(r"^\d+\s", addr):
            continue
        clean = re.sub(r",?\s*\d+(st|nd|rd|th)\s+(floor|fl)\b\.?", "", addr, flags=re.I)
        clean = re.sub(r",?\s*(suite|ste|fl|floor|#)\b[^,]*", "", clean, flags=re.I)
        try:
            hit = geocode(clean)
        except Exception as e:  # network hiccup: skip, retry next run
            print(f"skip {name}: {e}")
            hit = None
        time.sleep(1.1)
        print(f"{'ok  ' if hit else 'miss'} {name}: {clean} -> {hit}")
        if hit:
            geo[name] = hit
    OUT.write_text(json.dumps(dict(sorted(geo.items())), indent=0) + "\n")
    print(f"wrote {len(geo)} entries to {OUT}")


if __name__ == "__main__":
    main()
