import { getAvailability } from '../lib/availability.js';

function allowedOrigin(origin) {
  if (!origin) return false;
  if (/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)) return true;
  return (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean).includes(origin);
}

function send(res, status, body) {
  if (body == null && typeof res.status === 'function') return res.status(status).end();
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(body);
  }
  res.statusCode = status;
  if (body == null) return res.end();
  res.setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const origin = req.headers?.origin;
  if (allowedOrigin(origin)) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'Origin');
    res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
    res.setHeader('access-control-allow-headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('access-control-max-age', '86400');
    return send(res, 204, null);
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] || '')) {
    return send(res, 415, { error: 'bad_request', detail: 'Content-Type must be application/json' });
  }
  if (req.jsonError) return send(res, 400, { error: 'bad_request', detail: 'Invalid JSON body' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return send(res, 400, { error: 'bad_request', detail: 'Body must be a JSON object' });
  }
  let ids = body.ids;
  if (typeof ids === 'string') {
    try {
      ids = JSON.parse(ids);
    } catch {
      return send(res, 400, { error: 'bad_request', detail: 'ids must be valid JSON' });
    }
  }
  try {
    const result = await (req.getAvailability || getAvailability)({
      platform: body.platform,
      ids,
      date: body.date,
      from: body.from,
      to: body.to
    });
    return send(res, 200, result);
  } catch (error) {
    return send(res, 400, { error: 'bad_request', detail: error?.message || 'Invalid request' });
  }
}
