const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { fetchAndParseIcal } = require('../services/icalSync');

const router = express.Router();

/** Preview import (onboarding) — does not persist anything. */
router.post('/preview', async (req, res, next) => {
  try {
    const { icalUrl } = req.body || {};
    if (!icalUrl || typeof icalUrl !== 'string') {
      return res.status(400).json({ error: 'icalUrl is required' });
    }
    const { schedule, eventCount } = await fetchAndParseIcal(icalUrl.trim());
    res.json({ schedule, eventCount });
  } catch (err) {
    next(err);
  }
});

/** Save iCal URL + pull events for an existing user. */
router.post('/users/:id/connect', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { icalUrl } = req.body || {};
    if (!icalUrl || typeof icalUrl !== 'string') {
      return res.status(400).json({ error: 'icalUrl is required' });
    }

    const { schedule, eventCount } = await fetchAndParseIcal(icalUrl.trim());
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        icalFeedUrl: icalUrl.trim(),
        schedule,
        scheduleSource: 'google',
      },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user.toJSON(), eventCount });
  } catch (err) {
    next(err);
  }
});

/** Re-pull events using the stored iCal URL. */
router.post('/users/:id/sync', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const user = await User.findById(req.params.id).select('+icalFeedUrl');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.icalFeedUrl) {
      return res.status(400).json({
        error: 'No Google Calendar linked. Connect your calendar first.',
      });
    }

    const { schedule, eventCount } = await fetchAndParseIcal(user.icalFeedUrl);
    user.schedule = schedule;
    user.scheduleSource = 'google';
    await user.save();
    res.json({ ...user.toJSON(), eventCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
