# NYC Nail Artists

Searchable, filterable directory of NYC nail artists, read live from a Google Sheet (no build step). The front end is a single vanilla-JS `index.html`; Vercel or Cloudflare Pages functions check public booking availability on demand.

- Data: Google Sheet `1yorNY5SrbFzbGx295afxff2bSLH23DHwdH58eMOI1vw`, fetched via `gviz/tq?tqx=out:csv`. The sheet must be shared "Anyone with the link can view".
- The sheet contains directory data only. Read-only booking IDs and services live in root `booking.json`; see [the place onboarding guide](docs/adding-a-place.md).
- Instagram photos on every card (profile embed, or curated `Photo posts` URLs).
- Filters: text search, service chips (Russian, Japanese gel, hard gel/BIAB, Gel-X, acrylic, nail art), neighborhood, type, booking platform, max price (lowest of base/hard gel price), min rating, optional hide ruled-out toggle (off by default). Sort by price, rating, or name.
- Filters sync to the URL, so filtered views are shareable (e.g. `?svc=russian&hood=Chelsea`).
- Star ratings read from the "Google rating" column (falls back to "Rating"); cards show service tags, Maps link, availability notes, and booking buttons.
- Test with a local CSV: `index.html?csv=test.csv`.
- Profile photos: cards show Instagram avatars from `photos.json` (data URIs), falling back to the name's initial. Regenerate with `python3 tools/fetch_photos.py --csv <sheet.csv> --account-id <your user_fbid>` then `python3 tools/build_photos_json.py` (the GitHub push path is text-only, so JPEGs live in `photos/` locally and ship via `photos.json`).
- Availability is checked only after clicking **Check availability**. Every place with a supported entry in `booking.json` is checked; requests use supported public endpoints, a three-minute in-memory cache, and never make or modify bookings. There is no scheduled polling.

## Architecture and deployment

- `index.html`: fetches and parses the public CSV, filters places, then sends one POST per eligible place to `/api/availability`. `?csv=...` and `?api=...` can override the sheet and API URLs for testing.
- `booking.json`: maps exact place names to supported platform, public IDs, service label, and last verification date.
- `api/availability.js` and `functions/api/availability.js`: equivalent Vercel and Cloudflare Pages functions.
- `lib/`: DST-aware New York date/time helpers, platform adapters (Acuity, Square, GlossGenius, Chronos), and the bounded timeout/cache/error handling.
- Cloudflare Pages (recommended, free): connect the repository, choose framework **None**, leave the build command empty, and use `/` as the output directory. Add `ALLOWED_ORIGINS` only for additional cross-origin clients. Same-origin requests use `/api/availability` without CORS configuration.
- Vercel alternative: import the repository and deploy with default settings; no build configuration or npm dependencies are needed. Set `ALLOWED_ORIGINS` only for additional cross-origin clients.
- The adapters use public booking endpoints for read-only availability. They do not book appointments or attempt to bypass captchas. Unsupported booking platforms remain manual.

## Booking configuration

Add availability entries to root `booking.json`, keyed by the exact `Name` in the directory sheet. Each entry contains `platform`, platform-specific `ids`, a human-readable `service`, and a `verified` date (`YYYY-MM-DD`). There is no enable switch: supported entries are checked on demand, and IDs older than 30 days are flagged.

## Map, prices and value

- **Map pins** come from `geo.json`, which maps each place Name to `[lat, lng]`. Rebuild it after adding addresses: export the sheet as CSV, then run `python3 tools/geocode.py --csv sheet.csv` (it uses OpenStreetMap Nominatim, bounded to Manhattan, at 1 request/second). Places with no street address get an **approx.** pin near their neighborhood's center (dashed outline).
- **Est. set with art** = the lowest manicure price (`Base gel` / `Hard gel`) plus the nail-art add-on parsed from `Art price`. The parsing works like this: "incl" means art is included, "$5/finger" is counted as ×10 nails, and "sets"/prices at or above the manicure price are treated as a full art-set price. Every total is an estimate. An optional `Art add-on $` column overrides the parse: enter a number, with `0` meaning art is included. **Best value** ranks the visible places by this total.
- **Price freshness:** optional sheet columns `Prices updated` (YYYY-MM-DD) and `Price source` (URL) show under each price box. Prices older than 180 days are flagged "may be outdated". `Other prices` (removal, extensions, French…) shows in the card's price list.

## Local development and checks

Node 24+ is recommended. There are no npm dependencies.

```sh
npm test
npm run dev
# Open http://localhost:3000/?csv=test.csv
MOCK=1 PORT=3000 npm run dev
npm run smoke
```

The development server serves static files and routes `/api/availability` through the Vercel handler. `MOCK=1` supplies fixed test responses (including a delayed Chronos response to exercise the browser timeout); it is dev-only. The smoke command checks each `booking.json` entry sequentially for tomorrow in New York.
