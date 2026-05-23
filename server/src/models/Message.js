const mongoose = require('mongoose');

/**
 * A direct message between two users.
 *
 * `kind`:
 *   - 'text'        plain text body.
 *   - 'eventInvite' body is ignored; eventId points at the embedded event card.
 *
 * `readBy` keeps track of which usernames have already opened the thread
 * past this message, used to compute unread counts on the conversation list.
 */
const MessageSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, lowercase: true, trim: true },
    to: { type: String, required: true, lowercase: true, trim: true },
    kind: { type: String, enum: ['text', 'eventInvite'], default: 'text' },
    body: { type: String, default: '' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

MessageSchema.index({ from: 1, to: 1, createdAt: -1 });
MessageSchema.index({ to: 1, from: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
