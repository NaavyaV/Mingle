const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

const norm = (s) => String(s || '').toLowerCase().trim();

const sortPair = (a, b) => (a < b ? [a, b] : [b, a]);

/**
 * GET /api/messages/conversations/:username
 * Returns a list of conversation summaries for `username`, newest first.
 * Each item: { other, lastMessage, unread }.
 */
router.get('/conversations/:username', async (req, res, next) => {
  try {
    const me = norm(req.params.username);
    const all = await Message.find({ $or: [{ from: me }, { to: me }] })
      .sort({ createdAt: -1 })
      .lean();

    const seen = new Map();
    for (const m of all) {
      const other = m.from === me ? m.to : m.from;
      if (!seen.has(other)) seen.set(other, { other, lastMessage: m, unread: 0 });
    }
    for (const m of all) {
      const other = m.from === me ? m.to : m.from;
      const entry = seen.get(other);
      if (m.to === me && !(m.readBy || []).includes(me)) entry.unread += 1;
    }

    res.json(Array.from(seen.values()));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages/thread?me=...&other=...
 * Returns the full message thread between `me` and `other`, oldest first.
 * Also marks the thread as read for `me` as a side effect.
 */
router.get('/thread', async (req, res, next) => {
  try {
    const me = norm(req.query?.me);
    const other = norm(req.query?.other);
    if (!me || !other) return res.status(400).json({ message: 'me and other required' });

    const [a, b] = sortPair(me, other);
    const msgs = await Message.find({
      $or: [
        { from: a, to: b },
        { from: b, to: a },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    await Message.updateMany(
      { to: me, from: other, readBy: { $ne: me } },
      { $addToSet: { readBy: me } }
    );

    res.json(msgs);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/messages
 * body: { from, to, kind?, body?, eventId? }
 */
router.post('/', async (req, res, next) => {
  try {
    const from = norm(req.body?.from);
    const to = norm(req.body?.to);
    const kind = req.body?.kind || 'text';
    const body = (req.body?.body || '').toString();
    const eventId = req.body?.eventId || null;

    if (!from || !to) return res.status(400).json({ message: 'from and to required' });
    if (kind === 'text' && !body.trim()) {
      return res.status(400).json({ message: 'body required for text messages' });
    }

    const doc = await Message.create({
      from,
      to,
      kind,
      body,
      eventId,
      readBy: [from],
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
