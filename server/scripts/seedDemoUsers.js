/* eslint-disable no-console */
/**
 * Seed script: wipe ALL existing users + their related data, then
 * insert 50 diverse demo personas anchored to specific HCC Central
 * Campus buildings (Houston, TX). Each persona gets a generated
 * avatar, interests, schedule, and home location.
 *
 * Usage (from project root):
 *   cd server && npm run seed:demo
 *
 * After running, restart the Expo app and create your own account —
 * you'll see the 50 personas scattered across the campus map and
 * can friend/message them like any other user.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../src/db');
const User = require('../src/models/User');
const Friend = require('../src/models/Friend');
const Message = require('../src/models/Message');
const Event = require('../src/models/Event');

// --- Deterministic RNG so re-runs produce a stable cast ---------------
function makeRng(seed) {
  let a = (seed || 1234567) >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const RNG = makeRng(987654321);
const pick = (arr) => arr[Math.floor(RNG() * arr.length)];
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i += 1) {
    out.push(copy.splice(Math.floor(RNG() * copy.length), 1)[0]);
  }
  return out;
}

// --- HCC Central Campus area anchors (Houston, TX) --------------------
// Anchors are real-ish coordinates around HCC Central Campus and the
// surrounding Third Ward (Wichita St / Jackson St / Rosedale St area).
// Each persona gets pinned to one of these spots with ~30m of jitter
// so multiple people don't overlap pixel-perfectly on the map.
const HCC_ANCHORS = [
  { label: 'HCC Central Library', latitude: 29.7257, longitude: -95.3792 },
  { label: 'San Jacinto Memorial Building', latitude: 29.7251, longitude: -95.3796 },
  { label: 'Heinen Theatre', latitude: 29.7263, longitude: -95.3803 },
  { label: 'Workforce Building', latitude: 29.7268, longitude: -95.3785 },
  { label: 'Learning Hub', latitude: 29.7245, longitude: -95.3789 },
  { label: 'HCC Auditorium', latitude: 29.7242, longitude: -95.3779 },
  { label: 'Student Services Center', latitude: 29.7236, longitude: -95.3801 },
  { label: 'Rec Center', latitude: 29.7228, longitude: -95.3782 },
  { label: 'Bookstore on Holman', latitude: 29.7240, longitude: -95.3770 },
  { label: 'Cafe on Almeda', latitude: 29.7232, longitude: -95.3793 },
  { label: 'Stafford Hall', latitude: 29.7253, longitude: -95.3811 },
  { label: 'Coleman Annex', latitude: 29.7220, longitude: -95.3768 },
  { label: 'Eastside Quad', latitude: 29.7249, longitude: -95.3762 },
  { label: 'Emancipation Park', latitude: 29.7222, longitude: -95.3725 },
  { label: 'Project Row Houses', latitude: 29.7228, longitude: -95.3697 },
  { label: 'Wichita St townhomes', latitude: 29.7230, longitude: -95.3755 },
  { label: 'Rosedale St houses', latitude: 29.7211, longitude: -95.3760 },
  { label: 'Jackson St lofts', latitude: 29.7238, longitude: -95.3740 },
  { label: 'Tierwester Park', latitude: 29.7203, longitude: -95.3720 },
  { label: 'TSU edge', latitude: 29.7197, longitude: -95.3722 },
];

function jitterCoord(anchor) {
  // ~30m radius in roughly equal lat/lng degrees at Houston's latitude.
  const dLat = (RNG() - 0.5) * 0.0006;
  const dLng = (RNG() - 0.5) * 0.0007;
  return {
    latitude: +(anchor.latitude + dLat).toFixed(6),
    longitude: +(anchor.longitude + dLng).toFixed(6),
    label: anchor.label,
  };
}

// --- Persona name pools (intentionally diverse) -----------------------
const FIRST_NAMES = [
  'Sofia', 'Aisha', 'Priya', 'Mei', 'Camila', 'Nia', 'Yuki', 'Layla',
  'Zara', 'Maya', 'Olivia', 'Emma', 'Hannah', 'Grace', 'Ana', 'Daniela',
  'Imani', 'Sade', 'Rina', 'Chloe',
  'Diego', 'Wes', 'Kofi', 'Jamal', 'Ravi', 'Hiroshi', 'Marco', 'Andre',
  'Ahmad', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Caleb', 'Malik',
  'Carlos', 'Tariq', 'Omar', 'Jin',
  'Avery', 'Jordan', 'Riley', 'Casey', 'Sam', 'Alex', 'Taylor', 'Rowan',
  'Quinn', 'Reese',
];
const LAST_NAMES = [
  'Nguyen', 'Patel', 'Garcia', 'Lopez', 'Kim', 'Okafor', 'Hassan', 'Ali',
  'Cohen', 'Singh', 'Tanaka', 'Mendoza', 'Brown', 'Johnson', 'Williams',
  'Davis', 'Martinez', 'Thompson', 'Robinson', 'Wong', 'Chen', 'Liu',
  'Adeyemi', 'Mbeki', 'Park', 'Sato', 'Reyes', 'Ortiz', 'Hernandez',
  'Vasquez', 'Khan', 'Iyer', 'Mehta', 'Diallo', 'Diop',
];

// --- Avatar option ids (must match src/components/Avatar/options.js) --
const SKIN_IDS = ['porcelain', 'light', 'warm', 'tan', 'deep', 'rich'];
const HAIR_COLOR_IDS = ['black', 'brown', 'auburn', 'blonde', 'gray', 'pink'];
const CLOTHING_IDS = ['navy', 'coral', 'gold', 'forest', 'rose', 'graphite'];
const HAIR_STYLES = {
  male: ['short', 'buzz', 'quiff', 'curly'],
  female: ['long', 'bob', 'ponytail', 'wavy'],
};

function randomAvatar() {
  const gender = RNG() < 0.5 ? 'female' : 'male';
  return {
    skin: pick(SKIN_IDS),
    hairColor: pick(HAIR_COLOR_IDS),
    hairStyle: pick(HAIR_STYLES[gender]),
    clothing: pick(CLOTHING_IDS),
    gender,
  };
}

// --- Interests --------------------------------------------------------
const INTERESTS = [
  'Coding', 'Gaming', 'Music', 'Movies', 'Anime', 'Reading', 'Photography',
  'Art', 'Design', 'Cooking', 'Coffee', 'Tea', 'Hiking', 'Running',
  'Cycling', 'Gym', 'Yoga', 'Basketball', 'Soccer', 'Volleyball', 'Dance',
  'Theatre', 'Volunteering', 'Politics', 'Entrepreneurship', 'Science',
  'Math', 'AI / ML', 'Startups', 'Languages', 'Travel', 'Pets', 'Skating',
  'Climbing',
];

// --- Statuses (about half the personas get one) -----------------------
const STATUSES = [
  'studying rn',
  'need coffee',
  'in the library 💤',
  'lookin for a study buddy',
  'cs is killin me',
  'post-gym glow',
  'snack time',
  'boba run anyone?',
  'chillin',
  'ignoring my homework',
  'free for vibes',
  'in class help',
  'got food, dm me',
  'sleep schedule = chaos',
  'group project this week 😩',
  'midterms soon ahh',
  'down for tacos',
  'reading on the quad',
  'on a walk',
];

// --- Lightweight schedule generator (CommonJS, mirrors src shape) -----
const CHICAGO_TZ = 'America/Chicago';
const EVENT_POOLS = [
  { summary: 'CS 101', location: 'San Jacinto · Room 204' },
  { summary: 'MATH 220', location: 'Workforce Bldg · Room 110' },
  { summary: 'ENG 102', location: 'Heinen Theatre · Annex' },
  { summary: 'PSYC 110', location: 'Learning Hub · 118' },
  { summary: 'BIO 150', location: 'Science Hall · Lab 2' },
  { summary: 'HIST 105', location: 'San Jacinto · 312' },
  { summary: 'BUSN 200', location: 'Stafford Hall · 230' },
  { summary: 'Lunch w/ classmates', location: 'Cafe on Almeda' },
  { summary: 'Library time', location: 'HCC Central Library' },
  { summary: 'Study group', location: 'Library · 2nd floor' },
  { summary: 'Gym session', location: 'Rec Center' },
  { summary: 'Coffee break', location: 'Cafe on Almeda' },
  { summary: 'Office hours', location: 'Workforce Bldg · Faculty Wing' },
  { summary: 'Club meeting', location: 'Student Services Center' },
  { summary: 'Volunteer hours', location: 'Project Row Houses' },
  { summary: 'Dinner w/ friends', location: 'Holman St food court' },
];

function isoOn(date, hour, minute) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildSchedule(seed) {
  const rng = makeRng(seed);
  const items = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const eventCount = isWeekend ? 1 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 2);
    const slots = [];

    for (let i = 0; i < eventCount; i += 1) {
      const startHour = 8 + Math.floor(rng() * 11); // 8a–7p
      const startMin = pick([0, 15, 30, 45]);
      const durationMin = pick([45, 60, 75, 90, 120]);

      // Avoid overlapping a previous slot too aggressively.
      const overlap = slots.some(
        (s) =>
          startHour * 60 + startMin < s.endMin &&
          startHour * 60 + startMin + durationMin > s.startMin
      );
      if (overlap && rng() < 0.6) continue;

      const activity = pick(EVENT_POOLS);
      const endDate = new Date(date);
      endDate.setHours(startHour, startMin + durationMin, 0, 0);

      slots.push({
        startMin: startHour * 60 + startMin,
        endMin: startHour * 60 + startMin + durationMin,
      });
      items.push({
        id: `seed-${seed}-${dayOffset}-${i}`,
        summary: activity.summary,
        location: activity.location,
        description: 'Activity',
        start: { dateTime: isoOn(date, startHour, startMin), timeZone: CHICAGO_TZ },
        end: { dateTime: endDate.toISOString(), timeZone: CHICAGO_TZ },
        source: 'demo',
      });
    }
  }

  return {
    kind: 'calendar#events',
    source: 'demo',
    timeZone: CHICAGO_TZ,
    updated: new Date().toISOString(),
    items,
  };
}

// --- Username generator (collision-free across the run) ---------------
function slug(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function makeUsername(first, last, used) {
  const tryNames = [
    `${slug(first)}${slug(last)}`,
    `${slug(first)}.${slug(last)}`,
    `${slug(first)}_${slug(last)}`,
    `${slug(first)}${slug(last)}${Math.floor(RNG() * 100)}`,
  ];
  for (const name of tryNames) {
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  let n = 1;
  while (true) {
    const candidate = `${slug(first)}${slug(last)}${n}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    n += 1;
  }
}

// --- Build one persona ------------------------------------------------
function buildPersona(index, anchors, used) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const username = makeUsername(first, last, used);

  const anchor = anchors[index % anchors.length];
  const homeLocation = jitterCoord(anchor);

  const interests = pickN(INTERESTS, 2 + Math.floor(RNG() * 3));
  const avatar = randomAvatar();

  // Visibility: weighted so the map feels lively but some users hide.
  const visRoll = RNG();
  const scheduleVisibility =
    visRoll < 0.6 ? 'public' : visRoll < 0.9 ? 'friends' : 'private';

  // ~55% of personas get a typed status, rest stay empty.
  const status = RNG() < 0.55 ? pick(STATUSES) : '';

  return {
    username,
    name,
    school: 'HCC Central',
    interests,
    avatar,
    schedule: buildSchedule(index + 1),
    scheduleSource: 'demo',
    scheduleVisibility,
    locationStatus: 'granted',
    status,
    homeLocation,
  };
}

// --- Example campus events --------------------------------------------
// Each entry is a template; the seed pins them to real dates relative
// to "today" and randomly picks a host + attendees from the persona pool.
const EVENT_TEMPLATES = [
  {
    name: 'CS Club kickoff mixer',
    description: 'Free pizza, intro to projects, and we’ll team up for the AI hackathon. Bring a laptop if you have one.',
    location: 'San Jacinto Memorial Building · Atrium',
    dayOffset: 1, hour: 18, minute: 0, durationHr: 2,
    goingTarget: 12,
  },
  {
    name: 'Open mic night',
    description: 'Poetry, music, comedy — anyone can sign up at the door. Coffee’s on us.',
    location: 'Heinen Theatre',
    dayOffset: 2, hour: 19, minute: 30, durationHr: 2,
    goingTarget: 18,
  },
  {
    name: 'Midterm study jam',
    description: 'Quiet hours 1–4pm, snack table on the upper level, tutors floating for math and CS.',
    location: 'HCC Central Library · 2nd floor',
    dayOffset: 3, hour: 13, minute: 0, durationHr: 4,
    goingTarget: 20,
  },
  {
    name: 'Pickup basketball',
    description: '5-on-5, rotating teams. Show up at 6pm, courts close at 8.',
    location: 'Rec Center · Court 2',
    dayOffset: 1, hour: 18, minute: 0, durationHr: 2,
    goingTarget: 10,
  },
  {
    name: 'Boba run + chill',
    description: 'Walking down to Sharetea then heading to the quad. Loose plan, low effort.',
    location: 'Meet at Bookstore on Holman',
    dayOffset: 0, hour: 16, minute: 30, durationHr: 2,
    goingTarget: 6,
  },
  {
    name: 'Volunteer at Project Row Houses',
    description: 'Helping set up the weekend community garden. Wear closed-toe shoes.',
    location: 'Project Row Houses',
    dayOffset: 5, hour: 10, minute: 0, durationHr: 3,
    goingTarget: 14,
  },
  {
    name: 'Resume + LinkedIn workshop',
    description: 'Bring your laptop and current resume — we’ll do live reviews and headshot swaps.',
    location: 'Workforce Building · Room 110',
    dayOffset: 4, hour: 15, minute: 0, durationHr: 2,
    goingTarget: 22,
  },
  {
    name: 'Movie night: Spider-Verse',
    description: 'Free popcorn, blankets recommended. Doors at 7:30.',
    location: 'Student Services Center · Theater',
    dayOffset: 2, hour: 20, minute: 0, durationHr: 2,
    goingTarget: 26,
  },
  {
    name: 'Emancipation Park 5K',
    description: 'Casual 5K loop, all paces welcome. Coffee at the finish.',
    location: 'Emancipation Park',
    dayOffset: 6, hour: 8, minute: 0, durationHr: 2,
    goingTarget: 16,
  },
  {
    name: 'Anime club marathon',
    description: 'Voting between Mob Psycho and Frieren this week. Snacks provided.',
    location: 'Learning Hub · Lounge',
    dayOffset: 3, hour: 19, minute: 0, durationHr: 3,
    goingTarget: 9,
  },
  {
    name: 'First-gen students mixer',
    description: 'Coffee, snacks, and connect with mentors who’ve been there.',
    location: 'Cafe on Almeda',
    dayOffset: 7, hour: 17, minute: 0, durationHr: 2,
    goingTarget: 11,
  },
  {
    name: 'Late-night taco run',
    description: 'Walking to Tacos & Co. after midterms. Find your group at the meeting spot.',
    location: 'Meet at HCC Auditorium',
    dayOffset: 5, hour: 22, minute: 0, durationHr: 2,
    goingTarget: 8,
  },
];

function buildEvents(personas) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];

  for (let i = 0; i < EVENT_TEMPLATES.length; i += 1) {
    const t = EVENT_TEMPLATES[i];
    const start = new Date(today);
    start.setDate(today.getDate() + t.dayOffset);
    start.setHours(t.hour, t.minute, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + Math.floor(t.durationHr));
    end.setMinutes(end.getMinutes() + Math.round((t.durationHr % 1) * 60));

    const host = personas[Math.floor(RNG() * personas.length)].username;
    // Pick `goingTarget` random attendees (always include host).
    const attendees = new Set([host]);
    const target = Math.min(t.goingTarget, personas.length);
    let safety = target * 4;
    while (attendees.size < target && safety > 0) {
      attendees.add(personas[Math.floor(RNG() * personas.length)].username);
      safety -= 1;
    }

    out.push({
      name: t.name,
      description: t.description,
      location: t.location,
      startAt: start,
      endAt: end,
      host,
      going: Array.from(attendees),
    });
  }

  return out;
}

// --- Main -------------------------------------------------------------
async function main() {
  await connectDb(process.env.MONGODB_URI);

  console.log('[seed] wiping users, friends, messages, events…');
  await Promise.all([
    User.deleteMany({}),
    Friend.deleteMany({}),
    Message.deleteMany({}),
    Event.deleteMany({}),
  ]);

  const used = new Set();
  const personas = Array.from({ length: 50 }, (_, i) =>
    buildPersona(i, HCC_ANCHORS, used)
  );

  console.log(`[seed] inserting ${personas.length} personas…`);
  await User.insertMany(personas);

  console.log('[seed] generating campus events…');
  const events = buildEvents(personas);
  await Event.insertMany(events);

  console.log('[seed] done. Sample personas:');
  for (const p of personas.slice(0, 5)) {
    console.log(
      `  · ${p.name.padEnd(22)} @${p.username.padEnd(22)} · ${p.homeLocation.label}`
    );
  }
  console.log(`[seed] inserted ${events.length} events. Sample:`);
  for (const e of events.slice(0, 5)) {
    console.log(
      `  · ${e.name.padEnd(28)} @ ${e.location.padEnd(28)} — ${e.going.length} going (host: @${e.host})`
    );
  }
  console.log('[seed] now restart the app, sign up fresh, and explore the map.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
