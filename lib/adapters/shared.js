export const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
export const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export function requireObject(ids) {
  if (!ids || typeof ids !== 'object' || Array.isArray(ids)) throw new TypeError('ids must be an object');
}

export function requireId(value, name) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) throw new TypeError(`${name} must be a valid ID`);
}

export function requireInteger(value, name, optional = false) {
  if (optional && value == null) return;
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${name} must be an integer`);
}

export function requireIdArray(value, name) {
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !SAFE_ID.test(id))) {
    throw new TypeError(`${name} must be an array of valid IDs`);
  }
}

export function requireNameMap(value, name) {
  if (value == null) return;
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object`);
  for (const [key, label] of Object.entries(value)) {
    requireId(key, `${name} key`);
    if (typeof label !== 'string') throw new TypeError(`${name} values must be strings`);
  }
}

export async function jsonResponse(response, platform) {
  if ([401, 403, 429].includes(response.status)) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const text = await response.text();
  if (/html/i.test(response.headers?.get?.('content-type') || '') || /^\s*</.test(text) || /captcha|challenge required/i.test(text)) {
    const error = new Error('HTML or captcha response');
    error.blocked = true;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${platform} returned invalid JSON`);
  }
}

export function sortedSlots(slots) {
  return slots.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

export function dateOfISO(value) {
  const match = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
  if (!match) return '';
  return match[1];
}
