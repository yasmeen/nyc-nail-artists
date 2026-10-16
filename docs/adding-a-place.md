# Adding a place with live availability

The spreadsheet is the only place to store booking-platform IDs. Do not add a place's IDs or service to application code. Enable a row only after confirming the exact service and IDs on its public booking page.

## Spreadsheet fields

Fill these four columns:

- `Platform IDs (JSON)`: valid JSON object with the shape below.
- `Availability service`: readable service name shown in the results list.
- `Availability enabled`: `Y` to query on demand, or `N` to leave manual.
- `IDs last verified`: `YYYY-MM-DD`. The UI warns when an enabled row is missing this date or it is over 30 days old.

The service choice sent upstream is the service encoded in the IDs. The UI service selector filters the places being checked; it does not change a platform service ID.

## Finding IDs and required JSON

Use the provider's public booking page and inspect its page data or read-only public requests. Never submit a booking, evade a captcha, or use private account credentials. If the public flow is blocked or does not expose stable identifiers, leave availability disabled and use the place's booking link or Instagram.

### Acuity

On the public Acuity scheduling page, inspect embedded page JSON for the appointment type (`"id":...,"name":...`) and available calendars. The subdomain is the booking page's `{subdomain}.as.me`; `owner` is in its public availability request. `calendarId` is optional when the service should include all calendars.

```json
{
  "subdomain": "thepaintnail",
  "owner": "3f79c9d6",
  "appointmentTypeId": 95751701,
  "calendarId": 14321815
}
```

### Square Appointments

Inspect the public booking page HTML, where some JSON is HTML-entity escaped. Match the service's variation ID (usually starts `V`) and location ID. Team-member IDs (usually start `TM`) are used in the `staff` array; map any names you want displayed in `staffNames`.

```json
{
  "merchant": "k3xmtlodrgg9r6",
  "location": "L7CRSCP1JYJ8V",
  "variation": "VPG4DPKMKJSRCYX5U7EBLLOK",
  "staff": ["TM4WrIt7Zp5qIcRp", "TMfFBOu7fGhmT0PC"],
  "staffNames": {
    "TM4WrIt7Zp5qIcRp": "Lydiah",
    "TMfFBOu7fGhmT0PC": "Yazmin"
  }
}
```

The adapter supplies the required public page `Origin` and `Referer` headers itself. Do not substitute guessed staff IDs; invalid IDs can cause the provider to reject the request.

### GlossGenius

Open the business's public services page and inspect `__NEXT_DATA__`, under `props.serverContext.publicUser`. Extract the business, service, location, space, and public slug tokens. `staffNames` is optional and maps public staff tokens to display names.

```json
{
  "slug": "kayleighnailstudio",
  "business": "10016-8e848959-1f63-4fb5-a5f7-ba0f951884a2",
  "service": "1000f-ebabd095-d1e2-4efb-b6c7-11333462ca95",
  "location": "1003d-b2f4bfc2-1da5-40c4-9eea-9773f97165b6",
  "space": "1001a-89fbf4b7-c3f6-4d0b-aeba-b3f412c6f4e5",
  "staffNames": {
    "1001b-2d8bb9ba-3712-4b20-8dc5-4a42b04bd406": "Kayleigh"
  }
}
```

GlossGenius may return times outside the requested local day; the adapter filters them to the selected New York date.

### Chronos

The public location page identifies the location slug. Read its public `/api/services?source=appointment` data to find the service ID, optional option ID, and duration in minutes. Do not treat an inaccessible endpoint as permission to bypass access controls.

```json
{
  "location": "new-york-10011-panda-nail-salon-804376",
  "service_id": 45556,
  "option_id": 10057,
  "duration": 60
}
```

The adapter obtains the public session/XSRF cookies from the location's services page and uses them only for its read-only availability request. Cookies and XSRF values must never be placed in the sheet.

## Verification before enabling

1. Confirm the platform, service label, location, and staff scope on the public booking page.
2. Paste valid JSON in `Platform IDs (JSON)` and set `Availability enabled` to `N` while reviewing it.
3. Set `IDs last verified` to today's date after confirming the IDs.
4. Run `npm run smoke -- --csv test.csv` or check locally with the dev mock before setting `Y`.
5. If a provider returns a captcha, denial, or unstable IDs, keep the row manual. Do not retry repeatedly.

## Photos

Each card shows the Instagram profile's six most recent posts via Instagram's public profile embed, using the `Instagram` handle (or `Instagram URL`). To show specific nail-work posts instead, add a `Photo posts` column and paste one or more Instagram post/reel URLs (space- or comma-separated); those render as a swipeable strip of post embeds.
