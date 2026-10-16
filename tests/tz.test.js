import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, nyDate, nyHHMM, nyMidnightUTC, toNyISO } from '../lib/tz.js';

test('New York offsets cover the 2026 daylight-saving transition', () => {
  assert.equal(toNyISO(Date.parse('2026-10-31T16:00:00Z')), '2026-10-31T12:00:00-04:00');
  assert.equal(toNyISO(Date.parse('2026-11-01T05:00:00Z')), '2026-11-01T01:00:00-04:00');
  assert.equal(toNyISO(Date.parse('2026-11-01T06:00:00Z')), '2026-11-01T01:00:00-05:00');
  assert.equal(toNyISO(Date.parse('2026-11-02T12:00:00Z')), '2026-11-02T07:00:00-05:00');
});

test('New York local midnights account for DST ending', () => {
  assert.equal(nyMidnightUTC('2026-11-01').toISOString(), '2026-11-01T04:00:00.000Z');
  assert.equal(nyMidnightUTC('2026-11-02').toISOString(), '2026-11-02T05:00:00.000Z');
});

test('NY ISO values round-trip through date/time helpers', () => {
  const value = Date.parse('2026-11-01T10:00:00-05:00');
  assert.equal(toNyISO(value), '2026-11-01T10:00:00-05:00');
  assert.equal(nyDate(value), '2026-11-01');
  assert.equal(nyHHMM(value), '10:00');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
});
