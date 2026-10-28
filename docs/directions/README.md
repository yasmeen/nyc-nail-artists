# Design directions

Three mockups of the main search screen, made to pick a direction before redesigning `index.html`. Each is a static page built from `test.csv` data for the search "no art, under $100, tomorrow, within a 15 min walk of Union Sq" (the app returns nine places; the first six are shown).

| Direction | Idea | Mockup |
| --- | --- | --- |
| Hedgerow, in plum | The search sentence set as the headline, over a dark photo feed | [hedgerow/index.html](hedgerow/index.html) |
| Halftone | A loud cream and vermilion price board, the total big at the end of each row | [halftone/index.html](halftone/index.html) |
| Loom | A quiet ecru catalogue: filters as ruled rows in a rail, a price sheet per artist | [loom/index.html](loom/index.html) |

Screenshots of each at 1440px and 390px, light and dark, plus the current app: [`docs/screenshots/directions/`](../screenshots/directions/).

- View them with the dev server: `npm run dev`, then open `http://localhost:3000/docs/directions/hedgerow/index.html`.
- Rebuild the HTML after editing the data or markup: `node docs/directions/build.mjs`. Each direction's styles are in its own `page.css` and `tokens.css`.
- Placeholders: only Kayleigh Nail Studio and Gold Room Nails have saved photos (copied into `photos/` here). The other cards show where the live Instagram grid loads. Saved, Map and opening results are not mocked.
