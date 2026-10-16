const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

function partsAt(ms) {
  return Object.fromEntries(formatter.formatToParts(new Date(ms))
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, part.value]));
}

function localEpoch(parts) {
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
}

function offsetAt(ms) {
  const rounded = Math.floor(ms / 1000) * 1000;
  return localEpoch(partsAt(rounded)) - rounded;
}

export function nyMidnightUTC(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new TypeError('date must be YYYY-MM-DD');
  const [, year, month, day] = match;
  const target = Date.UTC(+year, +month - 1, +day);
  const result = target - offsetAt(target);
  const check = partsAt(result);
  if (+check.year !== +year || +check.month !== +month || +check.day !== +day || +check.hour !== 0) {
    throw new TypeError('date is not a valid New York calendar date');
  }
  return new Date(result);
}

export function nyWallTimeUTC(date, secondsAfterMidnight) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || !Number.isFinite(secondsAfterMidnight)) throw new TypeError('expected YYYY-MM-DD and seconds after midnight');
  const [, year, month, day] = match;
  const wallTime = Date.UTC(+year, +month - 1, +day) + secondsAfterMidnight * 1000;
  let result = wallTime;
  for (let attempt = 0; attempt < 4; attempt++) {
    const next = wallTime - offsetAt(result);
    if (next === result) break;
    result = next;
  }
  return new Date(result);
}

export function toNyISO(ms) {
  const parts = partsAt(ms);
  const offsetMinutes = Math.round(offsetAt(ms) / 60000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

export function nyDate(ms) {
  const parts = partsAt(ms);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function nyHHMM(ms) {
  const parts = partsAt(ms);
  return `${parts.hour}:${parts.minute}`;
}

export function addDays(date, n) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || !Number.isInteger(n)) throw new TypeError('expected YYYY-MM-DD and an integer day count');
  const [, year, month, day] = match;
  const next = new Date(Date.UTC(+year, +month - 1, +day + n));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}
