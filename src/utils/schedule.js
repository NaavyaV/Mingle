/**
 * Demo schedule generator. Emits events in Google Calendar API shape, which
 * uses the same canonical fields as iCalendar (RFC 5545) where applicable:
 *   - summary
 *   - location
 *   - description
 *   - start: { dateTime, timeZone }
 *   - end:   { dateTime, timeZone }
 *   - recurrence: ["RRULE:..."]  (iCal-compatible)
 *
 * This is intentionally provider-agnostic so the same shape will round-trip
 * cleanly once we wire up the real Google Calendar / iCal import.
 */

const COURSE_POOL = [
  { summary: 'CS 101 — Intro to Computer Science', location: 'Bldg A · Room 204' },
  { summary: 'MATH 220 — Linear Algebra', location: 'Bldg B · Room 110' },
  { summary: 'ENG 102 — Composition II', location: 'Bldg C · Room 305' },
  { summary: 'PSYC 110 — Intro Psychology', location: 'Bldg D · Room 118' },
  { summary: 'BIO 150 — General Biology', location: 'Science Hall · Lab 2' },
  { summary: 'ART 130 — 2D Design', location: 'Studio · Room 7' },
  { summary: 'HIST 105 — World History', location: 'Bldg A · Room 312' },
  { summary: 'PHIL 120 — Ethics', location: 'Bldg B · Room 220' },
];

const EXTRA_POOL = [
  { summary: 'Study session', location: 'Library · 2nd floor' },
  { summary: 'Lunch break', location: 'Student Union' },
  { summary: 'Coffee w/ friend', location: 'Campus Cafe' },
  { summary: 'Gym', location: 'Rec Center' },
  { summary: 'Club meeting', location: 'Bldg E · Room 101' },
  { summary: 'Office hours', location: 'Faculty Wing' },
];

const TIME_SLOTS = [
  { h: 8, m: 0 },
  { h: 9, m: 30 },
  { h: 11, m: 0 },
  { h: 13, m: 0 },
  { h: 14, m: 30 },
  { h: 16, m: 0 },
];

const WEEK_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR'];

function pickN(arr, n, seedOffset = 0) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    const idx = (i * 7 + seedOffset * 3) % copy.length;
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function isoOn(date, h, m) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function getMondayOfThisWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Build a believable weekly course schedule plus a handful of one-off events
 * for the current week. Returns an object that mirrors the shape of a Google
 * Calendar `events.list` response.
 */
export function buildDemoSchedule({ seed = 0 } = {}) {
  const timeZone = 'America/Chicago';
  const monday = getMondayOfThisWeek();

  const courses = pickN(COURSE_POOL, 4, seed);
  const events = [];

  courses.forEach((course, idx) => {
    const slot = TIME_SLOTS[(idx + seed) % TIME_SLOTS.length];
    const day = WEEK_DAYS[(idx * 2 + seed) % WEEK_DAYS.length];
    const altDay = WEEK_DAYS[(idx * 2 + seed + 2) % WEEK_DAYS.length];
    const dayIndex = WEEK_DAYS.indexOf(day);
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayIndex);

    events.push({
      id: `course-${seed}-${idx}`,
      summary: course.summary,
      location: course.location,
      description: 'Recurring class',
      start: { dateTime: isoOn(eventDate, slot.h, slot.m), timeZone },
      end: { dateTime: isoOn(eventDate, slot.h + 1, slot.m + 15), timeZone },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${day},${altDay}`],
      colorId: String((idx % 9) + 1),
      source: 'demo',
    });
  });

  // A few one-off events sprinkled through the week
  const extras = pickN(EXTRA_POOL, 3, seed + 1);
  extras.forEach((extra, idx) => {
    const dayIndex = (idx * 2 + seed) % 5;
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayIndex);
    const slot = TIME_SLOTS[(idx + seed + 3) % TIME_SLOTS.length];
    events.push({
      id: `extra-${seed}-${idx}`,
      summary: extra.summary,
      location: extra.location,
      description: 'One-off',
      start: { dateTime: isoOn(eventDate, slot.h, slot.m), timeZone },
      end: { dateTime: isoOn(eventDate, slot.h + 1, 0), timeZone },
      source: 'demo',
    });
  });

  return {
    kind: 'calendar#events',
    timeZone,
    updated: new Date().toISOString(),
    items: events,
  };
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventsForDay(schedule, date) {
  if (!schedule?.items) return [];
  return schedule.items
    .filter((ev) => {
      const start = new Date(ev.start.dateTime);
      return isSameDay(start, date);
    })
    .sort(
      (a, b) =>
        new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
    );
}

export function formatEventTime(ev) {
  const start = new Date(ev.start.dateTime);
  const end = new Date(ev.end.dateTime);
  const fmt = (d) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function getWeekDates(reference = new Date()) {
  const ref = new Date(reference);
  ref.setHours(0, 0, 0, 0);
  const day = ref.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diff);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getRange(mode, anchorDate) {
  const anchor = new Date(anchorDate);
  anchor.setHours(0, 0, 0, 0);
  if (mode === 'day') return [anchor];
  if (mode === '3day') {
    return Array.from({ length: 3 }).map((_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      return d;
    });
  }
  return getWeekDates(anchor);
}

export function fractionalHour(date) {
  return date.getHours() + date.getMinutes() / 60;
}

export function eventDuration(ev) {
  const start = new Date(ev.start.dateTime);
  const end = new Date(ev.end.dateTime);
  return Math.max(0.25, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

export function shortMonth(date) {
  return date.toLocaleString('en-US', { month: 'short' });
}
