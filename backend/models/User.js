const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: false }, // Make optional
    lastName: { type: String, required: false }, // Make optional
    name: { type: String, required: true }, // Add this
    email: { 
      type: String, 
      required: true, 
      unique: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    password: { 
      type: String,
      required: true,
      select: false,
      validate: {
        validator: function(v) {
          // Check for bcrypt hash format or strong password before hashing
          if (/^\$2[aby]\$\d+\$/.test(v)) return true; // Already hashed
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
        },
        message: props => `Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character`
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
    },
    verifiedRoutesAdded: {
      type: Number,
     default: 0
    },

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
    else if (this.verifiedRoutesAdded && this.verifiedRoutesAdded > 0) {
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
// Add virtual fullName field
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      // Only hash if not already hashed
      if (!/^\$2[aby]\$\d+\$/.test(this.password)) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Change the validation schema to match your frontend
const validateUser = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"), // تغيير من object إلى string
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])'))
      .required()
      .label("Password"),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().label("Confirm Password"),
    role: Joi.string().valid("local", "emergency", "admin").required().label("Role"),
  });
  return schema.validate(data);
};
// At the bottom of models/User.js:
const User = mongoose.model('User', userSchema);
// Change this at the bottom of User.js:
module.exports = { User, validateUser }; // Keep this as is