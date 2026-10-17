# NYC Nail Artists

Searchable, filterable directory of NYC nail artists, read live from a Google Sheet (no build step). The front end is a single vanilla-JS `index.html`; Vercel or Cloudflare Pages functions check public booking availability on demand.

- Data: Google Sheet `1yorNY5SrbFzbGx295afxff2bSLH23DHwdH58eMOI1vw`, fetched via `gviz/tq?tqx=out:csv`. The sheet must be shared "Anyone with the link can view".
- The sheet contains directory data only. Read-only booking IDs and services live in root `booking.json`; see [the place onboarding guide](docs/adding-a-place.md).
- Researching a place's details (handle, address, prices, art add-on, photos): follow [the research guide](docs/research-guide.md). It covers where to look for each sheet column, how to search Instagram exhaustively, and the cell formats the site parses.
- Feed layouts: switch between a compact List and Photo cards. The List defaults to **Most details first** (or closest first with a starting point); Photo cards lead with Instagram photos (profile embed, or curated `Photo posts` URLs) in a Pinterest-style column layout, with concise price, walk time, openings and technique summaries underneath.
- Search reads as one editable sentence: technique, art (none or simple), total budget, day and earliest time, walking distance, and starting point (a preset or your location). Places whose total is unknown stay visible, marked "Total unknown", and are never ranked as cheap. More filters (neighborhood, type, booking platform, min rating and sort) sit under **More filters**.
- **Known for** chips come from the `Styles` column (tortoiseshell, French, hand-painted art, minimal, chrome, cat eye, gems, ombré). Tapping one moves those places to the top; it never hides anyone.
- **Saved**: the heart on each card saves a place in this browser (`localStorage`, no account). The Saved tab splits saved places into those that fit the current search and those that don't (with the reason), and can check openings for the ones that fit. **Copy link** shares the list via `?saved=`.
- Walk times are estimates: the street-grid distance from the chosen start to the `geo.json` pin, at about 3 mph. Places without an address use an approximate neighborhood pin and are labelled "approx."
- Light and dark mode follow the device; the header button switches between Auto, Light and Dark (saved in this browser).
- Terminology: the Structured / hard gel chip and search synonyms cover hard gel, Japanese gel, builder/BIAB, structured, and overlay terms; see the in-page glossary.
- The search sentence and filters sync to the URL, so filtered views are shareable (e.g. `?svc=russian&max=120&from=usq`).
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
- **Set with art** = the lowest manicure price (`Base gel` / `Hard gel`) plus the explicitly listed cheapest full-set nail-art add-on in `Art add-on $`. Enter a number for the add-on; `0` means art is included. Only places with that number or explicit “included” text in `Art price` are ranked. Other nail-art prices remain visible in the price list but are not used to guess a total. **Best value: manicure + cheapest art** ranks the visible places by this total.
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
