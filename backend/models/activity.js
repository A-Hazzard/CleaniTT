const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
  // Additional fields specific to each type of activity
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
