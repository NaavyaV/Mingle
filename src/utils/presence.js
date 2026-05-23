/**
 * Turns a user's schedule into a short "what are they doing right now"
 * status string for the map.
 */

function eventActiveAt(event, now) {
  const start = new Date(event?.start?.dateTime);
  const end = new Date(event?.end?.dateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= now && now < end;
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

function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh = ((h + 11) % 12) + 1;
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, '0')}${ampm}`;
}

function formatDuration(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Best-effort short status for a user, e.g. "in class for 45m" or
 * "free until 4pm" or just their own status if nothing applies.
 */
export function inferPresence(user, now = new Date()) {
  const raw = user?.schedule?.items;
  const events = Array.isArray(raw) ? raw : [];
  const current = events.find((e) => eventActiveAt(e, now));
  if (current) {
    const m = minsLeft(current, now);
    const label = (current.summary || 'busy').toLowerCase();
    if (m >= 60) return `${label} • ${Math.round(m / 60)}h left`;
    return `${label} • ${m}m left`;
  }
  if (user?.status) return user.status;
  const next = nextEventAfter(events, now);
  if (next) {
    const start = new Date(next.start.dateTime);
    return `free until ${formatTime(start)}`;
  }
  return 'free now';
}

/**
 * Structured version of `inferPresence` for the map's bottom-sheet
 * profile card. Returns:
 *   { kind: 'busy',  title, until, freeFor? }    // currently in event
 *   { kind: 'free',  title, until?, freeFor? }   // free now
 *   { kind: 'hidden' }                            // no calendar visibility
 */
export function getPresenceDetail(user, now = new Date()) {
  const raw = user?.schedule?.items;
  const events = Array.isArray(raw) ? raw : [];

  const current = events.find((e) => eventActiveAt(e, now));
  if (current) {
    const end = new Date(current.end.dateTime);
    return {
      kind: 'busy',
      title: current.summary || 'Busy',
      location: current.location,
      until: formatTime(end),
      remaining: formatDuration(minsLeft(current, now)),
    };
  }

  const next = nextEventAfter(events, now);
  if (next) {
    const start = new Date(next.start.dateTime);
    const freeMins = Math.max(0, Math.round((start - now) / 60000));
    return {
      kind: 'free',
      title: 'Free',
      until: formatTime(start),
      freeFor: formatDuration(freeMins),
      nextLabel: next.summary || 'next event',
    };
  }

  return { kind: 'free', title: 'Free', freeFor: 'for the rest of the day' };
}
