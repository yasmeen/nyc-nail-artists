import { readFile } from 'node:fs/promises';
import { addDays, nyDate } from '../lib/tz.js';
import { getAvailability } from '../lib/availability.js';

const csvArg = process.argv.indexOf('--csv');
let source;
if (csvArg >= 0 && process.argv[csvArg + 1]) {
  source = await readFile(process.argv[csvArg + 1], 'utf8');
} else {
  const response = await fetch('https://docs.google.com/spreadsheets/d/1yorNY5SrbFzbGx295afxff2bSLH23DHwdH58eMOI1vw/gviz/tq?tqx=out:csv');
  if (!response.ok) throw new Error(`Sheet request failed: HTTP ${response.status}`);
  source = await response.text();
  if (/^\s*</.test(source)) throw new Error('Sheet response is not CSV');
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(item => item.some(value => value.trim()));
}

const rows = parseCSV(source);
const headers = rows[0].map(value => value.trim().toLowerCase());
function column(prefix) {
  let index = headers.findIndex(value => value === prefix.toLowerCase());
  if (index < 0) index = headers.findIndex(value => value.startsWith(prefix.toLowerCase()));
  return index;
}
const col = {
  name: column('name'),
  platform: column('booking platform'),
  ids: column('platform ids (json)'),
  enabled: column('availability enabled')
};
if (Object.values(col).some(index => index < 0)) throw new Error('CSV is missing one or more required headers');
const tomorrow = addDays(nyDate(Date.now()), 1);
let failed = false;
for (const row of rows.slice(1)) {
  if (String(row[col.enabled] || '').trim().toUpperCase() !== 'Y') continue;
  const name = row[col.name] || '(unnamed)';
  let ids;
  try {
    ids = JSON.parse(row[col.ids] || '');
  } catch {
    console.log(`${name} | ${row[col.platform] || ''} | 0 slots | upstream`);
    failed = true;
    continue;
  }
  const result = await getAvailability({ platform: row[col.platform], ids, date: tomorrow });
  console.log(`${name} | ${row[col.platform] || ''} | ${result.slots.length} slots | ${result.error || ''}`);
  if (result.error && result.error !== 'manual') failed = true;
}
if (failed) process.exitCode = 1;
