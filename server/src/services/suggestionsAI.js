/**
 * Gemini-powered hangout suggestion service for the map tooltip.
 *
 * Why server-side: the Gemini API key must never ship in the Expo
 * bundle. The client posts {username, seed} → this service loads the
 * viewer, their friends, and up to N interest-matched recommended
 * users, derives compact FREE WINDOWS in the next 48 hours for each,
 * then asks `gemini-3.1-flash-lite` (Google's cheapest 2026 model:
 * $0.25/$1.50 per 1M tokens, generous free tier) to write one short
 * suggestion line.
 *
 * Token-efficiency notes (v2):
 *  - Prompt is plain text, not JSON. No key names, no escaping.
 *  - We pre-compute free intervals so the model never sees raw events.
 *  - Free intervals are expressed in 0-47 hour offsets from "now"
 *    (e.g. "3-6,22-27") — 2-3 chars per window, no ISO timestamps.
 *  - Hard cap: 3 friends + 3 recommended people.
 *  - Rules block trimmed to ~8 short lines.
 * In practice this puts each call around ~200-300 input tokens.
 *
 * Failure mode (no API key, network error, malformed response, etc.)
 * throws — the route logs it and returns 502 so the client can fall
 * back to its built-in rules-based picker.
 */

const User = require('../models/User');
const Friend = require('../models/Friend');

const MODEL = 'gemini-3.1-flash-lite';
const ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// People caps applied AFTER scoring (friends first, then recommended).
const MAX_FRIENDS = 3;
const MAX_RECOMMENDED = 3;

// Look-ahead window. Free time is encoded as integer hour offsets
// from "now" (rounded to half-hours), so 48h fits in two digits.
const LOOKAHEAD_HOURS = 48;
const SOCIAL_START_H = 9;
const SOCIAL_END_H = 22;
const MIN_FREE_BLOCK_MIN = 45;
const HOUR_MS = 3600 * 1000;
const ALL_DAY_MS = 18 * HOUR_MS;

// Busy events shown to the model so it can say what each person is
// up to. Caps keep the prompt small: max 4 events per person, titles
// trimmed to TITLE_MAX chars.
const MAX_BUSY_PER_USER = 4;
const TITLE_MAX = 18;

// Visual cap on the model's output — well below the tooltip's
// soft-wrap limit so we never need to rely on auto-shrinking.
const MAX_TIP_CHARS = 120;

function busyIntervals(items, fromMs, toMs) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const e of items) {
    const s = new Date(e?.start?.dateTime).getTime();
    const en = new Date(e?.end?.dateTime).getTime();
    if (Number.isNaN(s) || Number.isNaN(en)) continue;
    if (en <= fromMs || s >= toMs) continue;
    if (en - s >= ALL_DAY_MS) continue;
    out.push([Math.max(s, fromMs), Math.min(en, toMs)]);
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const iv of out) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else merged.push([iv[0], iv[1]]);
  }
  return merged;
}

// Returns the day's [start, end] social window in ms, clipped to "now"
// (so a day already underway only shows hours still to come).
function socialWindow(now, dayOffset) {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(SOCIAL_START_H, 0, 0, 0);
  const start = Math.max(d.getTime(), now.getTime());
  const end = new Date(d);
  end.setHours(SOCIAL_END_H, 0, 0, 0);
  return [start, end.getTime()];
}

// Subtract busy from the social window → free intervals ≥ MIN.
function freeIntervals(items, winStart, winEnd) {
  const busy = busyIntervals(items, winStart, winEnd);
  const free = [];
  let cursor = winStart;
  for (const [s, e] of busy) {
    if (s > cursor) free.push([cursor, s]);
    if (e > cursor) cursor = e;
  }
  if (cursor < winEnd) free.push([cursor, winEnd]);
  return free.filter(([s, e]) => e - s >= MIN_FREE_BLOCK_MIN * 60 * 1000);
}

// Encode a single interval as "Hs-He" where H = integer hours from
// nowMs (rounded to nearest 0.5 hour). Compact and good enough for
// the model to plan around — actual datetime formatting happens in
// its rendered output (it doesn't need ISO precision).
function encodeIv(iv, nowMs) {
  const round = (ms) => Math.round(((ms - nowMs) / HOUR_MS) * 2) / 2;
  const a = round(iv[0]);
  const b = round(iv[1]);
  const fmt = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  return `${fmt(a)}-${fmt(b)}`;
}

function encodeFreeWindows(items, now) {
  const nowMs = now.getTime();
  const out = [];
  for (let d = 0; d < Math.ceil(LOOKAHEAD_HOURS / 24); d++) {
    const [ws, we] = socialWindow(now, d);
    if (we <= ws) continue;
    for (const iv of freeIntervals(items, ws, we)) {
      out.push(encodeIv(iv, nowMs));
    }
  }
  return out;
}

// Tighten event titles down to TITLE_MAX chars + strip prompt-format
// metacharacters so they don't break the line layout the model relies
// on (`|` separates fields, `,` separates entries).
function tidyTitle(raw) {
  if (!raw) return 'Busy';
  let s = String(raw).replace(/[|,\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return 'Busy';
  if (s.length > TITLE_MAX) s = s.slice(0, TITLE_MAX).trim();
  return s;
}

// Returns busy events inside the social windows as
// `[ "<start>-<end> <title>", ... ]` strings using the same hour-offset
// encoding as free intervals. Capped to MAX_BUSY_PER_USER so even a
// densely-booked calendar adds only ~80 chars.
function encodeBusyWithTitles(items, now) {
  if (!Array.isArray(items)) return [];
  const nowMs = now.getTime();
  // Union of all social windows we care about (today + tomorrow).
  const windows = [];
  for (let d = 0; d < Math.ceil(LOOKAHEAD_HOURS / 24); d++) {
    const w = socialWindow(now, d);
    if (w[1] > w[0]) windows.push(w);
  }
  if (!windows.length) return [];
  const minMs = windows[0][0];
  const maxMs = windows[windows.length - 1][1];

  const out = [];
  for (const e of items) {
    const s = new Date(e?.start?.dateTime).getTime();
    const en = new Date(e?.end?.dateTime).getTime();
    if (Number.isNaN(s) || Number.isNaN(en)) continue;
    if (en - s >= ALL_DAY_MS) continue;
    if (en <= minMs || s >= maxMs) continue;
    // Keep only events that intersect at least one social window —
    // a 3am study session isn't useful context for "let's hang out".
    const hits = windows.some(([ws, we]) => en > ws && s < we);
    if (!hits) continue;
    const ivS = Math.max(s, minMs);
    const ivE = Math.min(en, maxMs);
    out.push({
      iv: [ivS, ivE],
      title: tidyTitle(e.summary),
      sortKey: s,
    });
  }
  out.sort((a, b) => a.sortKey - b.sortKey);
  return out
    .slice(0, MAX_BUSY_PER_USER)
    .map((x) => `${encodeIv(x.iv, nowMs)} ${x.title}`);
}

function firstName(u) {
  return (u?.name || u?.username || '').split(' ')[0];
}

async function loadFriendUsernames(username) {
  const rows = await Friend.find({
    $or: [{ requester: username }, { recipient: username }],
    status: 'accepted',
  })
    .select('requester recipient status')
    .lean();
  return Array.from(
    new Set(
      rows.map((r) => (r.requester === username ? r.recipient : r.requester))
    )
  );
}

function pickRecommended(me, others, friendSet) {
  const myInterests = new Set(
    (me.interests || []).map((s) => String(s).toLowerCase())
  );
  if (myInterests.size === 0) return [];
  const scored = [];
  for (const u of others) {
    if (!u?.username) continue;
    if (u.username === me.username) continue;
    if (friendSet.has(u.username)) continue;
    const shared = (u.interests || []).filter((i) =>
      myInterests.has(String(i).toLowerCase())
    );
    if (shared.length === 0) continue;
    scored.push({ user: u, sharedCount: shared.length, shared });
  }
  scored.sort(
    (a, b) =>
      b.sharedCount - a.sharedCount ||
      a.user.username.localeCompare(b.user.username)
  );
  return scored.slice(0, MAX_RECOMMENDED);
}

function buildPrompt({ me, friends, recommended, seed, now }) {
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  const myInterests = new Set(
    (me.interests || []).map((s) => String(s).toLowerCase())
  );

  // One compact line per person:
  //   "F Sarah | coffee,gym | f:5-8,22-26 | b:0-1 CS220,8-10 Lab"
  // where f: = free hour-offsets, b: = busy hour-offsets with the
  // event title. The busy segment is included so the model can name
  // what each person is doing (e.g. "after Sarah's lab at 4PM").
  const lines = [];

  const formatPerson = (tag, displayName, interestsStr, items) => {
    const free = encodeFreeWindows(items, now);
    const busy = encodeBusyWithTitles(items, now);
    const parts = [tag + ' ' + displayName, interestsStr];
    parts.push(free.length ? `f:${free.join(',')}` : 'f:none');
    if (busy.length) parts.push(`b:${busy.join(',')}`);
    return parts.join(' | ');
  };

  lines.push(
    formatPerson(
      'Me',
      firstName(me),
      (me.interests || []).slice(0, 6).join(','),
      me.schedule?.items
    )
  );

  for (const f of friends.slice(0, MAX_FRIENDS)) {
    const free = encodeFreeWindows(f.schedule?.items, now);
    if (!free.length) continue;
    const shared = (f.interests || []).filter((i) =>
      myInterests.has(String(i).toLowerCase())
    );
    const interestsStr =
      shared.slice(0, 4).join(',') ||
      (f.interests || []).slice(0, 2).join(',');
    lines.push(formatPerson('F', firstName(f), interestsStr, f.schedule?.items));
  }
  for (const r of recommended) {
    const free = encodeFreeWindows(r.user.schedule?.items, now);
    if (!free.length) continue;
    lines.push(
      formatPerson(
        'R',
        firstName(r.user),
        r.shared.slice(0, 4).join(','),
        r.user.schedule?.items
      )
    );
  }

  // Ultra-terse rules. Each instruction has been pared to the minimum
  // text needed to keep the output on-brand. ~200 tokens for the
  // whole prompt incl. data on a typical pool.
  const rules = [
    `Now: ${dow}. Times below are HOURS FROM NOW (e.g. "3-6" = 3h to 6h from now).`,
    `Each line: <tag> <Name> | interests | f:<free windows> | b:<busy windows w/ titles>`,
    `Write ONE hangout suggestion <=${MAX_TIP_CHARS} chars for Me.`,
    `Pick someone (F = friend, prefer; R = recommended) whose f: overlaps Me's f: by >=45min.`,
    `You MAY reference what someone is doing from their b: titles (e.g. "after Sarah's Lab", "between your CS220 and Gym"). Skip if it's not relevant.`,
    `Convert hour-offsets to wall-clock 12h time ("3PM", "10:30AM") and use "today"/"tomorrow"/weekday.`,
    `Format A: "You're free <day> <X-Y>. You should hang out with <Name> from <A-B>."`,
    `Format B (>=2 names + shared interest with a verb): "You should <verb> with <N1> & <N2> <day> at <Time>."`,
    `Verbs: coffee=grab coffee, gym=hit the gym, coding=co-work, basketball=shoot hoops, hiking=hike, music=jam, gaming=game, cooking=cook, running=run, yoga=do yoga. Otherwise format A.`,
    `Use first names. No emojis, quotes, markdown, ellipsis. Output the sentence only.`,
    `Variation seed=${seed}.`,
  ].join('\n');

  return `${rules}\n\n${lines.join('\n')}`;
}

async function callGemini(prompt, apiKey) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      // 80 tokens = ~320 chars, comfortably > MAX_TIP_CHARS.
      maxOutputTokens: 80,
      responseMimeType: 'text/plain',
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(`${ENDPOINT(MODEL)}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`gemini http ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`gemini returned non-JSON: ${text.slice(0, 200)}`);
  }
  const candidate = parsed?.candidates?.[0];
  const out =
    candidate?.content?.parts
      ?.map((p) => p?.text)
      .filter(Boolean)
      .join('')
      .trim() || '';
  if (!out) {
    throw new Error(
      `gemini returned empty text (finishReason=${candidate?.finishReason || 'unknown'})`
    );
  }
  return { text: out, usage: parsed?.usageMetadata || null };
}

function sanitizeTip(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/^[`"'"'']+|[`"'"'']+$/g, '');
  s = s.replace(/\s*\n+\s*/g, ' ').trim();
  s = s.replace(/^(suggestion|tip|here'?s a suggestion)\s*[:\-—]\s*/i, '');
  s = s.replace(/[…\.\s]+$/, (m) => (m.includes('.') ? '.' : ''));
  if (s.length > MAX_TIP_CHARS) {
    const cut = s.slice(0, MAX_TIP_CHARS);
    const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '));
    s = lastDot > 40 ? cut.slice(0, lastDot + 1) : cut.trim();
  }
  return s || null;
}

async function generateMapSuggestion({ username, seed = 0, now = new Date() }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set on the server');
  if (!username) throw new Error('username is required');

  // Only pull the fields we actually use into the prompt.
  const projection = 'username name interests schedule.items';

  const me = await User.findOne({ username }).select(projection).lean();
  if (!me) throw new Error(`user not found: ${username}`);

  const friendUsernames = await loadFriendUsernames(username);
  const friendSet = new Set(friendUsernames);

  // Friends first; bring the whole list (cap on serialization side).
  const friends = friendUsernames.length
    ? await User.find({ username: { $in: friendUsernames } })
        .select(projection)
        .lean()
    : [];

  // Pool for recommended: only people who share at least one interest.
  // Matching at the DB layer keeps this O(small) and we never even
  // load schedules for people we'd discard.
  const myInterestsArr = (me.interests || []).filter(Boolean);
  const pool = myInterestsArr.length
    ? await User.find({
        username: { $nin: [username, ...friendUsernames] },
        interests: { $in: myInterestsArr },
      })
        .select(projection)
        .limit(30)
        .lean()
    : [];
  const recommended = pickRecommended(me, pool, friendSet);

  const prompt = buildPrompt({ me, friends, recommended, seed, now });
  const promptChars = prompt.length;

  const { text: raw, usage } = await callGemini(prompt, apiKey);
  const tip = sanitizeTip(raw);
  if (!tip) throw new Error('gemini output was empty after sanitization');

  const tokens = usage
    ? {
        prompt: usage.promptTokenCount,
        output: usage.candidatesTokenCount,
        total: usage.totalTokenCount,
      }
    : null;

  // Loud single-line log per call so it's easy to spot in the server
  // terminal alongside other request logs.
  console.log(
    `[suggestions] model=${MODEL} user=${username} seed=${seed} ` +
      `friends=${friends.length} recommended=${recommended.length} ` +
      `promptChars=${promptChars} ` +
      (tokens
        ? `tokens(in/out/total)=${tokens.prompt}/${tokens.output}/${tokens.total}`
        : 'tokens=unknown')
  );

  return {
    text: tip,
    source: 'gemini',
    model: MODEL,
    meta: {
      friendCount: friends.length,
      recommendedCount: recommended.length,
      promptChars,
      tokens,
    },
  };
}

module.exports = { generateMapSuggestion, MAX_TIP_CHARS, MODEL };
