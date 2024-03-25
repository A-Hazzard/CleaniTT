// Mongoose schema and model for Report
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  photo: { type: String, required: true }, // Path to the photo file
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Define the userId as an ObjectId
    ref: 'User', // Reference the 'User' collection
    required: true // Assuming every report must be associated with a user
  }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
