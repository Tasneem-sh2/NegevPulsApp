const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], default: [] }, // Array of image paths
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      default: [0, 0]
    }
  }
}, { timestamps: true });

villageSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Village', villageSchema);