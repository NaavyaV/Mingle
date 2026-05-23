const mongoose = require('mongoose');

/**
 * Campus / friend-hosted event.
 *
 *   host:    username of whoever created it. May also be a college org name
 *            (e.g. "HCC") for college-wide events.
 *   going:   array of usernames that have marked themselves as attending.
 */
const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, default: null },
    host: { type: String, required: true, lowercase: true, trim: true, index: true },
    going: { type: [String], default: [] },
  },
  { timestamps: true }
);

EventSchema.index({ startAt: 1 });

module.exports = mongoose.model('Event', EventSchema);
