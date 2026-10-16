import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/availability.js';

const url = 'https://directory.example/api/availability';
const invoke = (method, options = {}) => onRequest({
  request: new Request(url, { method, ...options }),
  env: options.env || {}
});

test('Cloudflare OPTIONS allows localhost with CORS headers', async () => {
  const response = await invoke('OPTIONS', { headers: { origin: 'http://localhost:3000' } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-max-age'), '86400');
});

test('Cloudflare omits CORS headers for disallowed origins', async () => {
  const response = await invoke('OPTIONS', { headers: { origin: 'https://evil.example' } });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('Cloudflare rejects GET and wrong content types', async () => {
  assert.equal((await invoke('GET')).status, 405);
  const response = await invoke('POST', { headers: { 'content-type': 'text/plain' }, body: '{}' });
  assert.equal(response.status, 415);
});

test('Cloudflare rejects malformed JSON', async () => {
  const response = await invoke('POST', { headers: { 'content-type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
});

test('Cloudflare accepts valid JSON and returns availability', async () => {
  let received;
  const response = await invoke('POST', {
    headers: { 'content-type': 'application/json', origin: 'https://allowed.example' },
    body: JSON.stringify({ platform: 'acuity', ids: '{"subdomain":"studio"}', date: '2026-10-17' }),
    env: { ALLOWED_ORIGINS: 'https://allowed.example', getAvailability: async input => {
      received = input;
      return { slots: [{ start: '2026-10-17T10:00:00-04:00' }] };
    } }
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://allowed.example');
  assert.deepEqual(received.ids, { subdomain: 'studio' });
  assert.equal((await response.json()).slots.length, 1);
});
