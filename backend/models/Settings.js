// models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  verificationRadius: {
    type: Number,
    default: 500 // Default 500 meters
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);