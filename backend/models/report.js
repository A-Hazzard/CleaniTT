// Mongoose schema and model for Report
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  photo: { type: String, required: true }, // Path to the photo file
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
