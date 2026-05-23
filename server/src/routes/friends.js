const express = require('express');
const Friend = require('../models/Friend');

const router = express.Router();

const norm = (s) => String(s || '').toLowerCase().trim();

/**
 * GET /api/friends/:username
 * Returns the relationship view for `username`:
 *   - friends:  usernames of accepted friends
 *   - incoming: usernames who have requested to friend me (pending)
 *   - outgoing: usernames I have requested (pending)
 */
router.get('/:username', async (req, res, next) => {
  try {
    const me = norm(req.params.username);
    const rows = await Friend.find({
      $or: [{ requester: me }, { recipient: me }],
    }).lean();

    const friends = [];
    const incoming = [];
    const outgoing = [];

    for (const r of rows) {
      const other = r.requester === me ? r.recipient : r.requester;
      if (r.status === 'accepted') friends.push(other);
      else if (r.status === 'pending') {
        if (r.requester === me) outgoing.push(other);
        else incoming.push(other);
      }
    }

    res.json({ friends, incoming, outgoing });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/friends/request
 * body: { from, to }
 * Immediately creates (or upgrades) an accepted friendship. This is an
 * intentional simplification for the hackathon demo so there's no
 * approval step — tapping "Add friend" makes you friends right away.
 * Idempotent: calling repeatedly returns the existing accepted row.
 */
router.post('/request', async (req, res, next) => {
  try {
    const from = norm(req.body?.from);
    const to = norm(req.body?.to);
    if (!from || !to) return res.status(400).json({ message: 'from and to required' });
    if (from === to) return res.status(400).json({ message: 'cannot friend yourself' });

    const existing = await Friend.findOne({
      $or: [
        { requester: from, recipient: to },
        { requester: to, recipient: from },
      ],
    });
    if (existing) {
      if (existing.status !== 'accepted') {
        existing.status = 'accepted';
        await existing.save();
      }
      return res.json(existing);
    }

    const doc = await Friend.create({ requester: from, recipient: to, status: 'accepted' });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/friends/accept
 * body: { me, other }
 * Accept an incoming request from `other` to `me`.
 */
router.post('/accept', async (req, res, next) => {
  try {
    const me = norm(req.body?.me);
    const other = norm(req.body?.other);
    const doc = await Friend.findOneAndUpdate(
      { requester: other, recipient: me, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'no pending request' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/friends
 * body: { me, other }
 * Cancels an outgoing request, declines an incoming one, or unfriends.
 */
router.delete('/', async (req, res, next) => {
  try {
    const me = norm(req.body?.me);
    const other = norm(req.body?.other);
    await Friend.deleteOne({
      $or: [
        { requester: me, recipient: other },
        { requester: other, recipient: me },
      ],
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
