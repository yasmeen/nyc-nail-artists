import { nyDate, toNyISO } from '../tz.js';
import { jsonResponse, requireId, requireInteger, requireObject, sortedSlots } from './shared.js';

export function validate(ids) {
  requireObject(ids);
  requireId(ids.subdomain, 'subdomain');
  requireId(ids.owner, 'owner');
  requireInteger(ids.appointmentTypeId, 'appointmentTypeId');
  requireInteger(ids.calendarId, 'calendarId', true);
}

export async function fetchRaw(ids, date, { fetch: fetchFn = globalThis.fetch, signal } = {}) {
  validate(ids);
  const url = new URL(`https://${ids.subdomain}.as.me/api/scheduling/v1/availability/times`);
  url.search = new URLSearchParams({
    owner: ids.owner,
    appointmentTypeId: String(ids.appointmentTypeId),
    ...(ids.calendarId == null ? {} : { calendarId: String(ids.calendarId) }),
    startDate: date,
    timezone: 'America/New_York'
  });
  return jsonResponse(await fetchFn(url, { signal }), 'Acuity');
}

export function normalize(raw, { date }) {
  const slots = (Array.isArray(raw?.[date]) ? raw[date] : []).flatMap(slot => {
    const start = String(slot.time || '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    const timestamp = Date.parse(start);
    if (!Number.isFinite(timestamp) || nyDate(timestamp) !== date) return [];
    return [{ start: toNyISO(timestamp) }];
  });
  return sortedSlots(slots);
}
