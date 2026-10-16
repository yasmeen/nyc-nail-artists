import { addDays, nyHHMM } from './tz.js';
import * as acuity from './adapters/acuity.js';
import * as square from './adapters/square.js';
import * as glossgenius from './adapters/glossgenius.js';
import * as chronos from './adapters/chronos.js';

const adapters = { acuity, square, glossgenius, chronos };
const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000;
const TIMEOUT_MS = 7000;

function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  try {
    addDays(date, 0);
    return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  } catch {
    return false;
  }
}

function validTime(value) {
  return value == null || value === '' || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function filtered(slots, from, to) {
  return slots.filter(slot => {
    const time = nyHHMM(Date.parse(slot.start));
    return (!from || time >= from) && (!to || time < to);
  });
}

export async function getAvailability({ platform, ids, date, from, to }, {
  fetch: fetchFn = globalThis.fetch,
  now = Date.now,
  timeoutMs = TIMEOUT_MS
} = {}) {
  if (!validDate(date)) throw new TypeError('date must be a valid YYYY-MM-DD date');
  if (!validTime(from) || !validTime(to) || (from && to && from > to)) {
    throw new TypeError('from and to must be valid times, with from earlier than to');
  }
  const adapterKey = String(platform || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  const adapter = adapters[adapterKey];
  if (!adapter) return { slots: [], error: 'manual' };
  adapter.validate(ids);
  const key = `${adapterKey}:${JSON.stringify(ids)}:${date}`;
  const current = now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > current) {
    return { slots: filtered(cached.slots, from, to), cached: true };
  }
  if (cached) cache.delete(key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const raw = await adapter.fetchRaw(ids, date, { fetch: fetchFn, signal: controller.signal });
    const slots = adapter.normalize(raw, { ids, date });
    cache.set(key, { slots, expiresAt: current + CACHE_TTL });
    return { slots: filtered(slots, from, to) };
  } catch (error) {
    if (controller.signal.aborted || error?.name === 'AbortError' || error?.code === 'ABORT_ERR') {
      return { slots: [], error: 'timeout' };
    }
    if (error?.blocked || [401, 403, 429].includes(error?.status)) return { slots: [], error: 'blocked' };
    console.error('Availability upstream error:', adapterKey, error?.message || error);
    return { slots: [], error: 'upstream' };
  } finally {
    clearTimeout(timer);
  }
}

export function clearAvailabilityCache() {
  cache.clear();
}

export function platformAdapter(platform) {
  return adapters[String(platform || '').trim().toLowerCase().replace(/[^a-z]/g, '')];
}
