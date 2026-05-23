const ical = require('node-ical');
const IcalExpander = require('ical-expander');

const DEFAULT_WEEKS_BACK = 2;
const DEFAULT_WEEKS_FORWARD = 16;

function isGoogleCalendarIcalUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname === 'calendar.google.com' &&
      u.pathname.includes('/calendar/ical/') &&
      u.pathname.endsWith('/basic.ics')
    );
  } catch {
    return false;
  }
}

function toJsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toJSDate === 'function') return value.toJSDate();
  if (typeof value.toISOString === 'function') return new Date(value.toISOString());
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function extractCalendarTimeZone(icsText) {
  const match = icsText.match(/X-WR-TIMEZONE:([^\r\n]+)/);
  return match ? match[1].trim() : 'America/Chicago';
}

function mapOccurrence(occ, timeZone) {
  const start = toJsDate(occ.startDate);
  const end = toJsDate(occ.endDate);
  const item = occ.item || {};
  const uid = item.uid || item.summary || 'event';
  return {
    id: `${uid}-${start.getTime()}`,
    summary: item.summary || '(No title)',
    location: item.location || undefined,
    description: item.description || undefined,
    start: { dateTime: start.toISOString(), timeZone },
    end: { dateTime: (end || start).toISOString(), timeZone },
    source: 'google',
  };
}

function mapNodeEvent(ev, timeZone) {
  const start = toJsDate(ev.start);
  const end = toJsDate(ev.end) || start;
  if (!start) return null;
  const uid = ev.uid || ev.summary || 'event';
  return {
    id: `${uid}-${start.getTime()}`,
    summary: ev.summary || '(No title)',
    location: ev.location || undefined,
    description: ev.description || undefined,
    start: { dateTime: start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
    source: 'google',
  };
}

/**
 * Fetch a Google Calendar iCal feed and normalize it into the schedule
 * shape the mobile app already renders (`kind`, `source`, `timeZone`, `items`).
 */
async function fetchAndParseIcal(icalUrl, options = {}) {
  if (!isGoogleCalendarIcalUrl(icalUrl)) {
    const err = new Error(
      'Use your Google Calendar secret iCal link (ends with /basic.ics).'
    );
    err.status = 400;
    throw err;
  }

  const res = await fetch(icalUrl, {
    headers: { Accept: 'text/calendar' },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = new Error(
      res.status === 404
        ? 'Calendar link not found. Check that you copied the full secret URL.'
        : `Could not download calendar (${res.status}).`
    );
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }

  const icsText = await res.text();
  if (!icsText.includes('BEGIN:VCALENDAR')) {
    const err = new Error('That URL did not return a valid calendar file.');
    err.status = 400;
    throw err;
  }

  const weeksBack = options.weeksBack ?? DEFAULT_WEEKS_BACK;
  const weeksForward = options.weeksForward ?? DEFAULT_WEEKS_FORWARD;
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() - weeksBack * 7);
  const max = new Date(now);
  max.setDate(max.getDate() + weeksForward * 7);

  const timeZone = extractCalendarTimeZone(icsText);
  const expander = new IcalExpander({ ics: icsText, maxIterations: 12_000 });
  const { events, occurrences } = expander.between(min, max);

  const items = [];
  const seen = new Set();

  const push = (entry) => {
    if (!entry) return;
    if (seen.has(entry.id)) return;
    seen.add(entry.id);
    items.push(entry);
  };

  for (const ev of events) {
    const start = toJsDate(ev.start);
    if (!start || start < min || start > max) continue;
    push(mapNodeEvent(ev, timeZone));
  }

  for (const occ of occurrences) {
    const start = toJsDate(occ.startDate);
    if (!start || start < min || start > max) continue;
    push(mapOccurrence(occ, timeZone));
  }

  // Google often ships edited instances as standalone VEVENTs with
  // RECURRENCE-ID; merge any the expander did not already cover.
  const parsed = ical.sync.parseICS(icsText);
  for (const key of Object.keys(parsed)) {
    const ev = parsed[key];
    if (ev.type !== 'VEVENT') continue;
    if (ev.status === 'CANCELLED') continue;
    if (ev.rrule) continue;
    const start = toJsDate(ev.start);
    if (!start || start < min || start > max) continue;
    push(mapNodeEvent(ev, timeZone));
  }

  items.sort(
    (a, b) =>
      new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
  );

  return {
    schedule: {
      kind: 'calendar#events',
      source: 'google',
      timeZone,
      updated: new Date().toISOString(),
      items,
    },
    eventCount: items.length,
  };
}

module.exports = {
  fetchAndParseIcal,
  isGoogleCalendarIcalUrl,
};
