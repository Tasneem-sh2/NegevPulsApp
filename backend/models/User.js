const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
      password: { 
      type: String,
      required: true,
      select: false, // Hide by default in queries
      validate: {
        validator: function(v) {
          // Basic check for bcrypt hash format
          return /^\$2[aby]\$\d+\$/.test(v);
        },
        message: props => `${props.value} is not a valid bcrypt hash!`
      }
    },
    role: { 
      type: String, 
      required: true, 
      enum: ['local', 'emergency', 'admin'],
      default: 'local'
    },
    isSuperlocal: {
        type: Boolean,
        default: false
      },
      reputationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      contributions: {
        verified: { type: Number, default: 0 },
        rejected: { type: Number, default: 0 }
      },
    lastActive: Date, // For reputation decay
    verifiedLandmarksAdded: {
      type: Number,
      default: 0
    }
  });
// Add method to calculate weight
userSchema.methods.getVoteWeight = function() {
  let weight = 1.0; // Base weight
  
  // Super users get highest weight
  if (this.isSuperlocal) {
    weight = 4.0;
  } 
  // Users who have added verified landmarks get higher weight
  else if (this.verifiedLandmarksAdded && this.verifiedLandmarksAdded > 0) {
    weight = 2.0;
  }
  // Users with high reputation get higher weight
  else if (this.reputationScore && this.reputationScore >= 70) {
    weight = 2.0;
  }
  
  return weight;
};
// Password hashing middleware
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    console.log('Password being saved:', this.password);
    if (!/^\$2[aby]\$\d+\$/.test(this.password)) {
      console.error('Invalid hash format detected!');
      throw new Error('Corrupted password hash detected');
    }
  }
  next();
});

// Replace the existing comparePassword method with:
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Validation schema
const validateUser = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required().label("Name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().min(6).required().label("Password"),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().label("Confirm Password"),
    role: Joi.string().valid("local", "emergency", "admin").required().label("Role"),
  });
  return schema.validate(data);
};

// At the bottom of models/User.js:
const User = mongoose.model('User', userSchema);
// Change this at the bottom of User.js:
module.exports = { User, validateUser }; // Keep this as is