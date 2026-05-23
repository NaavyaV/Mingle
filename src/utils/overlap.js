/**
 * Helpers for the Friends overlap calendar.
 *
 * We merge each user's events into "busy intervals" so we can answer
 * "who is booked at time T?". The visible-on-the-grid representation is
 * a single synthetic schedule of busy blocks colored by how many users
 * are booked there.
 */
import { colors } from '../theme';

const DAY_MS = 24 * 3600 * 1000;

function clampToDayRange(event, days) {
  const start = new Date(event?.start?.dateTime);
  const end = new Date(event?.end?.dateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const first = new Date(days[0]);
  first.setHours(0, 0, 0, 0);
  const last = new Date(days[days.length - 1]);
  last.setHours(23, 59, 59, 999);
  if (end < first || start > last) return null;
  return {
    start: start < first ? first : start,
    end: end > last ? last : end,
    by: event.__by, // username, attached below
  };
}

function collectIntervals(users, days) {
  const all = [];
  for (const u of users || []) {
    const items = Array.isArray(u?.schedule?.items) ? u.schedule.items : [];
    for (const e of items) {
      const tagged = { ...e, __by: u.username };
      const clamped = clampToDayRange(tagged, days);
      if (clamped) all.push(clamped);
    }
  }
  return all;
}

/**
 * Returns a calendar-shaped overlay (so it can be passed straight to
 * `CalendarView`) plus a `bookedAt(date)` lookup that answers "which
 * usernames are busy at this moment".
 *
 * If `me` is provided, that user's own events are folded into the
 * overlay at a lower opacity (rendered in the app's primary color) so
 * the viewer can see where their own time stacks up against friends'
 * busy blocks.
 *
 *   {
 *     schedule: { items: [{ id, start, end, ... }] },
 *     bookedAt: (date) => [usernames]   // friends only, never `me`
 *   }
 */
export function buildOverlapSchedule(users, days, me = null) {
  const intervals = collectIntervals(users, days);
  const myOwnIntervals = me ? collectIntervals([me], days) : [];

  const friendItems = intervals.map((iv, i) => ({
    id: `overlap-${i}`,
    summary: '',
    start: { dateTime: iv.start.toISOString() },
    end: { dateTime: iv.end.toISOString() },
    colorId: 'friends',
    color: colors.gold,
    by: iv.by,
  }));

  const myItems = myOwnIntervals.map((iv, i) => ({
    id: `me-${i}`,
    summary: '',
    start: { dateTime: iv.start.toISOString() },
    end: { dateTime: iv.end.toISOString() },
    colorId: 'me',
    color: colors.primary,
    opacity: 0.35,
    by: iv.by,
  }));

  // Render mine first so the friend blocks paint on top (visually
  // dominant), but the alpha lets mine still poke through.
  const items = [...myItems, ...friendItems];
  const schedule = { kind: 'overlap', items };

  const bookedAt = (date) => {
    const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
    return Array.from(
      new Set(
        intervals
          .filter((iv) => iv.start.getTime() <= t && t < iv.end.getTime())
          .map((iv) => iv.by)
      )
    );
  };

  // Whether the viewer is busy at this moment, independent of friends.
  const meBusyAt = (date) => {
    if (!myOwnIntervals.length) return false;
    const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
    return myOwnIntervals.some(
      (iv) => iv.start.getTime() <= t && t < iv.end.getTime()
    );
  };

  return { schedule, bookedAt, meBusyAt };
}

export { DAY_MS };
