// Builds the three design-direction mockups from one sample search.
// Every value below is copied from the live app run on test.csv with
// ?from=usq&max=100&walk=15 (9 of 18 places; the first six are shown).
// Run: node docs/directions/build.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const GLOSS = {
  'Russian': 'a dry e-file clean very close to the cuticle',
  'Structured / hard gel': 'a strong, shaped gel layer over your own nail',
};

const places = [
  { name: 'Kayleigh Nail Studio', handle: 'kayleigh_nailstudio', total: 50, walk: 7, area: 'Flatiron', status: 'Openings can be checked live',
    tech: ['Russian', 'Structured / hard gel'], known: ['tortoiseshell'],
    photos: [['kayleigh_nailstudio/2.jpg', 'Glossy tortoiseshell almond nails'], ['kayleigh_nailstudio/1.jpg', 'Fall retro swirl French tips'], ['kayleigh_nailstudio/4.jpg', 'Milky white hard gel overlay']],
    prices: [['Base gel', 'Gel $50 (45min)'], ['Hard gel', 'Japanese $70+, Russian $85+'], ['Art', 'Design $5+/finger']],
    about: ['Solo, Flatiron', 'No rating yet'], book: ['Book on GlossGenius', 'https://kayleighnailstudio.glossgenius.com/services'] },
  { name: 'Mani Muse', handle: 'manimusenyc', total: 75, walk: 10, area: 'Flatiron', status: 'Book on Square',
    tech: ['Russian', 'Structured / hard gel'], known: ['minimal'], slot: 'embed',
    prices: [['Hard gel', '$75 jr/$90 sr/$110/$150'], ['Art', 'not listed']],
    about: ['Studio, 37 W 20th St', 'Removal +$20'], book: ['Book on Square', 'https://www.manimusenyc.com'] },
  { name: 'Gold Room Nails', handle: 'goldroomnails', total: 95, walk: 13, area: 'Chelsea', status: 'Openings can be checked live',
    tech: ['Structured / hard gel'], known: [],
    photos: [['goldroomnails/3.jpg', 'Pink cat eye shimmer nails'], ['goldroomnails/1.jpg', 'Tropical multicolour stiletto art'], ['goldroomnails/4.jpg', 'Hot pink drip French tips'], ['goldroomnails/2.jpg', 'Knicks basketball nail art']],
    prices: [['Hard gel', '$95 one color'], ['Art', 'simple $15+, French $45, complex $60+']],
    about: ['Studio, 130 7th Ave', 'Google 4.8 (98), Yelp 3.9', 'Walk-ins; removal $15/$25'], book: ['Book on Square', 'https://app.squareup.com/appointments/book/k3xmtlodrgg9r6/L7CRSCP1JYJ8V/start'] },
  { name: 'Nailfairy NYC', handle: 'nailfairy_nyc', total: null, walk: 13, area: 'Flatiron', status: 'Ask by Instagram DM',
    tech: [], known: [], slot: 'embed', prices: [], about: ['School and studio, 17 W 24th St'] },
  { name: 'Peach Bling', handle: 'peach.bling.nyc', total: null, walk: 7, approx: true, area: 'Flatiron/Tribeca/LIC', status: 'Book on Square',
    tech: ['Structured / hard gel'], known: [], slot: 'blocked', prices: [['Art', 'art sets $168-198 (LIC)']],
    about: ['Chain'], book: ['Book on Square', 'https://www.peachbling.com/discover-flatiron'] },
  { name: 'Aya Nail Studio', handle: 'aya_nailstudio_nyc', total: null, walk: 11, approx: true, area: 'Flatiron', status: 'Ask by Instagram DM',
    tech: ['Russian'], known: [], slot: 'embed', prices: [], about: ['Studio, phone only'] },
];

const known = [['Tortoiseshell', 3], ['French', 1], ['Hand-painted art', 2], ['Minimal', 2], ['Gems', 1]];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ig = (p) => `https://www.instagram.com/${p.handle}/`;
const heart = (p) => `<button type="button" class="heart" aria-pressed="false" aria-label="Save ${esc(p.name)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg></button>`;
const walkLabel = (p) => `~${p.walk} min${p.approx ? ', approx.' : ''}`;

function media(p, cls = 'media') {
  let inner;
  if (p.photos) {
    inner = `<div class="photos" data-count="${p.photos.length}">${p.photos.map(([f, alt], i) => `<a href="${ig(p)}"><img src="../photos/${f}" alt="${esc(alt)}" width="600" height="600" ${p === places[0] && i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}></a>`).join('')}</div>`;
  } else if (p.slot === 'blocked') {
    inner = `<div class="blocked"><p>Instagram doesn’t allow a preview of this account</p><a class="blocked__link" href="${ig(p)}">See @${esc(p.handle)}’s nail photos on Instagram</a></div>`;
  } else {
    inner = `<div class="slot" data-slot="instagram"><p>@${esc(p.handle)}’s Instagram grid loads here</p></div>`;
  }
  return `<div class="${cls}">${inner}${heart(p)}</div>`;
}

function details(p) {
  const rows = p.prices.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  const links = [p.book && `<a href="${p.book[1]}">${esc(p.book[0])}</a>`, `<a href="${ig(p)}">Instagram</a>`].filter(Boolean).join('');
  return `<details class="info"><summary>Prices, address and booking</summary><div class="info__body">${rows ? `<dl class="prices">${rows}</dl>` : '<p>No prices in the sheet yet</p>'}${p.about.map((a) => `<p>${esc(a)}</p>`).join('')}<p class="links">${links}</p></div></details>`;
}

const techList = (p) => p.tech.length ? `<ul class="techs">${p.tech.map((t) => `<li><b>${esc(t)}:</b> ${GLOSS[t]}</li>`).join('')}</ul>` : '';
const tagList = (p) => p.known.length ? `<ul class="tags">${p.known.map((k) => `<li>Known for ${esc(k)}</li>`).join('')}</ul>` : '';

const opt = (v, label, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${label}</option>`;
const F = {
  tech: `<select id="tech" aria-label="Technique">${opt('', 'Any technique', true)}${opt('russian', 'Russian')}${opt('hard', 'Structured / hard gel')}${opt('gelx', 'Gel-X')}${opt('acrylic', 'Acrylic')}${opt('art', 'Nail art')}</select>`,
  art: `<select id="art" aria-label="Art">${opt('none', 'no art', true)}${opt('simple', 'simple art')}</select>`,
  max: `<input id="max" type="number" min="0" step="5" value="100" placeholder="any" aria-label="Total budget in dollars">`,
  day: `<select id="availabilityDate" aria-label="Day">${opt('today', 'today')}${opt('tomorrow', 'tomorrow', true)}</select>`,
  time: `<select id="availabilityFrom" aria-label="Earliest time">${opt('', 'at any time', true)}${opt('09:00', 'after 9 AM')}${opt('12:00', 'after noon')}${opt('15:00', 'after 3 PM')}${opt('17:00', 'after 5 PM')}${opt('19:00', 'after 7 PM')}</select>`,
  walk: `<select id="walk" aria-label="Walking time">${opt('', 'any distance')}${opt('10', 'a 10 min walk')}${opt('15', 'a 15 min walk', true)}${opt('20', 'a 20 min walk')}${opt('30', 'a 30 min walk')}</select>`,
  from: `<select id="from" aria-label="Starting point">${opt('', 'anywhere')}${opt('here', 'my location')}${opt('usq', 'Union Sq', true)}${opt('herald', 'Herald Sq')}${opt('gct', 'Grand Central')}</select>`,
};
const sentence = `${F.tech} with ${F.art}, under <span class="money">$${F.max}</span>, ${F.day} ${F.time}, within ${F.walk} <span class="money">of ${F.from}.</span>`;

const moreBody = `<div class="morebody">
   <select id="hood" aria-label="Neighborhood"><option value="">All neighborhoods</option><option>Chelsea</option><option>Flatiron</option></select>
   <select id="type" aria-label="Type"><option value="">All types</option><option>solo</option><option>studio</option></select>
   <select id="plat" aria-label="Booking platform"><option value="">Any booking platform</option><option>GlossGenius</option><option>Square</option></select>
   <label>Min rating <input id="minr" type="number" min="0" max="5" step="0.1" placeholder="any"></label>
   <select id="sort" aria-label="Sort"><option value="">Sort: closest first</option><option value="total">Total: low to high</option><option value="rate">Rating: high to low</option></select>
   <button id="reset" class="btn btn--quiet" type="button">Reset</button>
  </div>`;

const tabs = (cls = 'tabs') => `<nav class="${cls}" aria-label="Views">
  <button id="tabFeed" type="button" aria-pressed="true">Feed</button>
  <button id="tabSaved" type="button" aria-pressed="false">Saved <span class="badge" id="savedCount">0</span></button>
  <button id="tabMap" type="button" aria-pressed="false">Map</button>
 </nav>`;

const chips = known.map(([k, n]) => `<button type="button" class="kchip" data-known="${k.toLowerCase()}" aria-pressed="false">${k} <span>${n}</span></button>`).join('');

const footNote = 'Share a search: the sentence and filters sync to the URL. Walk times are estimates on the street grid at about 3 mph.';

// Cycles Auto, Light, Dark like the app's own button; the page reads fine without it.
const themeScript = `<script>
(() => { const b = document.getElementById('theme'), root = document.documentElement, order = ['auto', 'light', 'dark'], label = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  b.addEventListener('click', () => { const next = order[(order.indexOf(root.dataset.theme || 'auto') + 1) % 3]; if (next === 'auto') delete root.dataset.theme; else root.dataset.theme = next; b.textContent = label[next]; });
  document.querySelectorAll('.heart, .kchip').forEach((h) => h.addEventListener('click', () => h.setAttribute('aria-pressed', h.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')));
})();
</script>`;

function page({ slug, title, description, fonts, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<link rel="stylesheet" href="page.css">
</head>
<body class="d-${slug}">
${body}
${themeScript}
</body>
</html>
`;
}

// Hedgerow: the search sentence is the page's head; a dark photo feed below.
function hedgerow() {
  const card = (p) => `<article class="card">
  ${media(p)}
  <h2 class="card__name">${esc(p.name)}</h2>
  <dl class="figs">
   <div><dt>${p.total == null ? 'No manicure price in the sheet' : 'From, no art'}</dt><dd class="figure">${p.total == null ? 'Total unknown' : '$' + p.total}</dd></div>
   <div><dt>Walk from Union Sq</dt><dd class="figure">${walkLabel(p)}</dd></div>
  </dl>
  <p class="facts">${esc(p.area)}. ${esc(p.status)}.</p>
  ${techList(p)}${tagList(p)}
  ${details(p)}
 </article>`;
  return page({
    slug: 'hedgerow', title: 'NYC Nail Artists, Hedgerow direction',
    description: 'Design direction one for the NYC nail artist search: the search sentence set as the head of a dark plum page, over a photo feed.',
    fonts: 'https://fonts.googleapis.com/css2?family=Prata&family=Manrope:wght@400;500;700&display=swap',
    body: `<header class="top"><div class="container top__in">
 <h1 class="mark">NYC Nail Artists</h1>
 <input id="q" type="search" placeholder="Search names, notes, styles" aria-label="Search">
 ${tabs()}
 <button id="theme" class="btn btn--secondary" type="button" aria-label="Colour theme: follows your device">Auto</button>
</div></header>
<main class="container">
 <section class="ask" aria-label="What you're looking for">
  <p class="sentence">${sentence}</p>
  <div class="actions">
   <button id="checkAvailability" class="btn btn--primary" type="button">Check openings</button>
   <details class="more"><summary class="btn btn--secondary">More filters</summary>${moreBody}</details>
   <span id="count" aria-live="polite">9 of 18 places</span>
  </div>
 </section>
 <section class="known" aria-labelledby="knownHead">
  <h2 id="knownHead">Known for</h2>
  <p class="hint">From your style notes. Tap one to move those places to the top; nothing gets hidden.</p>
  <div class="chips">${chips}</div>
 </section>
 <section id="list" class="feed" aria-label="Places">
 ${places.map(card).join('\n ')}
 </section>
</main>
<footer class="container foot"><p>${footNote}</p></footer>`,
  });
}

// Halftone: a price board. The total is the loudest thing in each row.
function halftone() {
  const row = (p) => `<article class="row">
  ${media(p, 'strip')}
  <div class="row__main">
   <h2 class="row__name">${esc(p.name)}</h2>
   <p class="facts"><span>${walkLabel(p)} walk</span> <span>${esc(p.area)}</span> <span>${esc(p.status)}</span></p>
   ${techList(p)}${tagList(p)}
   ${details(p)}
  </div>
  <p class="row__total">${p.total == null ? '<span class="unknown">Total unknown</span>' : `<span class="figure">$${p.total}</span><span class="row__note">from, no art</span>`}</p>
 </article>`;
  return page({
    slug: 'halftone', title: 'NYC Nail Artists, Halftone direction',
    description: 'Design direction two for the NYC nail artist search: a loud cream and vermilion price board with the total set big in every row.',
    fonts: 'https://fonts.googleapis.com/css2?family=Ultra&family=Chivo:wght@400;500;700&display=swap',
    body: `<header class="top"><div class="container top__in">
 <h1 class="mark">NYC Nail Artists</h1>
 <input id="q" type="search" placeholder="Search names, notes, styles" aria-label="Search">
 <button id="theme" class="btn btn--line" type="button" aria-label="Colour theme: follows your device">Auto</button>
</div>
<div class="container">${tabs()}</div></header>
<main class="container">
 <section class="ask well" aria-label="What you're looking for">
  <p class="sentence">${sentence}</p>
  <div class="actions">
   <button id="checkAvailability" class="btn btn--primary" type="button">Check openings</button>
   <details class="more"><summary class="btn btn--line">More filters</summary>${moreBody}</details>
  </div>
 </section>
 <section class="known" aria-labelledby="knownHead">
  <h2 id="knownHead">Known for</h2>
  <div class="chips">${chips}</div>
 </section>
 <section id="list" class="board" aria-labelledby="boardHead">
  <div class="board__head"><h2 id="boardHead">Under $100, within 15 minutes</h2><span id="count" aria-live="polite">9 of 18 places</span></div>
 ${places.map(row).join('\n ')}
 </section>
</main>
<footer class="container foot"><p>${footNote}</p></footer>`,
  });
}

// Loom: a pattern book. Filters as ruled rows in a rail; each artist a spread with a price sheet.
function loom() {
  const spec = (k, v, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`;
  const spread = (p) => `<article class="spread">
  ${media(p)}
  <div class="spread__text">
   <h2>${esc(p.name)}</h2>
   <dl class="sheet">
    ${spec(p.total == null ? 'Manicure' : 'Manicure, no art', p.total == null ? 'Not in the sheet' : `<span class="price">$${p.total}</span>`, 'sheet__price')}
    ${spec('Walk from Union Sq', walkLabel(p))}
    ${spec('Neighborhood', esc(p.area))}
    ${spec('Booking', esc(p.status))}
    ${p.tech.length ? spec('Technique', p.tech.map(esc).join(', ')) : ''}
    ${p.known.length ? spec('Known for', p.known.map(esc).join(', ')) : ''}
   </dl>
   ${details(p)}
  </div>
 </article>`;
  const field = (label, ctl) => `<div><dt>${label}</dt><dd>${ctl}</dd></div>`;
  return page({
    slug: 'loom', title: 'NYC Nail Artists, Loom direction',
    description: 'Design direction three for the NYC nail artist search: a quiet ecru pattern book with ruled filters and a price sheet for every artist.',
    fonts: 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Hanken+Grotesk:wght@400;500&family=DM+Mono:wght@400&display=swap',
    body: `<header class="top"><div class="container top__in">
 <p class="mark">NYC Nail Artists</p>
 ${tabs()}
 <button id="theme" class="link" type="button" aria-label="Colour theme: follows your device">Auto</button>
</div></header>
<div class="container layout">
 <aside class="rail" aria-label="What you're looking for">
  <input id="q" type="search" placeholder="Search names, notes, styles" aria-label="Search">
  <dl class="ask">
   ${field('Technique', F.tech)}
   ${field('Art', F.art)}
   ${field('Budget', `<span class="money">$${F.max}</span>`)}
   ${field('Day', F.day)}
   ${field('Earliest', F.time)}
   ${field('Walk', F.walk)}
   ${field('From', F.from)}
  </dl>
  <div class="actions">
   <button id="checkAvailability" class="btn" type="button">Check openings</button>
   <details class="more"><summary class="link">More filters</summary>${moreBody}</details>
  </div>
  <section class="known" aria-labelledby="knownHead">
   <h2 id="knownHead" class="rail__head">Known for</h2>
   <div class="chips">${chips}</div>
  </section>
 </aside>
 <main id="list" class="spreads">
  <h1>Nine places within a 15 minute walk of Union Square</h1>
  <p class="lead" id="count" aria-live="polite">9 of 18 places, closest first. Places with no price stay listed and never rank as cheap.</p>
 ${places.map(spread).join('\n ')}
 </main>
</div>
<footer class="container foot"><p>${footNote}</p></footer>`,
  });
}

for (const [slug, fn] of [['hedgerow', hedgerow], ['halftone', halftone], ['loom', loom]]) {
  writeFileSync(join(here, slug, 'index.html'), fn());
}
console.log('wrote hedgerow, halftone and loom');
