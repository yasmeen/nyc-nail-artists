import { addDays, nyDate, nyWallTimeUTC, toNyISO } from '../tz.js';
import { jsonResponse, requireId, requireInteger, requireObject, sortedSlots, USER_AGENT } from './shared.js';

export function validate(ids) {
  requireObject(ids);
  requireId(ids.location, 'location');
  requireInteger(ids.service_id, 'service_id');
  requireInteger(ids.option_id, 'option_id', true);
  requireInteger(ids.duration, 'duration', true);
}

function cookiePairs(headers) {
  const setCookies = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie') || ''];
  return setCookies.flatMap(value => {
    const pair = /^([^=;,\s]+)=([^;]*)/.exec(value);
    return pair ? [[pair[1], pair[2]]] : [];
  }).filter(([name]) => ['bychronos_session', 'XSRF-TOKEN', 'AWSALB', 'AWSALBCORS'].includes(name));
}

export async function fetchRaw(ids, date, { fetch: fetchFn = globalThis.fetch, signal } = {}) {
  validate(ids);
  const base = 'https://go.bychronos.com';
  const serviceUrl = `${base}/l/${ids.location}/a/services`;
  const first = await fetchFn(serviceUrl, { signal, headers: { 'user-agent': USER_AGENT } });
  const cookies = cookiePairs(first.headers);
  if ([401, 403, 429].includes(first.status)) {
    const error = new Error(`HTTP ${first.status}`);
    error.status = first.status;
    throw error;
  }
  if (!first.ok) throw new Error(`Chronos session request failed with HTTP ${first.status}`);
  const cookieHeader = cookies.map(([name, value]) => `${name}=${value}`).join('; ');
  const xsrf = cookies.find(([name]) => name === 'XSRF-TOKEN')?.[1];
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': USER_AGENT,
    'x-requested-with': 'XMLHttpRequest',
    'x-location-url': ids.location,
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
    ...(xsrf ? { 'x-xsrf-token': decodeURIComponent(xsrf) } : {})
  };
  const service = { service_id: ids.service_id, modifiers: [] };
  if (ids.option_id != null) service.option_id = ids.option_id;
  const payload = {
    guests: [{ services: [service] }],
    from: date,
    to: addDays(date, 6)
  };
  const response = await fetchFn(`${base}/api/timeslots-availability`, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify(payload)
  });
  return jsonResponse(response, 'Chronos');
}

export function normalize(raw, { ids, date }) {
  const days = Array.isArray(raw) ? raw : [];
  const slots = days.flatMap(day => {
    if (day.date !== date || !Array.isArray(day.time_slots)) return [];
    return day.time_slots.flatMap(seconds => {
      if (!Number.isFinite(seconds)) return [];
      const startMs = nyWallTimeUTC(date, seconds).getTime();
      if (nyDate(startMs) !== date) return [];
      const slot = { start: toNyISO(startMs) };
      if (ids.duration != null) slot.end = toNyISO(startMs + ids.duration * 60000);
      return [slot];
    });
  });
  return sortedSlots(slots);
}
