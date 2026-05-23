const mongoose = require('mongoose');

const { Schema } = mongoose;

const ScheduleEventSchema = new Schema(
  {
    id: String,
    summary: String,
    location: String,
    description: String,
    start: { dateTime: String, timeZone: String },
    end: { dateTime: String, timeZone: String },
    recurrence: [String],
    colorId: String,
    source: String,
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    kind: { type: String, default: 'calendar#events' },
    timeZone: String,
    updated: String,
    items: [ScheduleEventSchema],
  },
  { _id: false }
);

const AvatarSchema = new Schema(
  {
    skin: String,
    hairColor: String,
    hairStyle: String,
    clothing: String,
    gender: { type: String, enum: ['female', 'male'], default: 'female' },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    school: { type: String, default: null },
    interests: { type: [String], default: [] },
    schedule: { type: ScheduleSchema, default: null },
    scheduleSource: {
      type: String,
      enum: ['demo', 'google', 'ical', null],
      default: null,
    },
    scheduleVisibility: {
      type: String,
      enum: ['private', 'friends', 'public'],
      default: 'friends',
    },
    locationStatus: {
      type: String,
      enum: ['pending', 'granted', 'denied'],
      default: 'pending',
    },
    avatar: { type: AvatarSchema, default: null },
    status: { type: String, default: 'around campus' },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret._id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
