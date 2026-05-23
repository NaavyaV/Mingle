const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateUsername } = require('../utils/username');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean({ getters: true });
    res.json(users.map((u) => ({ ...u, _id: u._id.toString() })));
  } catch (err) {
    next(err);
  }
});

router.get('/by-username/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      school,
      interests,
      schedule,
      scheduleSource,
      icalFeedUrl,
      scheduleVisibility,
      locationStatus,
      avatar,
      status,
      username: providedUsername,
    } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    const username = providedUsername
      ? providedUsername.toLowerCase()
      : await generateUsername(name, async (candidate) => {
          const exists = await User.exists({ username: candidate });
          return !!exists;
        });

    const user = await User.create({
      username,
      name,
      school: school || null,
      interests: Array.isArray(interests) ? interests : [],
      schedule: schedule || null,
      scheduleSource: scheduleSource || null,
      icalFeedUrl: icalFeedUrl || null,
      scheduleVisibility: scheduleVisibility || 'friends',
      locationStatus: locationStatus || 'pending',
      avatar: avatar || null,
      status: typeof status === 'string' ? status : '',
    });

    res.status(201).json(user.toJSON());
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, _id: req.params.id });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const patch = req.body || {};
    delete patch._id;
    delete patch.username;
    const user = await User.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
