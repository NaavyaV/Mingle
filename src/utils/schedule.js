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
  { summary: 'BUSN 200 — Microeconomics', location: 'Bldg E · Room 230' },
  { summary: 'COMM 130 — Public Speaking', location: 'Bldg C · Room 210' },
];

const WORKOUT_POOL = [
  { summary: 'Gym session', location: 'Rec Center' },
  { summary: 'Morning run', location: 'Campus loop' },
  { summary: 'Yoga class', location: 'Rec Center · Studio B' },
  { summary: 'Pickup basketball', location: 'Rec Center · Court 2' },
  { summary: 'Climbing', location: 'Rec Center · Wall' },
];

const STUDY_POOL = [
  { summary: 'Study group', location: 'Library · 2nd floor' },
  { summary: 'Library time', location: 'Library · Quiet zone' },
  { summary: 'Homework block', location: 'Library · 3rd floor' },
  { summary: 'Project work', location: 'Library · Collab room' },
];

const SOCIAL_POOL = [
  { summary: 'Coffee w/ friend', location: 'Campus Cafe' },
  { summary: 'Boba run', location: 'Sharetea on College Ave' },
  { summary: 'Movie night', location: 'Mason’s dorm' },
  { summary: 'Game night', location: 'Student Union · Game room' },
  { summary: 'Concert at the union', location: 'Student Union · Stage' },
];

const MEAL_POOL = [
  { summary: 'Lunch break', location: 'Student Union' },
  { summary: 'Quick lunch', location: 'Campus Cafe' },
  { summary: 'Lunch w/ classmates', location: 'Outside Bldg A' },
  { summary: 'Coffee + breakfast', location: 'Campus Cafe' },
  { summary: 'Meal prep', location: 'Apartment kitchen' },
  { summary: 'Brunch w/ roommates', location: 'Pancake House on 5th' },
  { summary: 'Dinner w/ friends', location: 'Tacos & Co.' },
];

const CLUB_POOL = [
  { summary: 'CS Club meeting', location: 'Bldg A · Room 101' },
  { summary: 'Volunteer hours', location: 'Community Center' },
  { summary: 'Office hours w/ Prof Lee', location: 'Faculty Wing · A-220' },
  { summary: 'Tutoring session', location: 'Learning Center' },
];

function pickFromSeed(arr, seed) {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

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
 * Each weekday's plan describes the bones of a realistic college day:
 *   pool: which category to draw from (course pool gets a stable index)
 *   h, m: start time
 *   dur: length in minutes
 *   classIdx: when pool === 'course', which of the user's 4 courses to use
 *
 * Saturday and Sunday lean on social/workout/study activities so the week
 * never has an empty day in the calendar grid.
 */
const WEEK_PLAN = [
  // Monday
  [
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 0, dur: 30 },
    { pool: 'course', classIdx: 0, h: 9, m: 0, dur: 75 },
    { pool: 'meal', h: 12, m: 15, dur: 45 },
    { pool: 'course', classIdx: 1, h: 14, m: 0, dur: 75 },
    { pool: 'workout', h: 17, m: 0, dur: 60 },
  ],
  // Tuesday
  [
    { pool: 'course', classIdx: 2, h: 10, m: 30, dur: 75 },
    { pool: 'meal', h: 12, m: 30, dur: 30 },
    { pool: 'study', h: 14, m: 0, dur: 90 },
    { pool: 'club', h: 17, m: 30, dur: 60 },
  ],
  // Wednesday
  [
    { pool: 'workout', h: 7, m: 30, dur: 45 },
    { pool: 'course', classIdx: 0, h: 9, m: 0, dur: 75 },
    { pool: 'meal', h: 12, m: 15, dur: 45 },
    { pool: 'course', classIdx: 3, h: 13, m: 0, dur: 75 },
    { pool: 'social', h: 18, m: 30, dur: 90 },
  ],
  // Thursday
  [
    { pool: 'course', classIdx: 2, h: 10, m: 30, dur: 75 },
    { pool: 'meal', h: 12, m: 30, dur: 30 },
    { pool: 'study', h: 14, m: 30, dur: 90 },
    { pool: 'workout', h: 17, m: 0, dur: 60 },
  ],
  // Friday
  [
    { pool: 'course', classIdx: 0, h: 9, m: 0, dur: 75 },
    { pool: 'meal', h: 12, m: 15, dur: 45 },
    { pool: 'course', classIdx: 1, h: 14, m: 0, dur: 75 },
    { pool: 'social', h: 16, m: 30, dur: 60 },
  ],
  // Saturday
  [
    { pool: 'meal', subPool: 'brunch', h: 11, m: 0, dur: 75 },
    { pool: 'workout', h: 14, m: 30, dur: 90 },
    { pool: 'social', h: 20, m: 0, dur: 120 },
  ],
  // Sunday
  [
    { pool: 'workout', h: 9, m: 30, dur: 45 },
    { pool: 'meal', subPool: 'mealprep', h: 12, m: 0, dur: 60 },
    { pool: 'study', h: 15, m: 0, dur: 120 },
    { pool: 'club', h: 18, m: 0, dur: 60 },
  ],
];

function pickActivity(pool, subPool, seed, courses, idx) {
  if (pool === 'course') {
    return courses[idx % courses.length];
  }
  if (pool === 'meal' && subPool === 'breakfast') {
    return pickFromSeed(MEAL_POOL.filter((m) => /breakfast|coffee/i.test(m.summary)), seed);
  }
  if (pool === 'meal' && subPool === 'brunch') {
    return pickFromSeed(MEAL_POOL.filter((m) => /brunch/i.test(m.summary)), seed);
  }
  if (pool === 'meal' && subPool === 'mealprep') {
    return pickFromSeed(MEAL_POOL.filter((m) => /meal prep|dinner/i.test(m.summary)), seed);
  }
  if (pool === 'meal') {
    return pickFromSeed(
      MEAL_POOL.filter((m) => /lunch/i.test(m.summary)),
      seed
    );
  }
  if (pool === 'workout') return pickFromSeed(WORKOUT_POOL, seed);
  if (pool === 'study') return pickFromSeed(STUDY_POOL, seed);
  if (pool === 'social') return pickFromSeed(SOCIAL_POOL, seed);
  if (pool === 'club') return pickFromSeed(CLUB_POOL, seed);
  return { summary: 'Free time', location: '' };
}

/**
 * Build a believable weekly schedule for the current week. Every day (Mon–Sun)
 * gets at least two events. Returns an object shaped like a Google Calendar
 * `events.list` response.
 */
export function buildDemoSchedule({ seed = 0 } = {}) {
  const timeZone = 'America/Chicago';
  const monday = getMondayOfThisWeek();

  const courses = pickN(COURSE_POOL, 4, seed);
  const events = [];

  WEEK_PLAN.forEach((day, dayIdx) => {
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayIdx);

    day.forEach((item, slotIdx) => {
      const activity = pickActivity(item.pool, item.subPool, seed + dayIdx * 11 + slotIdx, courses, item.classIdx ?? slotIdx);
      const startIso = isoOn(eventDate, item.h, item.m);
      const endDate = new Date(eventDate);
      endDate.setHours(item.h, item.m + item.dur, 0, 0);

      events.push({
        id: `ev-${seed}-${dayIdx}-${slotIdx}`,
        summary: activity.summary,
        location: activity.location || undefined,
        description: item.pool === 'course' ? 'Class' : 'Activity',
        start: { dateTime: startIso, timeZone },
        end: { dateTime: endDate.toISOString(), timeZone },
        source: 'demo',
      });
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
