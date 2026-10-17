import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/photos/manifest.json.js';

test('missing photo manifest returns 404 instead of the Pages SPA fallback', async () => {
  const response = await onRequest({
    next: async () => new Response('<!doctype html>', {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    })
  });
  assert.equal(response.status, 404);
});

test('photo manifest route passes through a static JSON asset', async () => {
  const response = await onRequest({
    next: async () => new Response('{"places":{}}', {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { places: {} });
});

test('photo manifest route preserves an asset server 404', async () => {
  const response = await onRequest({
    next: async () => new Response(null, { status: 404 })
  });
  assert.equal(response.status, 404);
});
