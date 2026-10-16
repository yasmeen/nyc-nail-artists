import test from 'node:test';
import assert from 'node:assert/strict';
import { clearAvailabilityCache, getAvailability } from '../lib/availability.js';

const acuityIds = { subdomain: 'studio', owner: 'owner', appointmentTypeId: 123 };
const acuityRaw = {
  '2026-10-17': [
    { time: '2026-10-17T09:00:00-0400' },
    { time: '2026-10-17T10:00:00-0400' },
    { time: '2026-10-17T11:00:00-0400' }
  ]
};

test('availability filters by NY local start time and caches before filtering', async () => {
  clearAvailabilityCache();
  let calls = 0;
  const fetch = async () => { calls++; return new Response(JSON.stringify(acuityRaw)); };
  const input = { platform: 'Acuity', ids: acuityIds, date: '2026-10-17' };
  const first = await getAvailability({ ...input, from: '09:30', to: '11:00' }, { fetch });
  assert.deepEqual(first.slots.map(slot => slot.start), ['2026-10-17T10:00:00-04:00']);
  const second = await getAvailability({ ...input, from: '09:00', to: '10:00' }, { fetch });
  assert.deepEqual(second.slots.map(slot => slot.start), ['2026-10-17T09:00:00-04:00']);
  assert.equal(second.cached, true);
  assert.equal(calls, 1);
});

test('availability timeout returns timeout', async () => {
  clearAvailabilityCache();
  const fetch = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  });
  const result = await getAvailability(
    { platform: 'acuity', ids: { ...acuityIds, owner: 'timeout-case' }, date: '2026-10-17' },
    { fetch, timeoutMs: 5 }
  );
  assert.deepEqual(result, { slots: [], error: 'timeout' });
});

test('availability maps upstream 403 to blocked', async () => {
  clearAvailabilityCache();
  const result = await getAvailability(
    { platform: 'acuity', ids: { ...acuityIds, owner: 'blocked-case' }, date: '2026-10-17' },
    { fetch: async () => new Response('blocked', { status: 403 }) }
  );
  assert.deepEqual(result, { slots: [], error: 'blocked' });
});

test('unknown platform returns manual without a network call', async () => {
  let calls = 0;
  const result = await getAvailability(
    { platform: 'Vagaro', ids: {}, date: '2026-10-17' },
    { fetch: async () => { calls++; throw new Error('must not call'); } }
  );
  assert.deepEqual(result, { slots: [], error: 'manual' });
  assert.equal(calls, 0);
});
