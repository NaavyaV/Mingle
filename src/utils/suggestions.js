/**
 * Map tooltip suggestion engine.
 *
 * Looks at the viewer's calendar plus a candidate pool (friends and/or
 * interest-matched recommended users) over the next ~48 hours and
 * produces a single human-readable tip:
 *
 *   "You should grab coffee with Sarah & Mike tomorrow at 3PM."
 *   "You're free tomorrow 2PM - 5PM. You should hang out with Sarah
 *    from 2PM - 4PM."
 *   "You're free today 6PM - 9PM. Hop on the map and find people
 *    nearby!"
 *
 * Callers vary `seed` to cycle through different tips on refresh
 * without re-fetching anything.
 */

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Daytime "social window" — we don't suggest meeting at 4am. Tunable.
const SOCIAL_START_H = 9;
const SOCIAL_END_H = 22;

// Minimum slot lengths.
const MIN_GROUP_OVERLAP_MS = 60 * 60 * 1000; // 1h for activities w/ multiple people
const MIN_PAIR_OVERLAP_MS = 45 * 60 * 1000; // 45m one-on-one
const MIN_SOLO_FREE_MS = 60 * 60 * 1000; // 1h fallback "you're free…"

// Anything ≥18h long counts as an all-day event and is ignored when
// computing busyness — same rule the rest of the app uses for the
// presence indicator.
const ALL_DAY_THRESHOLD_MS = 18 * HOUR_MS;

// Activity verbs keyed off normalized interest strings. Anything not
// listed falls back to a generic "hang out".
const ACTIVITY_BY_INTEREST = {
  coffee: 'grab coffee',
  tea: 'grab tea',
  cooking: 'cook something',
  gym: 'hit the gym',
  yoga: 'do yoga',
  running: 'go for a run',
  cycling: 'go for a ride',
  hiking: 'go on a hike',
  climbing: 'go climbing',
  skating: 'go skating',
  basketball: 'shoot some hoops',
  soccer: 'kick a ball around',
  volleyball: 'play volleyball',
  dance: 'go dancing',
  gaming: 'game',
  coding: 'co-work on a project',
  music: 'jam',
  movies: 'catch a movie',
  anime: 'watch anime',
  reading: 'read together',
  photography: 'take some photos',
  art: 'make some art',
  design: 'sketch some ideas',
  theatre: 'catch a show',
  volunteering: 'volunteer',
  politics: 'debate politics',
  entrepreneurship: 'talk shop',
  startups: 'brainstorm startup ideas',
  science: 'nerd out on science',
  math: 'work through some problems',
  'ai / ml': 'hack on an AI side-project',
  languages: 'practice languages',
  travel: 'plan a trip',
  pets: 'take the pets out',
};

function activityFor(interest) {
  if (!interest) return null;
  return ACTIVITY_BY_INTEREST[String(interest).toLowerCase()] || null;
}

function firstName(u) {
  const n = u?.name || u?.username || '';
  return n.split(' ')[0];
}

function joinNames(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return m === 0
    ? `${h12}${period}`
    : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

function dayLabel(date, now) {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / DAY_MS);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return target.toLocaleDateString(undefined, { weekday: 'long' });
}

// Returns the [start, end] ms range of the social window on day-offset
// (0 = today, 1 = tomorrow), clipped to `now` if it has already begun.
function socialWindowOn(now, dayOffset) {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(SOCIAL_START_H, 0, 0, 0);
  const start = Math.max(d.getTime(), now.getTime());
  const endDate = new Date(d);
  endDate.setHours(SOCIAL_END_H, 0, 0, 0);
  return [start, endDate.getTime()];
}

function busyIntervals(user, rangeStart, rangeEnd) {
  const items = Array.isArray(user?.schedule?.items)
    ? user.schedule.items
    : [];
  const out = [];
  for (const e of items) {
    const s = new Date(e?.start?.dateTime).getTime();
    const en = new Date(e?.end?.dateTime).getTime();
    if (Number.isNaN(s) || Number.isNaN(en)) continue;
    if (en <= rangeStart || s >= rangeEnd) continue;
    if (en - s >= ALL_DAY_THRESHOLD_MS) continue;
    out.push([Math.max(s, rangeStart), Math.min(en, rangeEnd)]);
  }
  out.sort((a, b) => a[0] - b[0]);
  // Merge overlapping intervals so the inverse (free) is contiguous.
  const merged = [];
  for (const iv of out) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) {
      last[1] = Math.max(last[1], iv[1]);
    } else {
      merged.push([iv[0], iv[1]]);
    }
  }
  return merged;
}

function freeIntervals(user, rangeStart, rangeEnd, minMs = 30 * 60 * 1000) {
  if (rangeEnd <= rangeStart) return [];
  const busy = busyIntervals(user, rangeStart, rangeEnd);
  const out = [];
  let cursor = rangeStart;
  for (const [s, e] of busy) {
    if (s > cursor) out.push([cursor, s]);
    if (e > cursor) cursor = e;
  }
  if (cursor < rangeEnd) out.push([cursor, rangeEnd]);
  return out.filter((iv) => iv[1] - iv[0] >= minMs);
}

// Classical sorted-interval intersection.
function intersect(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const s = Math.max(a[i][0], b[j][0]);
    const e = Math.min(a[i][1], b[j][1]);
    if (s < e) out.push([s, e]);
    if (a[i][1] < b[j][1]) i++;
    else j++;
  }
  return out;
}

function longestSlot(intervals) {
  let best = null;
  for (const iv of intervals) {
    if (!best || iv[1] - iv[0] > best[1] - best[0]) best = iv;
  }
  return best;
}

// The viewer's free block that fully contains `slot` — used so we can
// say "you're free X-Y" (the wider block) and "hang out from A-B" (the
// narrower overlap) without re-deriving the wider one.
function enclosing(intervals, slot) {
  for (const iv of intervals) {
    if (iv[0] <= slot[0] && iv[1] >= slot[1]) return iv;
  }
  return slot;
}

// Aim for at least this many distinct suggestions cycling through
// the refresh button so the tooltip never feels repetitive.
const RESERVE_TARGET = 10;
// Hard cap on how many suggestions we ever keep so the pool doesn't
// blow up at 50+ candidates.
const POOL_CAP = 40;

function buildGroupSuggestions(me, candidates, ranges, myFreeByDay, myInterests) {
  const out = [];
  for (let d = 0; d < ranges.length; d++) {
    const [rs, re] = ranges[d];
    const myFree = myFreeByDay[d];
    if (!myFree.length) continue;

    const byInterest = new Map();
    for (const c of candidates) {
      const shared = (c.user.interests || []).filter((i) =>
        myInterests.has(String(i).toLowerCase())
      );
      for (const i of shared) {
        const k = String(i).toLowerCase();
        if (!byInterest.has(k)) byInterest.set(k, []);
        byInterest.get(k).push(c);
      }
    }

    for (const [interestKey, group] of byInterest) {
      const act = activityFor(interestKey);
      if (!act || group.length < 2) continue;

      // Try the full group first, then progressively drop members so
      // we still surface a viable activity if one person is busy. This
      // also generates more distinct suggestions for the refresh pool.
      const sorted = [...group].sort(
        (a, b) => Number(b.isFriend) - Number(a.isFriend)
      );
      const sizes = new Set([sorted.length, Math.max(2, sorted.length - 1), 2]);
      for (const size of sizes) {
        if (size < 2 || size > sorted.length) continue;
        const sub = sorted.slice(0, size);
        let common = myFree;
        for (const g of sub) {
          common = intersect(common, freeIntervals(g.user, rs, re));
          if (!common.length) break;
        }
        if (!common.length) continue;
        const slot = longestSlot(common);
        if (!slot || slot[1] - slot[0] < MIN_GROUP_OVERLAP_MS) continue;

        const friendCount = sub.filter((g) => g.isFriend).length;
        out.push({
          kind: 'group',
          slot,
          interest: interestKey,
          people: sub.map((g) => g.user),
          friendCount,
          // Higher = sorts to the top of the reserve list. Friends
          // and bigger groups + earlier slots win.
          quality:
            500 +
            friendCount * 50 +
            sub.length * 20 -
            d * 5 -
            (slot[0] - rs) / HOUR_MS,
        });
      }
    }
  }
  return out;
}

function buildPairSuggestions(me, candidates, ranges, myFreeByDay) {
  const out = [];
  for (let d = 0; d < ranges.length; d++) {
    const [rs, re] = ranges[d];
    const myFree = myFreeByDay[d];
    if (!myFree.length) continue;
    for (const c of candidates) {
      const theirFree = freeIntervals(c.user, rs, re);
      if (!theirFree.length) continue;
      const common = intersect(myFree, theirFree);
      if (!common.length) continue;
      const slot = longestSlot(common);
      if (!slot || slot[1] - slot[0] < MIN_PAIR_OVERLAP_MS) continue;
      const lengthHrs = (slot[1] - slot[0]) / HOUR_MS;
      out.push({
        kind: 'pair',
        slot,
        person: c.user,
        myFreeBlock: enclosing(myFree, slot),
        isFriend: c.isFriend,
        quality:
          300 +
          (c.isFriend ? 60 : 0) +
          Math.min(lengthHrs, 6) * 8 -
          d * 5 -
          (slot[0] - rs) / HOUR_MS,
      });
    }
  }
  return out;
}

function buildSoloSuggestions(me, ranges) {
  const out = [];
  for (let d = 0; d < ranges.length; d++) {
    const [rs, re] = ranges[d];
    const myFree = freeIntervals(me, rs, re, MIN_SOLO_FREE_MS);
    for (const slot of myFree) {
      out.push({
        kind: 'free',
        slot,
        quality: 100 - d * 10 - (slot[0] - rs) / HOUR_MS,
      });
    }
  }
  return out;
}

function renderSuggestion(s, now) {
  if (s.kind === 'group') {
    const names = s.people.slice(0, 3).map(firstName);
    const day = dayLabel(s.slot[0], now);
    const time = formatTime(s.slot[0]);
    return `You should ${activityFor(s.interest)} with ${joinNames(names)} ${day} at ${time}.`;
  }
  if (s.kind === 'pair') {
    const myStr = `${formatTime(s.myFreeBlock[0])} - ${formatTime(s.myFreeBlock[1])}`;
    const overlapStr = `${formatTime(s.slot[0])} - ${formatTime(s.slot[1])}`;
    const day = dayLabel(s.myFreeBlock[0], now);
    return `You're free ${day} ${myStr}. You should hang out with ${firstName(s.person)} from ${overlapStr}.`;
  }
  // 'free'
  const day = dayLabel(s.slot[0], now);
  const range = `${formatTime(s.slot[0])} - ${formatTime(s.slot[1])}`;
  return `You're free ${day} ${range}. Hop on the map and find people nearby!`;
}

/**
 * @param {object} args
 * @param {object} args.me            - viewer user object (with schedule + interests)
 * @param {object[]} args.friends     - user objects who are already friends
 * @param {object[]} args.recommended - user objects who share an interest but aren't friends
 * @param {Date}   [args.now]
 * @param {number} [args.seed]        - bumped on refresh to cycle through the reserve pool
 * @returns {{ text: string, kind: 'group'|'pair'|'free' } | null}
 */
export function pickMapSuggestion({
  me,
  friends = [],
  recommended = [],
  now = new Date(),
  seed = 0,
}) {
  if (!me) return null;

  // Look at today + tomorrow's social windows (the "next 2 days").
  const ranges = [
    socialWindowOn(now, 0),
    socialWindowOn(now, 1),
  ].filter(([s, e]) => e > s);
  if (ranges.length === 0) return null;

  const myFreeByDay = ranges.map(([s, e]) =>
    freeIntervals(me, s, e, MIN_PAIR_OVERLAP_MS)
  );

  // Friends > recommended priority. The flag lets the quality
  // scorer push friend-based suggestions to the top of the pool.
  const candidates = [
    ...friends.map((u) => ({ user: u, isFriend: true })),
    ...recommended.map((u) => ({ user: u, isFriend: false })),
  ].filter((c) => c.user && c.user.username && c.user.username !== me.username);

  const myInterests = new Set(
    (me.interests || []).map((s) => String(s).toLowerCase())
  );

  // Collect every viable suggestion across all kinds — group, pair,
  // solo — then rank them together. This gives a single deep reserve
  // pool the refresh button can cycle through instead of being
  // capped at e.g. the top 5 of one bucket.
  const all = [
    ...buildGroupSuggestions(me, candidates, ranges, myFreeByDay, myInterests),
    ...buildPairSuggestions(me, candidates, ranges, myFreeByDay),
    ...buildSoloSuggestions(me, ranges),
  ];

  // De-duplicate identical lines (e.g. two-person group + pair can
  // collapse) so the reserve count reflects unique tips.
  const seen = new Set();
  const unique = [];
  for (const s of all) {
    const text = renderSuggestion(s, now);
    if (seen.has(text)) continue;
    seen.add(text);
    unique.push({ ...s, text });
  }

  if (!unique.length) return null;

  unique.sort((a, b) => b.quality - a.quality);

  // Reserve at least RESERVE_TARGET distinct picks when available so
  // the refresh button always feels lively; cap so we don't churn
  // memory on huge candidate pools.
  const poolSize = Math.min(
    POOL_CAP,
    Math.max(RESERVE_TARGET, unique.length)
  );
  const pool = unique.slice(0, poolSize);
  const pick = pool[Math.abs(seed) % pool.length];
  return { kind: pick.kind, text: pick.text };
}
