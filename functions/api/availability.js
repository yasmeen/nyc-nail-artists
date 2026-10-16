import { getAvailability } from '../../lib/availability.js';

function allowedOrigin(origin, allowList) {
  if (!origin) return false;
  if (/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)) return true;
  return allowList.split(',').map(value => value.trim()).filter(Boolean).includes(origin);
}

function response(status, body, headers) {
  if (body == null) return new Response(null, { status, headers });
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

export async function onRequest({ request, env = {} }) {
  const origin = request.headers.get('origin');
  const headers = new Headers();
  if (allowedOrigin(origin, env.ALLOWED_ORIGINS || '')) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
    headers.set('access-control-allow-methods', 'POST, OPTIONS');
    headers.set('access-control-allow-headers', 'Content-Type');
  }
  if (request.method === 'OPTIONS') {
    headers.set('access-control-max-age', '86400');
    return response(204, null, headers);
  }
  if (request.method !== 'POST') return response(405, { error: 'method_not_allowed' }, headers);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
    return response(415, { error: 'bad_request', detail: 'Content-Type must be application/json' }, headers);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return response(400, { error: 'bad_request', detail: 'Invalid JSON body' }, headers);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response(400, { error: 'bad_request', detail: 'Body must be a JSON object' }, headers);
  }
  let ids = body.ids;
  if (typeof ids === 'string') {
    try {
      ids = JSON.parse(ids);
    } catch {
      return response(400, { error: 'bad_request', detail: 'ids must be valid JSON' }, headers);
    }
  }
  try {
    const result = await (env.getAvailability || getAvailability)({
      platform: body.platform, ids, date: body.date, from: body.from, to: body.to
    });
    return response(200, result, headers);
  } catch (error) {
    return response(400, { error: 'bad_request', detail: error?.message || 'Invalid request' }, headers);
  }
}
