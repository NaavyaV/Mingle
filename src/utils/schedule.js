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

// --- RNG --------------------------------------------------------------
//
// All randomness flows through a single deterministic RNG so that
// passing a `seed` produces a stable schedule (useful for tests), while
// omitting it yields a fresh schedule on every call.

function makeRng(seed) {
  // Mulberry32 — small, fast, good enough for variety.
  let a = (seed || Math.floor(Math.random() * 2 ** 31)) >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function pickN(rng, arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function pickActivity(rng, pool, subPool, courses, idx) {
  if (pool === 'course') return courses[idx % courses.length];
  if (pool === 'meal' && subPool === 'breakfast') {
    return pick(rng, MEAL_POOL.filter((m) => /breakfast|coffee/i.test(m.summary)));
  }
  if (pool === 'meal' && subPool === 'brunch') {
    return pick(rng, MEAL_POOL.filter((m) => /brunch/i.test(m.summary)));
  }
  if (pool === 'meal' && subPool === 'mealprep') {
    return pick(rng, MEAL_POOL.filter((m) => /meal prep|dinner/i.test(m.summary)));
  }
  if (pool === 'meal') return pick(rng, MEAL_POOL.filter((m) => /lunch/i.test(m.summary)));
  if (pool === 'workout') return pick(rng, WORKOUT_POOL);
  if (pool === 'study') return pick(rng, STUDY_POOL);
  if (pool === 'social') return pick(rng, SOCIAL_POOL);
  if (pool === 'club') return pick(rng, CLUB_POOL);
  return { summary: 'Free time', location: '' };
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

// --- Day templates ----------------------------------------------------
//
// A library of ~20 realistic college day shapes. The generator pulls
// one at random for each day (with weekend templates only used on Sat/
// Sun) so that every shuffle produces a noticeably different week.
//
// Each slot uses:
//   h, m        — base start time (24h)
//   dur         — duration in minutes
//   pool        — activity category to draw from
//   subPool     — optional finer-grained filter (e.g. 'breakfast')
//   classIdx    — when pool === 'course', which of the user's 4 picks
//   jitter      — optional +/- minutes added to start time
//   durJitter   — optional +/- minutes added to duration

const WEEKDAY_TEMPLATES = [
  // Heavy class morning
  [
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 0, dur: 30, jitter: 15 },
    { pool: 'course', classIdx: 0, h: 9, m: 0, dur: 75 },
    { pool: 'course', classIdx: 1, h: 11, m: 0, dur: 75 },
    { pool: 'meal', h: 12, m: 30, dur: 45 },
    { pool: 'study', h: 14, m: 0, dur: 90, durJitter: 30 },
  ],
  // Afternoon-heavy
  [
    { pool: 'workout', h: 8, m: 0, dur: 60, jitter: 30 },
    { pool: 'course', classIdx: 2, h: 11, m: 0, dur: 75 },
    { pool: 'meal', h: 13, m: 0, dur: 30 },
    { pool: 'course', classIdx: 3, h: 14, m: 30, dur: 75 },
    { pool: 'study', h: 16, m: 30, dur: 60 },
  ],
  // Lab + late class
  [
    { pool: 'course', classIdx: 0, h: 10, m: 30, dur: 75 },
    { pool: 'meal', h: 12, m: 30, dur: 30 },
    { pool: 'study', h: 13, m: 30, dur: 90 },
    { pool: 'club', h: 17, m: 30, dur: 60 },
    { pool: 'social', h: 20, m: 0, dur: 90 },
  ],
  // Workout-first
  [
    { pool: 'workout', h: 7, m: 0, dur: 60 },
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 30, dur: 30 },
    { pool: 'course', classIdx: 1, h: 10, m: 0, dur: 75 },
    { pool: 'meal', h: 12, m: 15, dur: 45 },
    { pool: 'study', h: 15, m: 0, dur: 120, durJitter: 30 },
  ],
  // Office hours focus
  [
    { pool: 'course', classIdx: 0, h: 9, m: 0, dur: 75 },
    { pool: 'meal', h: 12, m: 30, dur: 30 },
    { pool: 'club', h: 14, m: 0, dur: 60 },
    { pool: 'study', h: 16, m: 0, dur: 90 },
    { pool: 'social', h: 19, m: 30, dur: 90 },
  ],
  // Light Tuesday/Thursday
  [
    { pool: 'meal', subPool: 'breakfast', h: 9, m: 0, dur: 30 },
    { pool: 'course', classIdx: 2, h: 11, m: 0, dur: 75 },
    { pool: 'meal', h: 13, m: 0, dur: 45 },
    { pool: 'workout', h: 16, m: 0, dur: 60 },
  ],
  // Group project day
  [
    { pool: 'course', classIdx: 1, h: 9, m: 30, dur: 75 },
    { pool: 'meal', h: 12, m: 15, dur: 45 },
    { pool: 'study', h: 13, m: 30, dur: 120 },
    { pool: 'meal', h: 18, m: 30, dur: 60 },
  ],
  // Tutoring + late study
  [
    { pool: 'course', classIdx: 3, h: 11, m: 0, dur: 75 },
    { pool: 'meal', h: 13, m: 0, dur: 30 },
    { pool: 'club', h: 14, m: 30, dur: 60 },
    { pool: 'study', h: 19, m: 0, dur: 120, durJitter: 60 },
  ],
  // All-day social
  [
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 30, dur: 30 },
    { pool: 'course', classIdx: 0, h: 10, m: 0, dur: 75 },
    { pool: 'social', h: 12, m: 30, dur: 90 },
    { pool: 'workout', h: 16, m: 0, dur: 60 },
    { pool: 'social', h: 20, m: 0, dur: 120 },
  ],
  // Early bird
  [
    { pool: 'workout', h: 6, m: 30, dur: 60 },
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 0, dur: 30 },
    { pool: 'course', classIdx: 2, h: 9, m: 30, dur: 75 },
    { pool: 'study', h: 13, m: 0, dur: 90 },
    { pool: 'social', h: 17, m: 30, dur: 90 },
  ],
  // Marathon class day
  [
    { pool: 'course', classIdx: 0, h: 9, m: 0, dur: 75 },
    { pool: 'course', classIdx: 1, h: 11, m: 0, dur: 75 },
    { pool: 'meal', h: 13, m: 0, dur: 30 },
    { pool: 'course', classIdx: 2, h: 14, m: 0, dur: 75 },
    { pool: 'course', classIdx: 3, h: 16, m: 30, dur: 75 },
  ],
  // Volunteer day
  [
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 0, dur: 30 },
    { pool: 'club', h: 9, m: 30, dur: 120 },
    { pool: 'meal', h: 12, m: 30, dur: 45 },
    { pool: 'course', classIdx: 1, h: 14, m: 30, dur: 75 },
    { pool: 'workout', h: 17, m: 30, dur: 60 },
  ],
  // Cafe focus
  [
    { pool: 'meal', subPool: 'breakfast', h: 9, m: 0, dur: 30 },
    { pool: 'study', h: 10, m: 0, dur: 150, durJitter: 30 },
    { pool: 'meal', h: 13, m: 0, dur: 45 },
    { pool: 'course', classIdx: 3, h: 15, m: 0, dur: 75 },
  ],
  // Late riser
  [
    { pool: 'course', classIdx: 2, h: 12, m: 0, dur: 75 },
    { pool: 'meal', h: 14, m: 0, dur: 45 },
    { pool: 'study', h: 15, m: 30, dur: 90 },
    { pool: 'workout', h: 18, m: 30, dur: 60 },
    { pool: 'social', h: 20, m: 30, dur: 90 },
  ],
];

const WEEKEND_TEMPLATES = [
  // Chill Saturday
  [
    { pool: 'meal', subPool: 'brunch', h: 11, m: 0, dur: 75, jitter: 30 },
    { pool: 'workout', h: 14, m: 30, dur: 90 },
    { pool: 'social', h: 20, m: 0, dur: 120 },
  ],
  // Productive weekend
  [
    { pool: 'workout', h: 8, m: 30, dur: 60 },
    { pool: 'meal', subPool: 'brunch', h: 10, m: 30, dur: 60 },
    { pool: 'study', h: 13, m: 0, dur: 150 },
    { pool: 'social', h: 18, m: 30, dur: 90 },
  ],
  // Lazy day
  [
    { pool: 'meal', subPool: 'brunch', h: 12, m: 0, dur: 60 },
    { pool: 'social', h: 15, m: 0, dur: 120 },
    { pool: 'meal', h: 19, m: 30, dur: 90 },
  ],
  // Outdoor adventure
  [
    { pool: 'meal', subPool: 'breakfast', h: 8, m: 0, dur: 30 },
    { pool: 'workout', h: 9, m: 0, dur: 180, durJitter: 30 },
    { pool: 'meal', h: 13, m: 30, dur: 60 },
    { pool: 'study', h: 16, m: 0, dur: 90 },
  ],
  // Reset Sunday
  [
    { pool: 'workout', h: 9, m: 30, dur: 45 },
    { pool: 'meal', subPool: 'mealprep', h: 12, m: 0, dur: 60 },
    { pool: 'study', h: 15, m: 0, dur: 120, durJitter: 30 },
    { pool: 'club', h: 18, m: 0, dur: 60 },
  ],
  // Big game day
  [
    { pool: 'meal', subPool: 'brunch', h: 11, m: 0, dur: 60 },
    { pool: 'social', h: 13, m: 0, dur: 180 },
    { pool: 'meal', h: 19, m: 0, dur: 90 },
  ],
];

// Total templates ≈ 21, well past the "15-20" the user asked for.

function instantiateSlot(rng, slot, date, courses, idCounter) {
  const jitter = slot.jitter || 0;
  const durJitter = slot.durJitter || 0;
  const jitterStep = 15; // keep times on the quarter hour
  const startMinutesShift =
    jitter > 0
      ? (Math.floor(rng() * ((jitter * 2) / jitterStep + 1)) - jitter / jitterStep) *
        jitterStep
      : 0;
  const durShift =
    durJitter > 0
      ? (Math.floor(rng() * ((durJitter * 2) / jitterStep + 1)) -
          durJitter / jitterStep) *
        jitterStep
      : 0;

  const baseMinutes = slot.h * 60 + slot.m + startMinutesShift;
  const startH = Math.floor(baseMinutes / 60);
  const startM = baseMinutes - startH * 60;
  const finalDur = Math.max(15, slot.dur + durShift);

  const activity = pickActivity(rng, slot.pool, slot.subPool, courses, slot.classIdx ?? 0);
  const startIso = isoOn(date, startH, startM);
  const endDate = new Date(date);
  endDate.setHours(startH, startM + finalDur, 0, 0);

  return {
    id: `ev-${date.getTime()}-${idCounter}-${Math.floor(rng() * 1e6)}`,
    summary: activity.summary,
    location: activity.location || undefined,
    description: slot.pool === 'course' ? 'Class' : 'Activity',
    start: { dateTime: startIso, timeZone: 'America/Chicago' },
    end: { dateTime: endDate.toISOString(), timeZone: 'America/Chicago' },
    source: 'demo',
  };
}

/**
 * Build a believable two-week schedule starting from this week's Monday.
 *
 * Each day picks one of ~20 day templates at random, then jitters
 * individual event start times and durations so two users (or two
 * shuffles) almost never produce the same week. Weekend days draw from
 * a dedicated weekend pool so the rhythm still feels right.
 *
 * Returns a Google-Calendar-shaped wrapper: `{ kind, timeZone, updated, items }`.
 */
export function buildDemoSchedule({ seed, weeks = 2 } = {}) {
  const rng = makeRng(seed);
  const timeZone = 'America/Chicago';
  const monday = getMondayOfThisWeek();
  const courses = pickN(rng, COURSE_POOL, 4);
  const totalDays = 7 * weeks;
  const events = [];
  let idCounter = 0;

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx += 1) {
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayIdx);
    const dow = eventDate.getDay(); // 0 Sun, 6 Sat
    const isWeekend = dow === 0 || dow === 6;
    const templates = isWeekend ? WEEKEND_TEMPLATES : WEEKDAY_TEMPLATES;
    const template = pick(rng, templates);

    template.forEach((slot) => {
      idCounter += 1;
      events.push(instantiateSlot(rng, slot, eventDate, courses, idCounter));
    });
  }

  return {
    kind: 'calendar#events',
    // `source` lets the rest of the app know this schedule was generated
    // (vs. imported from a real calendar provider). The sync button uses
    // it to avoid re-rolling a user's schedule out from under them.
    source: 'demo',
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
