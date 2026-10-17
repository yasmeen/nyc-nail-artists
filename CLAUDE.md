# Working on this repo

## Pull requests

- Any pull request that changes the UI must include screenshots of the change in the PR description. Show before and after, at phone width (390px) and desktop width, in light and dark mode when the change affects both.
- Commit the screenshots under `docs/screenshots/<topic>/` on the PR branch and embed them in the description with `https://github.com/yasmeen/nyc-nail-artists/raw/<commit-sha>/docs/screenshots/<topic>/<file>.png`.
- Take them from the local dev server with sample data (`MOCK=1 npm run dev`, then `?csv=test.csv`), and say in the PR which parts were placeholders or mocked (Instagram embeds, map tiles or availability responses that couldn't load).
