import { readFile } from 'node:fs/promises';
import { addDays, nyDate } from '../lib/tz.js';
import { getAvailability } from '../lib/availability.js';

const booking = JSON.parse(await readFile(new URL('../booking.json', import.meta.url), 'utf8'));
const tomorrow = addDays(nyDate(Date.now()), 1);
let failed = false;
for (const [name, entry] of Object.entries(booking)) {
  const result = await getAvailability({ platform: entry.platform, ids: entry.ids, date: tomorrow });
  console.log(`${name} | ${entry.platform} | ${result.slots.length} slots | ${result.error || ''}`);
  if (result.error && result.error !== 'manual') failed = true;
}
if (failed) process.exitCode = 1;
