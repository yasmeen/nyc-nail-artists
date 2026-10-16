import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/availability.js';

async function request({ method = 'POST', origin, body = { platform: 'acuity', ids: {}, date: 'not-a-date' } } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (origin) headers.origin = origin;
  const result = { headersOut: {}, status: null, body: '' };
  const res = {
    setHeader(name, value) { result.headersOut[name.toLowerCase()] = value; },
    end(value = '') { result.body = value; }
  };
  await handler({ method, headers, body }, res);
  result.status = res.statusCode;
  return result;
}

test('GET is rejected with 405', async () => {
  const result = await request({ method: 'GET' });
  assert.equal(result.status, 405);
});

test('bad dates return 400', async () => {
  const result = await request();
  assert.equal(result.status, 400);
  assert.equal(JSON.parse(result.body).error, 'bad_request');
});

test('CORS reflects localhost but not an untrusted origin', async () => {
  const local = await request({ origin: 'http://localhost:3000' });
  assert.equal(local.headersOut['access-control-allow-origin'], 'http://localhost:3000');
  const evil = await request({ origin: 'https://evil.com' });
  assert.equal(evil.headersOut['access-control-allow-origin'], undefined);
});
