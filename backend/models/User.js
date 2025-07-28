const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Joi = require('joi');

// Mongoose schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
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
 role: {
      type: String,
      enum: ['admin', 'local', 'emergency'],
      default: 'local', // default role if not supplied
    },
    
  password: {
  type: String,
  required: true,
  minlength: 8,
  validate: {
    validator: function (value) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(value);
    },
    message:
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
  },
   
  select: false,
},
  isSuperlocal: { type: Boolean, default: false },
  reputationScore: { type: Number, default: 0, min: 0, max: 100 },
  contributions: {
    verified: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 }
  },
  lastActive: Date,
  verifiedLandmarksAdded: { type: Number, default: 0 },
  verifiedRoutesAdded: { type: Number, default: 0 }
});

// Virtual field

userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Vote weight calculation

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
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      if (!/^\$2[aby]\$\d+\$/.test(this.password)) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Password comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Joi validation
const validateUser = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])'))
      .required()
      .label("Password"),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().label("Confirm Password")
  });
  return schema.validate(data);
};

// Export model and validation
const User = mongoose.model('User', userSchema);
module.exports = { User, validateUser };
