import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as acuity from '../lib/adapters/acuity.js';
import * as square from '../lib/adapters/square.js';
import * as glossgenius from '../lib/adapters/glossgenius.js';
import * as chronos from '../lib/adapters/chronos.js';

test('booking.json entries validate against their platform adapters', async () => {
  const booking = JSON.parse(await readFile(new URL('../booking.json', import.meta.url), 'utf8'));
  const adapters = { acuity, square, glossgenius, chronos };
  assert.equal(Object.keys(booking).length, 4);
  for (const [name, entry] of Object.entries(booking)) {
    assert.ok(entry.service, `${name} service`);
    assert.match(entry.verified, /^\d{4}-\d{2}-\d{2}$/);
    assert.doesNotThrow(() => adapters[entry.platform].validate(entry.ids), name);
  }
});
