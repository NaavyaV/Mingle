const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');

const router = express.Router();

const norm = (s) => String(s || '').toLowerCase().trim();

/**
 * GET /api/events
 * Lists upcoming events, soonest first. Past events are filtered out.
 */
router.get('/', async (_req, res, next) => {
  try {
    const events = await Event.find({ startAt: { $gte: new Date(Date.now() - 6 * 3600e3) } })
      .sort({ startAt: 1 })
      .lean();
    res.json(events);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/events/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'invalid id' });
    }
    const e = await Event.findById(req.params.id).lean();
    if (!e) return res.status(404).json({ message: 'not found' });
    res.json(e);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/events
 * body: { name, description, location, startAt, endAt, host }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description = '', location = '', startAt, endAt = null, host } = req.body || {};
    if (!name || !startAt || !host) {
      return res.status(400).json({ message: 'name, startAt, and host required' });
    }
    const doc = await Event.create({
      name: String(name).trim(),
      description: String(description),
      location: String(location),
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      host: norm(host),
      going: [norm(host)],
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/events/:id/going
 * body: { username, going: true|false }
 * Toggles whether `username` is on the going list.
 */
router.post('/:id/going', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'invalid id' });
    }
    const username = norm(req.body?.username);
    if (!username) return res.status(400).json({ message: 'username required' });
    const op = req.body?.going === false
      ? { $pull: { going: username } }
      : { $addToSet: { going: username } };
    const doc = await Event.findByIdAndUpdate(req.params.id, op, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
