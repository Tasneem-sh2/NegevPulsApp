const mongoose = require('mongoose');
const voteSchema = new mongoose.Schema({
  userId: {
    type: String,  // Changed from ObjectId to String
    required: true
  },
  vote: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  weight: {
    type: Number,
    default: 1
  }
});
const routeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  points: [{
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  }],
  color: { 
    type: String, 
    default: '#3A86FF',
    validate: {
      validator: (v) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v),
      message: props => `${props.value} is not a valid color!`
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verified: { type: Boolean, default: false },
 // In models/Route.js
  votes: [{
    userId: { type: String, required: true }, // Changed from ObjectId
    vote: { type: String, enum: ['yes', 'no'] },
    weight: { type: Number, default: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);