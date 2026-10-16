# NYC Nail Artists

Searchable, filterable directory of NYC nail artists, read live from a Google Sheet (no build step). Single `index.html`, vanilla JS.

- Data: Google Sheet `1yorNY5SrbFzbGx295afxff2bSLH23DHwdH58eMOI1vw`, fetched via `gviz/tq?tqx=out:csv`. The sheet must be shared "Anyone with the link can view".
- Edit the sheet and refresh the page to see changes.
- Filters: text search, service chips (Russian, Japanese gel, hard gel/BIAB, Gel-X, acrylic, nail art), neighborhood, type, booking platform, max price (lowest of base/hard gel price), min rating, hide ruled-out toggle. Sort by price, rating, or name.
- Filters sync to the URL, so filtered views are shareable (e.g. `?svc=russian&hood=Chelsea`).
- Star ratings read from the "Google rating" column (falls back to "Rating"); cards show service tags, Maps link, availability notes, and booking buttons.
- Test with a local CSV: `index.html?csv=test.csv`.
- Profile photos: cards show Instagram avatars from `photos.json` (data URIs), falling back to the name's initial. Regenerate with `python3 tools/fetch_photos.py --csv <sheet.csv> --account-id <your user_fbid>` then `python3 tools/build_photos_json.py` (the GitHub push path is text-only, so JPEGs live in `photos/` locally and ship via `photos.json`).
