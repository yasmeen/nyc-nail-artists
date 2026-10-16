import { nyDate, nyMidnightUTC, toNyISO } from '../tz.js';
import { jsonResponse, requireId, requireIdArray, requireNameMap, requireObject, sortedSlots } from './shared.js';

export function validate(ids) {
  requireObject(ids);
  requireId(ids.merchant, 'merchant');
  requireId(ids.location, 'location');
  requireId(ids.variation, 'variation');
  requireIdArray(ids.staff, 'staff');
  requireNameMap(ids.staffNames, 'staffNames');
}

export async function fetchRaw(ids, date, { fetch: fetchFn = globalThis.fetch, signal } = {}) {
  validate(ids);
  const start = nyMidnightUTC(date);
  const end = nyMidnightUTC(addCalendarDay(date));
  const url = 'https://app.squareup.com/appointments/api/buyer/availability';
  const body = {
    search_availability_request: {
      query: {
        filter: {
          start_at_range: { start_at: start.toISOString(), end_at: end.toISOString() },
          location_id: ids.location,
          segment_filters: [{
            service_variation_id: ids.variation,
            team_member_id_filter: { any: ids.staff }
          }]
        }
      }
    }
  };
  return jsonResponse(await fetchFn(url, {
    method: 'POST',
    signal,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: 'https://app.squareup.com',
      referer: `https://app.squareup.com/appointments/book/${ids.merchant}/${ids.location}/start`
    },
    body: JSON.stringify(body)
  }), 'Square');
}

function addCalendarDay(date) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

export function normalize(raw, { ids, date }) {
  const slots = (Array.isArray(raw?.availability) ? raw.availability : []).flatMap(item => {
    if (item.available !== true || !Number.isFinite(Number(item.start))) return [];
    const startMs = Number(item.start) * 1000;
    if (nyDate(startMs) !== date) return [];
    const staffToken = item.segments?.[0]?.employee_token;
    const staff = ids.staffNames?.[staffToken];
    const slot = { start: toNyISO(startMs) };
    if (item.end != null && Number.isFinite(Number(item.end))) slot.end = toNyISO(Number(item.end) * 1000);
    if (staff) slot.staff = staff;
    return [slot];
  });
  return sortedSlots(slots);
}
