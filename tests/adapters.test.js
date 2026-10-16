import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as acuity from '../lib/adapters/acuity.js';
import * as square from '../lib/adapters/square.js';
import * as glossgenius from '../lib/adapters/glossgenius.js';
import * as chronos from '../lib/adapters/chronos.js';
import { nyDate } from '../lib/tz.js';

const fixture = async name => JSON.parse(await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

test('Acuity normalizes saved response times and offsets', async () => {
  const raw = await fixture('acuity');
  const slots = acuity.normalize(raw, { ids: {}, date: '2026-10-17' });
  assert.ok(slots.length > 0);
  assert.ok(slots.every(slot => slot.start.startsWith('2026-10-17T') && /-04:00$/.test(slot.start)));
  assert.deepEqual(slots, [...slots].sort((a, b) => Date.parse(a.start) - Date.parse(b.start)));
});

test('Square normalizes the Nov 1 epoch using the post-DST offset', async () => {
  const raw = await fixture('square-dst');
  const slots = square.normalize(raw, {
    ids: { staffNames: { fixture_staff: 'Staff A' } },
    date: '2026-11-01'
  });
  assert.equal(slots.length, 1);
  assert.equal(slots[0].start, '2026-11-01T10:00:00-05:00');
  assert.equal(slots[0].end, '2026-11-01T11:00:00-05:00');
  assert.equal(slots[0].staff, 'Staff A');
});

test('Square normalizes the saved live response', async () => {
  const raw = await fixture('square');
  const slots = square.normalize(raw, { ids: { staffNames: {} }, date: '2026-10-17' });
  assert.ok(Array.isArray(slots));
  assert.ok(slots.every(slot => slot.start.startsWith('2026-10-17T')));
});

test('GlossGenius filters slots by New York day, not the upstream UTC date', async () => {
  const raw = await fixture('glossgenius-from-sample');
  const slots = glossgenius.normalize(raw, {
    ids: { staffNames: { fixture_staff: 'Fixture Staff' } },
    date: '2026-10-17'
  });
  assert.ok(slots.length > 0);
  assert.ok(slots.every(slot => slot.start.startsWith('2026-10-17T')));
  assert.ok(slots.some(slot => slot.staff === 'Fixture Staff'));
  assert.ok(raw.data.some(slot => slot.starts_at.slice(0, 10) !== '2026-10-17'));
});

test('GlossGenius normalizes the saved live response', async () => {
  const raw = await fixture('glossgenius');
  const slots = glossgenius.normalize(raw, { ids: { staffNames: {} }, date: '2026-10-17' });
  const dates = [...new Set(raw.data.map(item => nyDate(Date.parse(item.starts_at))))].sort();
  assert.deepEqual(dates, ['2026-10-16', '2026-10-17']);
  assert.ok(slots.length > 0);
  assert.ok(slots.every(slot => slot.start.startsWith('2026-10-17T')));
  assert.equal(slots.length, raw.data.filter(item => nyDate(Date.parse(item.starts_at)) === '2026-10-17').length);
});

test('Chronos seconds after NY midnight normalize across the DST boundary', async () => {
  const raw = await fixture('chronos-dst');
  const slots = chronos.normalize(raw, {
    ids: { duration: 60 },
    date: '2026-11-01'
  });
  assert.deepEqual(slots, [{
    start: '2026-11-01T10:00:00-05:00',
    end: '2026-11-01T11:00:00-05:00'
  }]);
});

test('Chronos normalizes the saved live response', async () => {
  const raw = await fixture('chronos');
  const slots = chronos.normalize(raw, { ids: { duration: 60 }, date: '2026-10-17' });
  assert.ok(Array.isArray(slots));
  assert.ok(slots.every(slot => slot.start.startsWith('2026-10-17T')));
});

test('platform validation rejects URL injection and non-integer IDs', () => {
  assert.throws(() => acuity.validate({
    subdomain: 'evil.com/x',
    owner: 'owner',
    appointmentTypeId: 123
  }), /subdomain/);
  assert.throws(() => acuity.validate({
    subdomain: 'studio',
    owner: 'owner',
    appointmentTypeId: '95751701'
  }), /appointmentTypeId/);
  assert.throws(() => square.validate({
    merchant: 'merchant',
    location: 'location',
    variation: 'variation',
    staff: ['evil/id']
  }), /staff/);
  assert.throws(() => chronos.validate({ location: 'ok', service_id: 2.5 }), /service_id/);
});
