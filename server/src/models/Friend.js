const mongoose = require('mongoose');

/**
 * Friendship between two users.
 *
 *   status: 'pending'  ->  `requester` asked `recipient` to be friends.
 *   status: 'accepted' ->  Both are now friends.
 *
 * We normalize the pair so there can only ever be one document per
 * (requester, recipient) ordered pair. To query "is X friends with Y?"
 * we always look for either {requester:X, recipient:Y} or the reverse.
 */
const FriendSchema = new mongoose.Schema(
  {
    requester: { type: String, required: true, index: true, lowercase: true, trim: true },
    recipient: { type: String, required: true, index: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('Friend', FriendSchema);
