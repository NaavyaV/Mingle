/**
 * Turns a user's schedule into a short "what are they doing right now"
 * status string for the map + the bottom-sheet profile card.
 *
 * Design notes:
 *   - All-day events (anything spanning ≥ ~18 hours of a calendar day)
 *     are ignored. We don't want "Mother's Day" or a multi-day trip to
 *     paint someone as "Busy all day" — only timed events count.
 *   - Free time is reported as a duration to the *next* timed event:
 *     "Free for 2h 15m". When no upcoming event exists, we just say
 *     "Free" with no duration.
 *   - Busy time is reported as a duration until the current event
 *     ends: "Busy for 35m". The event's title is preserved as the
 *     human-friendly label for the bottom-sheet card.
 */

const HOUR_MS = 3600 * 1000;
const ALL_DAY_THRESHOLD_MS = 18 * HOUR_MS;

function eventDurationMs(event) {
  const start = new Date(event?.start?.dateTime).getTime();
  const end = new Date(event?.end?.dateTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, end - start);
}

function isAllDay(event) {
  return eventDurationMs(event) >= ALL_DAY_THRESHOLD_MS;
}

function eventActiveAt(event, now) {
  const start = new Date(event?.start?.dateTime);
  const end = new Date(event?.end?.dateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= now && now < end;
}

function pickTimedEvents(events) {
  return (events || []).filter((e) => !isAllDay(e));
}

function nextEventAfter(events, now) {
  let best = null;
  for (const e of events || []) {
    const start = new Date(e?.start?.dateTime);
    if (Number.isNaN(start.getTime())) continue;
    if (start > now && (!best || start < new Date(best.start.dateTime))) best = e;
  }
  return best;
}

function minsLeft(event, now) {
  const end = new Date(event?.end?.dateTime);
  if (Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end - now) / 60000));
}

function formatDuration(mins) {
  if (mins < 1) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Short single-line status for the map pin caption.
 *   "Busy for 35m" / "Free for 2h" / "Free" / user's typed status / ''.
 */
export function inferPresence(user, now = new Date()) {
  const events = pickTimedEvents(user?.schedule?.items);
  const current = events.find((e) => eventActiveAt(e, now));
  if (current) {
    return `Busy for ${formatDuration(minsLeft(current, now))}`;
  }
  const next = nextEventAfter(events, now);
  if (next) {
    const start = new Date(next.start.dateTime);
    const freeMins = Math.max(0, Math.round((start - now) / 60000));
    return `Free for ${formatDuration(freeMins)}`;
  }
  if (user?.status) return user.status;
  return 'Free';
}

/**
 * Structured version of `inferPresence` for the map's bottom-sheet
 * profile card. Returns:
 *   { kind: 'busy',  title, location?, remaining }  // in a timed event
 *   { kind: 'free',  remaining? }                    // free with countdown
 *   { kind: 'free' }                                 // free, nothing upcoming
 */
export function getPresenceDetail(user, now = new Date()) {
  const events = pickTimedEvents(user?.schedule?.items);

  const current = events.find((e) => eventActiveAt(e, now));
  if (current) {
    return {
      kind: 'busy',
      title: current.summary || 'Busy',
      location: current.location,
      remaining: formatDuration(minsLeft(current, now)),
    };
  }

  const next = nextEventAfter(events, now);
  if (next) {
    const start = new Date(next.start.dateTime);
    const freeMins = Math.max(0, Math.round((start - now) / 60000));
    return {
      kind: 'free',
      remaining: formatDuration(freeMins),
      nextLabel: next.summary || 'next event',
    };
  }

  return { kind: 'free' };
}
