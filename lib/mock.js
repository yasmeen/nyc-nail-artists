import { nyMidnightUTC, toNyISO } from './tz.js';

export async function mockAvailability({ platform, date }) {
  const name = String(platform || '').toLowerCase();
  if (name === 'chronos') {
    await new Promise(resolve => setTimeout(resolve, 10000));
    return { slots: [] };
  }
  if (name === 'square') return { slots: [] };
  if (name === 'glossgenius') return { slots: [], error: 'blocked' };
  if (name === 'acuity') {
    const midnight = nyMidnightUTC(date).getTime();
    return {
      slots: Array.from({ length: 6 }, (_, index) => ({
        start: toNyISO(midnight + (10 + index) * 60 * 60 * 1000)
      }))
    };
  }
  return { slots: [], error: 'manual' };
}
