const mongoose = require('mongoose');
const { User } = require('./User'); // Adjust the path as needed
const voteSchema = new mongoose.Schema({
  userId: {
    type: String,
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
  },
  timestamp: {  // Add this required field
    type: Date,
    default: Date.now
  }
}, { _id: false });
const landmarkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  color: { type: String, default: '#8B4513' },
  imageUrl: { type: String, default: '' },
  verified: { type: Boolean, default: false },
    status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'disputed'],
    default: 'pending'
  },
  verificationData: {
    totalWeight: Number,
    yesWeight: Number,
    noWeight: Number,
    confidenceScore: Number
  },
  votes: [voteSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });
// Add pre-save hook for automatic verification
landmarkSchema.pre('save', function(next) {
  if (this.isModified('votes')) {
    this.updateVerificationStatus();
  }
  next();
});

// Add method to calculate verification
// models/Landmark.js
// models/Landmark.js
landmarkSchema.methods.updateVerificationStatus = async function() {
  const now = new Date();

  // Calculate weights with decay
  const { totalWeight, yesWeight, noWeight } = this.votes.reduce((acc,
vote) => {
    const voteTime = vote.timestamp || now;
    const hoursOld = (now - voteTime) / (1000 * 60 * 60);
    const decayFactor = Math.exp(-0.005 * hoursOld);
    const effectiveWeight = (vote.weight || 1) * decayFactor;

    return {
      totalWeight: acc.totalWeight + effectiveWeight,
      yesWeight: vote.vote === 'yes' ? acc.yesWeight + effectiveWeight
: acc.yesWeight,
      noWeight: vote.vote === 'no' ? acc.noWeight + effectiveWeight :
acc.noWeight
    };
  }, { totalWeight: 0, yesWeight: 0, noWeight: 0 });

  const requiredWeight = 5.6; // ✅ ثابت

  const safeTotal = Math.max(1, totalWeight);

  // Calculate confidence
  const participationScore = Math.min(1, totalWeight / (requiredWeight
* 1.5)) * 50;
  const agreementScore = (yesWeight / safeTotal) * 50;
  const confidenceScore = Math.min(100, participationScore + agreementScore);

  // Update verification data
  this.verificationData = {
    totalWeight,
    yesWeight,
    noWeight,
    confidenceScore
  };

  // 🔧 Determine status - شروط ثابتة
  let statusChanged = false;
  const previousStatus = this.status;

  const approvalRate = yesWeight / safeTotal;
  const weightDifference = Math.abs(yesWeight - noWeight);

  // 🔧 شروط التحقق الثابتة
  if (totalWeight >= requiredWeight && approvalRate >= 0.8) {
    this.status = 'verified';
    this.verified = true;
    statusChanged = previousStatus !== 'verified';
  } else if (noWeight >= (requiredWeight * 0.6)) { // 3.36 وزن للرفض
    this.status = 'rejected';
    this.verified = false;
  } else if (weightDifference < 3 && totalWeight >= 3) {
    this.status = 'disputed';
  } else {
    this.status = 'pending';
  }

  // 🔧 منطق إضافي لمنع التعارض في الحالات الواضحة
  const hasRealConflict = () => {
    if (weightDifference >= 4) return false; // فرق كبير = لا تعارض

    // إذا كان هناك صوت سوبر واضح
    const superLocalVotes = this.votes.filter(v => v.weight >= 4);
    if (superLocalVotes.length > 0) {
      const superLocalYes = superLocalVotes.filter(v => v.vote ===
'yes').reduce((sum, v) => sum + v.weight, 0);
      const superLocalNo = superLocalVotes.filter(v => v.vote ===
'no').reduce((sum, v) => sum + v.weight, 0);

      // صوت سوبر واحد (4) يكفي لتجاوز التعارض
      if (superLocalYes >= 4 && yesWeight > noWeight) return false;
      if (superLocalNo >= 4 && noWeight > yesWeight) return false;
    }

    return weightDifference < 3 && totalWeight >= 3;
  };

  // تطبيق المنطق الجديد للتعارض
  if (this.status === 'disputed' && !hasRealConflict()) {
    this.status = 'pending';
  }

  // If status changed to verified, update creator's count
  if (statusChanged && this.status === 'verified') {
    await User.findByIdAndUpdate(
      this.createdBy,
      {
        $inc: {
          'verifiedLandmarksAdded': 1,
          'contributions.verified': 1
        }
      }
    );
  }

  return this;
};

module.exports = mongoose.model('Landmark', landmarkSchema);