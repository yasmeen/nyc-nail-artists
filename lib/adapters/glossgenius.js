import { nyDate, toNyISO } from '../tz.js';
import { jsonResponse, requireId, requireNameMap, requireObject, sortedSlots } from './shared.js';

export function validate(ids) {
  requireObject(ids);
  for (const key of ['slug', 'business', 'service', 'location', 'space']) requireId(ids[key], key);
  requireNameMap(ids.staffNames, 'staffNames');
}

export async function fetchRaw(ids, date, { fetch: fetchFn = globalThis.fetch, signal } = {}) {
  validate(ids);
  const url = 'https://api.glossgenius.com/v4/web/bookings/availabilities/search';
  const body = {
    business_token: ids.business,
    availability_window: { from: date, to: addCalendarDay(date) },
    events: [{ service_token: ids.service }],
    location_tokens: [ids.location],
    slug: ids.slug,
    space_token: ids.space
  };
  return jsonResponse(await fetchFn(url, {
    method: 'POST',
    signal,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: `https://${ids.slug}.glossgenius.com`,
      referer: `https://${ids.slug}.glossgenius.com/`
    },
    body: JSON.stringify(body)
  }), 'GlossGenius');
}

function addCalendarDay(date) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

export function normalize(raw, { ids, date }) {
  const slots = (Array.isArray(raw?.data) ? raw.data : []).flatMap(item => {
    const timestamp = Date.parse(item.starts_at);
    if (!Number.isFinite(timestamp) || nyDate(timestamp) !== date) return [];
    const staffToken = item.events?.[0]?.space_member_tokens?.[0];
    const staff = ids.staffNames?.[staffToken];
    const slot = { start: toNyISO(timestamp) };
    if (item.ends_at) {
      const endMs = Date.parse(item.ends_at);
      if (Number.isFinite(endMs)) slot.end = toNyISO(endMs);
    }
    if (staff) slot.staff = staff;
    return [slot];
  });
  return sortedSlots(slots);
}
