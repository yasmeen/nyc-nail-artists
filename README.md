# NYC Nail Artists

Searchable, filterable directory of NYC nail artists, read live from a Google Sheet (no build step). The front end is a single vanilla-JS `index.html`; an optional Vercel Node function checks public booking availability on demand.

- Data: Google Sheet `1yorNY5SrbFzbGx295afxff2bSLH23DHwdH58eMOI1vw`, fetched via `gviz/tq?tqx=out:csv`. The sheet must be shared "Anyone with the link can view".
- The sheet is the source of truth for place IDs and services; platform IDs are not embedded in the app. See [the sheet columns](#availability-sheet-columns) and [the place onboarding guide](docs/adding-a-place.md).
- Instagram photos on every card (profile embed, or curated `Photo posts` URLs).
- Filters: text search, service chips (Russian, Japanese gel, hard gel/BIAB, Gel-X, acrylic, nail art), neighborhood, type, booking platform, max price (lowest of base/hard gel price), min rating, optional hide ruled-out toggle (off by default). Sort by price, rating, or name.
- Filters sync to the URL, so filtered views are shareable (e.g. `?svc=russian&hood=Chelsea`).
- Star ratings read from the "Google rating" column (falls back to "Rating"); cards show service tags, Maps link, availability notes, and booking buttons.
- Test with a local CSV: `index.html?csv=test.csv`.
- Profile photos: cards show Instagram avatars from `photos.json` (data URIs), falling back to the name's initial. Regenerate with `python3 tools/fetch_photos.py --csv <sheet.csv> --account-id <your user_fbid>` then `python3 tools/build_photos_json.py` (the GitHub push path is text-only, so JPEGs live in `photos/` locally and ship via `photos.json`).
- Availability is checked only after clicking **Check availability**. Results query supported public endpoints for enabled rows, use a three-minute in-memory cache, and never make or modify bookings. There is no scheduled polling.

## Architecture and deployment

- `index.html`: fetches and parses the public CSV, filters places, then sends one POST per eligible place to `/api/availability`. `?csv=...` and `?api=...` can override the sheet and API URLs for testing.
- `api/availability.js`: Vercel Node serverless function; validates requests, restricts cross-origin access, and returns only normalized slots and coarse error states.
- `lib/`: DST-aware New York date/time helpers, platform adapters (Acuity, Square, GlossGenius, Chronos), and the bounded timeout/cache/error handling.
- Vercel deployment: import this repository in the Vercel dashboard and deploy with the default settings; no build configuration or npm dependencies are needed. Set `ALLOWED_ORIGINS` to a comma-separated list only if the browser app is served from other origins. Same-origin requests do not need CORS configuration.
- The adapters use public booking endpoints for read-only availability. They do not book appointments or attempt to bypass captchas. Unsupported booking platforms remain manual.

## Availability sheet columns

Add these headers to the sheet; header matching is case-insensitive and accepts prefixes:

| Column | Value |
| --- | --- |
| `Platform IDs (JSON)` | The platform-specific ID object as JSON |
| `Availability service` | Human-readable service label shown to users |
| `Availability enabled` | `Y` to query, otherwise `N` |
| `IDs last verified` | Verification date in `YYYY-MM-DD` |

New or updated IDs should be checked against the provider's public booking page before enabling a row. The UI flags enabled IDs older than 30 days or without a verification date.

## Map, prices and value

- **Map pins** come from `geo.json`, which maps each place Name to `[lat, lng]`. Rebuild it after adding addresses: export the sheet as CSV, then run `python3 tools/geocode.py --csv sheet.csv` (it uses OpenStreetMap Nominatim, bounded to Manhattan, at 1 request/second). Places with no street address get an **approx.** pin near their neighborhood's center (dashed outline).
- **Est. set with art** = the lowest manicure price (`Base gel` / `Hard gel`) plus the nail-art add-on parsed from `Art price`. The parsing works like this: "incl" means art is included, "$5/finger" is counted as ×10 nails, and "sets"/prices at or above the manicure price are treated as a full art-set price. Every total is an estimate. An optional `Art add-on $` column overrides the parse: enter a number, with `0` meaning art is included. **Best value** ranks the visible places by this total.

## Local development and checks

Node 24+ is recommended. There are no npm dependencies.

```sh
npm test
npm run dev
# Open http://localhost:3000/?csv=test.csv
MOCK=1 PORT=3000 npm run dev
npm run smoke -- --csv test.csv
```

The development server serves static files and routes `/api/availability` through the same handler as Vercel. `MOCK=1` supplies fixed test responses (including a delayed Chronos response to exercise the browser timeout); it is dev-only. The smoke command checks each `Availability enabled=Y` row sequentially for tomorrow in New York and makes one direct adapter request per row.
