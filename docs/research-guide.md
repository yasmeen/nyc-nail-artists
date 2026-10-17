# Research guide: finding each detail for a place

This guide is for agents (Muse, Devin, Claude) filling in the shared Google Sheet. For each column it says where to look first, where to look next and when to stop. The site reads the sheet live, so the format of each cell matters. The format rules below match how `index.html` parses them.

## Ground rules

- **Match rows by the exact `Name`**, never by row number. Other agents add rows while you work.
- **Re-read the row right before writing.** Only write cells that are still blank. If a cell already has a value and you found something different, don't overwrite it. Report the old value, the new value and the source to Yasmeen instead.
- **The sheet holds directory facts only.** Booking IDs go in `booking.json` (see [adding a place](adding-a-place.md)). Saved photos go in `photos/manifest.json`. Availability results are never stored anywhere.
- **The directory is neutral.** Don't add "candidate" / "ruled out" judgments. Record facts like price, technique and location, and let the site's filters do the choosing.
- **Use public sources the way a normal visitor would.** Never log in with someone else's account, solve or bypass a captcha, use unofficial/private APIs, or start a booking. If a site blocks you (Vagaro often returns 403), skip it and try the next source.
- **Go at a browsing pace.** Spread Instagram work out across a session, not dozens of profiles in a burst.
- **Leave a cell blank rather than guess.** A blank cell shows as "not listed". A wrong value ranks a place wrongly.

## Step 1: confirm it's the same business

Do this before copying anything from a source. Many names are shared: "Jade Nails" and "Asya" turned up salons in Orlando and Turkey, and "Nail Spot NYC" has a Bronx listing while the sheet's row is in Astoria.

A source counts as the same business when **at least two** of these match the row:
1. Name, or an obvious variant (e.g. "Artonus Nailsroom" / "Art on Us").
2. Street address or neighborhood.
3. Instagram handle linked from the source, or the source linked from the Instagram bio.
4. Phone number.

A suite-number mismatch on the same street address (e.g. 1011 vs 1012) still counts as a match; mention it in your report. A different street address doesn't count. Withhold the data and report it, even if the name matches exactly.

## Step 2: where to look, in order

Work down the list until you have the detail, then stop. Write down the URL where you found it.

1. **The business's own website.** Look at Services, Menu, Pricing, Book, Contact and FAQ pages, and the footer (address, phone, socials).
2. **Their public booking page:** Square, GlossGenius, Acuity (`*.as.me`), Fresha, Booksy, Setmore, Chronos, Vagaro. Service menus often show prices and durations without starting a booking. Open each service category; some pages collapse them.
3. **Instagram:** use the full checklist below.
4. **Google Maps business profile:** address, phone, hours, star rating and review count, and sometimes a "Services" price list or menu photos.
5. **Other listings** (Yelp, ClassPass, Booksy/Fresha marketplace pages). Use these only to confirm an address or rating, or as a last resort for prices. If you use one for prices, say so in `Price source`.

### Instagram checklist

Only do this while logged in normally as Yasmeen's own account (Muse), or from the public logged-out view. Never scrape.

1. **Bio:** the handle, studio or salon name, neighborhood, "DM to book", and the link in bio.
2. **Link in bio:** open it. Linktree, Beacons and similar pages often link to the booking page, a price PDF or the website.
3. **Story highlights:** open any titled Prices, Price list, Menu, Services, Info, FAQ, Book, Booking, Policies, Location, Address, Studio, Hours or Reviews. Price lists and the exact address are usually here. Note the highlight name in your source (e.g. `Instagram highlight "Prices" (@handle)`).
4. **Pinned posts** (the first 1–3 on the grid): often a price list, booking policy or "how to book".
5. **Recent captions:** search the last few months for "$", "price", "starting at", "add-on", "art", "French", "structured", "hard gel", "BIAB", "located", "studio", "suite".
6. **Reels and guides tabs:** some artists post their menu as a reel or guide.
7. **Tagged location** on posts: the location pin often gives the studio address.
8. If the account is private, has no posts, or says to DM: stop. Don't DM the business.

## Step 3: what each column needs

| Column | Where to look | How to write it |
|---|---|---|
| `Name` | Website or Instagram name | The business's own name. Never rename an existing row, because other files are keyed by it. |
| `Instagram` / `Instagram URL` | Website footer or contact page, booking page, Google profile, then an Instagram search. | `@handle` and `https://www.instagram.com/handle/`. Confirm with Step 1 (bio address or link back to the website). If Instagram's embed says the profile "may be broken" but the profile is live, the handle goes in `photos/embed-blocked.json`, not the sheet. |
| `Type (solo/studio/salon)` | Website About page, Instagram bio, Google photos | `solo` = one artist; `studio` = a few artists, usually by appointment; `salon` = walk-in style shop with many techs. |
| `Neighborhood` | Address on Google Maps | Common names such as `Flatiron`, `NoMad`, `Koreatown`, `SoHo`. Separate several with ` / `. Used for filters and approximate map pins. |
| `Address` | Website contact page, booking page, Google profile, Instagram location tag or "Location" highlight | Street address plus suite, e.g. `38 W 32nd St, Suite 1601`. If it's given only by DM, leave it blank and note that. After adding addresses, rebuild `geo.json` with `tools/geocode.py`. |
| `Phone` | Google profile, website footer | As listed, e.g. `646-221-2010`. |
| `Booking URL` | Website "Book" button, link in bio | The direct public booking page, not a Linktree or the homepage. |
| `Booking platform` | The booking URL's domain | One of: `Square`, `GlossGenius`, `Acuity`, `Fresha`, `Booksy`, `Setmore`, `Chronos`, `Vagaro`, `Instagram DM`, `Phone`, `Walk-in`. |
| `Services (hard gel/Japanese/Russian etc)` | Booking menu, website services page, Instagram price highlight | Comma-separated techniques in their words: e.g. `Russian, hard gel, BIAB, Gel-X, nail art`. Filters look for: russian, hard gel, builder, biab, structured, japanese, overlay, gel-x, acrylic, nail art, design, hand-paint. |
| `Base gel price` | Same as Services | The regular gel manicure on natural nails. **Put the starting price first**, e.g. `$50+ gel manicure (45 min)`. The site reads the first number in the cell, so don't lead with a refill, removal or promo price. |
| `Hard gel price` | Same | The structured / hard / Japanese / builder / BIAB / Russian hard gel manicure on natural nails (not extensions), starting price first: `$95 one color; $116 with tips`. |
| `Art price` | Booking menu art services, price highlight | Tiers as written, e.g. `simple $15+, French $45, complex $60+`. Write "included" only if art really is included in the manicure price; that word marks the place as art-included in Best value. Use `not incl` to say it isn't. |
| `Art add-on $` | Same as Art price | **A number only.** It's the cheapest price for simple art on a full set (all 10 nails), added on top of the manicure. `0` means art is included. A per-nail price (`$5/nail`) or a range doesn't go here; leave the cell blank and put that in `Art price`. If the menu lists a combined "manicure + art set" price, enter that price minus the manicure price. Best value ranks only places with this number, so only fill it when the source states it. |
| `Other prices` | Booking menu | Removal, extensions, French, chrome, cat eye, pedicure, repairs: `gel removal $15; Gel-X $85+; repair $7/nail`. |
| `Prices updated` | — | The date you saw the prices, `YYYY-MM-DD`. Required whenever you write any price cell. After 180 days the site flags the prices as "may be outdated". |
| `Price source` | — | The URL(s) where you saw the prices, separated by `; `. For Instagram, use the post URL, or describe it: `Instagram highlight "Prices" (@handle)`. |
| `Styles/art notes` | The grid of recent posts | What their work looks like, using these words where they fit: tortoiseshell, French, hand-painted, minimal, chrome, cat eye, gems, ombré. These power the "Known for" chips. |
| `Rating` | Google Maps profile | Google first: `Google 4.8 (98), Yelp 3.9`. The site reads the first number. |
| `Last checked` | — | The date you last verified the row, `YYYY-MM-DD`. |
| `Notes` | — | Short, visitor-facing facts: `walk-ins`, `deposit $30`, `cash only`, `address by DM`. Cards display this text, so no research logs or "per user" notes. A note containing "walk-in" shows as "Walk-ins" on the card. |
| `Status` / `Ruled-out reason` | — | Leave these alone. The site doesn't use them to hide or label places. |

### Photos

Saved photos go in `photos/manifest.json` (keyed by exact `Name`, up to 4 square 600×600 JPEGs under `photos/<handle>/`, each linking to its Instagram post). Pick posts that clearly show finished nails, with the hands filling most of the frame. Skip lashes, brows, flyers, price lists, "Book now" graphics, moodboard collages, and selfies where the nails are small.

## Step 4: when you can't find it

Search the full Step 2 list, including every Instagram checklist item, before giving up. Then:

- Leave the cell blank. Don't write "N/A", "unknown" or a guess.
- If the reason helps the next agent, add a short visitor-facing note, e.g. `prices by DM` or `address by DM`.
- List the miss in your report with what you checked, e.g. "Square page shows services without prices; Instagram has no price highlight; website says 'contact us for pricing'."

## Step 5: report back

Before writing, or instead of writing when unsure, report in this shape so a person can check it quickly:

| Name | matched (yes / unsure / no) | column | value | source URL | evidence (short quote) |
|---|---|---|---|---|---|

Include every overwrite conflict (existing value vs. found value) and every Step 1 mismatch.
