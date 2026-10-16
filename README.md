# NYC Nail Artists

Searchable, filterable directory of NYC nail artists, read live from a Google Sheet (no build step). Single `index.html`, vanilla JS.

- Data: Google Sheet `1yorNY5SrbFzbGx295afxff2bSLH23DHwdH58eMOI1vw`, fetched via `gviz/tq?tqx=out:csv`. The sheet must be shared "Anyone with the link can view".
- Edit the sheet and refresh the page to see changes.
- Filters: text search, neighborhood, type, status, max price (lowest of base/hard gel price). Sort by price or name.
- Test with a local CSV: `index.html?csv=test.csv`.
